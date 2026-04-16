package com.oa.backend.service;

import com.oa.backend.annotation.OperationLogRecord;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oa.backend.entity.*;
import com.oa.backend.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

/**
 * 薪资引擎 Service
 * 职责：管理工资周期生命周期、结算计算、窗口期自动关闭。
 *
 * 周期状态流转：OPEN → WINDOW_OPEN → WINDOW_CLOSED → SETTLED → LOCKED
 * 窗口期到期由 {@link #autoCloseExpiredWindows()} 定时任务自动关闭，无手动关闭接口。
 *
 * 薪资公式（V5 后）：
 *   净薪资 = 基本工资 + 岗位工资 + 绩效奖金 + 加班费 − 请假扣款
 *          + Σ 固定补贴（三级覆盖） + Σ 临时补贴 − Σ 临时扣款
 *          + 保险补贴（COMPANY_PAID） / − 社保个人（MERGED）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PayrollEngine {

    private final PayrollCycleMapper cycleMapper;
    private final PayrollSlipMapper slipMapper;
    private final PayrollSlipItemMapper slipItemMapper;
    private final PayrollItemDefMapper itemDefMapper;
    private final EmployeeMapper employeeMapper;
    private final PositionMapper positionMapper;
    private final PositionLevelMapper positionLevelMapper;
    private final FormRecordMapper formRecordMapper;
    private final SocialInsuranceItemMapper socialInsuranceItemMapper;
    private final AllowanceResolutionService allowanceResolutionService;
    private final PayrollBonusService payrollBonusService;
    private final ObjectMapper objectMapper;

    // ── 周期管理 ──────────────────────────────────────────────────────────

    /**
     * 创建新的工资周期。
     */
    @Transactional
    public PayrollCycle createCycle(String period) {
        PayrollCycle existing = cycleMapper.findByPeriod(period);
        if (existing != null) {
            throw new IllegalStateException("周期 [" + period + "] 已存在");
        }

        YearMonth ym = YearMonth.parse(period);
        LocalDate startDate = ym.atDay(1);
        LocalDate endDate = ym.atEndOfMonth();
        LocalDate payDate = ym.plusMonths(1).atDay(15);

        PayrollCycle cycle = new PayrollCycle();
        cycle.setPeriod(period);
        cycle.setSettlementType("MONTHLY");
        cycle.setStartDate(startDate);
        cycle.setEndDate(endDate);
        cycle.setPayDate(payDate);
        cycle.setWindowDays(7);
        cycle.setStatus("OPEN");
        cycle.setVersion(1);
        cycle.setDeleted(0);
        cycle.setCreatedAt(LocalDateTime.now());
        cycle.setUpdatedAt(LocalDateTime.now());
        cycleMapper.insert(cycle);

        log.info("工资周期已创建: period={}, id={}", period, cycle.getId());
        return cycle;
    }

    /**
     * 开放申报窗口期。
     */
    @Transactional
    public PayrollCycle openWindow(Long cycleId) {
        PayrollCycle cycle = requireCycle(cycleId);
        if (!"OPEN".equals(cycle.getStatus())) {
            throw new IllegalStateException("周期状态为 [" + cycle.getStatus() + "]，无法开放申报窗口");
        }

        LocalDate today = LocalDate.now();
        int windowDays = cycle.getWindowDays() != null ? cycle.getWindowDays() : 7;

        cycle.setWindowStatus("OPEN");
        cycle.setWindowStartDate(today);
        cycle.setWindowEndDate(today.plusDays(windowDays - 1));
        cycle.setStatus("WINDOW_OPEN");
        cycle.setUpdatedAt(LocalDateTime.now());
        cycleMapper.updateById(cycle);

        log.info("申报窗口已开放: cycleId={}, 截止日={}", cycleId, cycle.getWindowEndDate());
        return cycle;
    }

    /**
     * 定时任务：每小时扫描并关闭已过期的申报窗口。
     */
    @Scheduled(fixedDelay = 3600000)
    @Transactional
    public void autoCloseExpiredWindows() {
        List<PayrollCycle> expired = cycleMapper.findExpiredOpenWindows();
        for (PayrollCycle cycle : expired) {
            cycle.setWindowStatus("CLOSED");
            cycle.setStatus("WINDOW_CLOSED");
            cycle.setUpdatedAt(LocalDateTime.now());
            cycleMapper.updateById(cycle);
            log.info("申报窗口已自动关闭: cycleId={}, period={}", cycle.getId(), cycle.getPeriod());
        }
    }

    // ── 结算 ──────────────────────────────────────────────────────────────

    /**
     * 预结算检查。
     */
    public List<PrecheckItem> precheck(Long cycleId) {
        requireCycle(cycleId);

        int publishedCount = slipMapper.countByStatus(cycleId, "PUBLISHED");
        boolean check1Pass = publishedCount == 0;

        long calculatingCount = cycleMapper.selectCount(
                new LambdaQueryWrapper<PayrollCycle>()
                        .in(PayrollCycle::getStatus, "CALCULATING", "SETTLING")
                        .ne(PayrollCycle::getId, cycleId)
                        .eq(PayrollCycle::getDeleted, 0)
        );
        boolean check2Pass = calculatingCount == 0;

        return List.of(
                new PrecheckItem("no_pending_slips", "无待处理工资条（PUBLISHED状态）", check1Pass,
                        check1Pass ? null : "存在 " + publishedCount + " 条 PUBLISHED 状态工资条，请确认员工均已处理"),
                new PrecheckItem("no_concurrent_settlement", "无并发结算任务", check2Pass,
                        check2Pass ? null : "存在其他周期正在结算中，请等待完成")
        );
    }

    /**
     * 正式结算。
     */
    @OperationLogRecord(action = "PAYROLL_SETTLE", targetType = "PAYROLL_CYCLE")
    @Transactional
    public PayrollCycle settle(Long cycleId) {
        PayrollCycle cycle = requireCycle(cycleId);

        if (!"WINDOW_CLOSED".equals(cycle.getStatus()) && !"OPEN".equals(cycle.getStatus())
                && !"WINDOW_OPEN".equals(cycle.getStatus())) {
            throw new IllegalStateException("周期状态为 [" + cycle.getStatus() + "]，无法执行结算");
        }

        List<PrecheckItem> checks = precheck(cycleId);
        boolean allPass = checks.stream().allMatch(PrecheckItem::pass);
        if (!allPass) {
            String failMsg = checks.stream()
                    .filter(c -> !c.pass())
                    .map(PrecheckItem::message)
                    .reduce("", (a, b) -> a + "; " + b);
            throw new IllegalStateException("预结算检查未通过: " + failMsg);
        }

        // 同步临时补贴审批状态：若开启审批开关，部分 PENDING 记录可能已被 CEO 审批完毕
        int synced = payrollBonusService.syncFromApprovalForms(cycleId);
        if (synced > 0) {
            log.info("临时补贴审批状态已同步: cycleId={}, changed={}", cycleId, synced);
        }

        initSystemItemDefs();

        List<Employee> employees = employeeMapper.selectList(
                new LambdaQueryWrapper<Employee>()
                        .eq(Employee::getAccountStatus, "ACTIVE")
                        .eq(Employee::getDeleted, 0)
        );

        SlipItemDefs defs = loadSlipItemDefs();

        for (Employee emp : employees) {
            calculateAndSaveSlip(cycle, emp, defs);
        }

        cycle.setStatus("SETTLED");
        cycle.setLockedAt(LocalDateTime.now());
        cycle.setUpdatedAt(LocalDateTime.now());
        cycleMapper.updateById(cycle);

        log.info("结算完成: cycleId={}, period={}, employeeCount={}", cycleId, cycle.getPeriod(), employees.size());
        return cycle;
    }

    // ── 核心：单员工工资计算 ────────────────────────────────────────────────

    private void calculateAndSaveSlip(PayrollCycle cycle, Employee emp, SlipItemDefs defs) {
        SalaryComponents comps = resolveFixedComponents(emp);
        BigDecimal baseSalary = comps.baseSalary;
        BigDecimal positionSalary = comps.positionSalary;
        BigDecimal performanceBonus = comps.performanceBonus;

        // 加班/请假 base 基数，根据岗位配置 overtime_base_type 决定
        BigDecimal overtimeBase = resolveRateBase(emp, comps, comps.overtimeBaseType, comps.overtimeBaseAmount);
        BigDecimal leaveBase = resolveRateBase(emp, comps, comps.leaveBaseType, null);

        OvertimeBreakdown otb = calculateOvertimeBreakdown(emp.getId(), cycle.getStartDate(), cycle.getEndDate());
        BigDecimal overtimeHours = otb.weekday.add(otb.weekend).add(otb.holiday);
        BigDecimal leaveHours = calculateLeaveHours(emp.getId(), cycle.getStartDate(), cycle.getEndDate());

        BigDecimal overtimeHourlyRate = hourlyRate(overtimeBase);
        BigDecimal leaveHourlyRate = hourlyRate(leaveBase);

        // 设计 §6.4：加班按 工作日/周末/节假日 倍率分别计算
        BigDecimal overtimePay = overtimeHourlyRate.multiply(otb.weekday).multiply(comps.overtimeRateWeekday)
                .add(overtimeHourlyRate.multiply(otb.weekend).multiply(comps.overtimeRateWeekend))
                .add(overtimeHourlyRate.multiply(otb.holiday).multiply(comps.overtimeRateHoliday))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal leaveDeduct = leaveHourlyRate.multiply(leaveHours).setScale(2, RoundingMode.HALF_UP);

        // 社保
        BigDecimal socialInsuranceAmount = calculateSocialInsurance(emp.getPositionId(), baseSalary,
                comps.socialInsuranceMode);
        boolean isCompanyPaid = "COMPANY_PAID".equals(comps.socialInsuranceMode);

        // 固定补贴（三级覆盖）
        List<AllowanceResolutionService.Resolved> allowances = allowanceResolutionService.resolveForEmployee(emp);
        BigDecimal allowanceTotal = BigDecimal.ZERO;
        for (AllowanceResolutionService.Resolved r : allowances) {
            allowanceTotal = allowanceTotal.add(r.amount());
        }

        // 临时补贴/扣款
        List<PayrollBonus> bonuses = payrollBonusService.listApprovedByCycleEmployee(cycle.getId(), emp.getId());
        BigDecimal tempEarning = BigDecimal.ZERO;
        BigDecimal tempDeduct = BigDecimal.ZERO;
        for (PayrollBonus b : bonuses) {
            if ("EARNING".equals(b.getType())) tempEarning = tempEarning.add(b.getAmount());
            else tempDeduct = tempDeduct.add(b.getAmount());
        }

        // 净收入
        BigDecimal netPay = baseSalary
                .add(positionSalary)
                .add(performanceBonus)
                .add(overtimePay)
                .subtract(leaveDeduct)
                .add(allowanceTotal)
                .add(tempEarning)
                .subtract(tempDeduct);
        if (!isCompanyPaid) {
            netPay = netPay.subtract(socialInsuranceAmount);
        }
        netPay = netPay.max(BigDecimal.ZERO);

        // 保存工资条
        PayrollSlip slip = new PayrollSlip();
        slip.setCycleId(cycle.getId());
        slip.setEmployeeId(emp.getId());
        slip.setVersion(1);
        slip.setStatus("PUBLISHED");
        slip.setNetPay(netPay);
        slip.setCreatedAt(LocalDateTime.now());
        slip.setUpdatedAt(LocalDateTime.now());
        slip.setDeleted(0);
        slipMapper.insert(slip);

        // 明细项
        if (baseSalary.compareTo(BigDecimal.ZERO) > 0) {
            saveSlipItem(slip.getId(), defs.baseSalary.getId(), baseSalary, "基本工资");
        }
        if (positionSalary.compareTo(BigDecimal.ZERO) > 0) {
            saveSlipItem(slip.getId(), defs.positionSalary.getId(), positionSalary, "岗位工资");
        }
        if (performanceBonus.compareTo(BigDecimal.ZERO) > 0) {
            saveSlipItem(slip.getId(), defs.performanceBonus.getId(), performanceBonus, "绩效奖金");
        }
        if (overtimePay.compareTo(BigDecimal.ZERO) > 0) {
            String breakdown = String.format("加班费 工作日%s × %s 倍 + 周末%s × %s 倍 + 节假日%s × %s 倍 (基数 %s/小时)",
                    otb.weekday, comps.overtimeRateWeekday,
                    otb.weekend, comps.overtimeRateWeekend,
                    otb.holiday, comps.overtimeRateHoliday,
                    overtimeHourlyRate);
            saveSlipItem(slip.getId(), defs.overtime.getId(), overtimePay, breakdown);
        }
        if (leaveDeduct.compareTo(BigDecimal.ZERO) > 0) {
            saveSlipItem(slip.getId(), defs.leaveDeduct.getId(), leaveDeduct.negate(),
                    "请假扣款 " + leaveHours + " 小时 × " + leaveHourlyRate);
        }
        for (AllowanceResolutionService.Resolved r : allowances) {
            PayrollItemDef d = findOrCreateItemDef("ALLOWANCE_" + r.def().getCode(),
                    r.def().getName(), "EARNING", 20 + (r.def().getDisplayOrder() == null ? 0 : r.def().getDisplayOrder()));
            saveSlipItem(slip.getId(), d.getId(), r.amount(), r.def().getName());
        }
        for (PayrollBonus b : bonuses) {
            PayrollItemDef d = "EARNING".equals(b.getType()) ? defs.temporaryBonus : defs.temporaryDeduct;
            BigDecimal signed = "EARNING".equals(b.getType()) ? b.getAmount() : b.getAmount().negate();
            String note = b.getName() + (b.getRemark() != null && !b.getRemark().isBlank() ? " — " + b.getRemark() : "");
            saveSlipItem(slip.getId(), d.getId(), signed, note);
        }
        if (socialInsuranceAmount.compareTo(BigDecimal.ZERO) > 0) {
            if (isCompanyPaid) {
                saveSlipItem(slip.getId(), defs.companySubsidy.getId(), socialInsuranceAmount,
                        "保险补贴（公司代缴，记录用）");
            } else {
                saveSlipItem(slip.getId(), defs.socialInsurance.getId(), socialInsuranceAmount.negate(),
                        "社会保险个人部分");
            }
        }
    }

    /**
     * 解析员工薪资固定项：基本工资 / 岗位工资 / 绩效奖金 / 加班基数 + 倍率 / 社保模式等。
     * 优先级：position_level override > position default。
     */
    private SalaryComponents resolveFixedComponents(Employee emp) {
        SalaryComponents c = new SalaryComponents();
        if (emp.getPositionId() == null) return c;

        Position pos = positionMapper.selectById(emp.getPositionId());
        if (pos == null) return c;

        c.baseSalary = firstNonNull(pos.getBaseSalary(), BigDecimal.ZERO);
        c.positionSalary = firstNonNull(pos.getPositionSalary(), BigDecimal.ZERO);
        c.performanceBonus = Boolean.TRUE.equals(pos.getHasPerformanceBonus())
                ? firstNonNull(pos.getDefaultPerformanceBonus(), BigDecimal.ZERO)
                : BigDecimal.ZERO;
        c.overtimeBaseType = pos.getOvertimeBaseType();
        c.overtimeBaseAmount = pos.getOvertimeBaseAmount();
        c.overtimeRateWeekday = firstNonNull(pos.getOvertimeRateWeekday(), BigDecimal.valueOf(1.5));
        c.overtimeRateWeekend = firstNonNull(pos.getOvertimeRateWeekend(), BigDecimal.valueOf(2.0));
        c.overtimeRateHoliday = firstNonNull(pos.getOvertimeRateHoliday(), BigDecimal.valueOf(3.0));
        c.leaveBaseType = pos.getLeaveDeductBaseType();
        c.socialInsuranceMode = pos.getSocialInsuranceMode();

        if (emp.getLevelId() != null) {
            PositionLevel level = positionLevelMapper.selectById(emp.getLevelId());
            if (level != null && (level.getDeleted() == null || level.getDeleted() == 0)) {
                if (level.getBaseSalaryOverride() != null) c.baseSalary = level.getBaseSalaryOverride();
                if (level.getPositionSalaryOverride() != null) c.positionSalary = level.getPositionSalaryOverride();
                if (level.getPerformanceBonusOverride() != null
                        && Boolean.TRUE.equals(pos.getHasPerformanceBonus())) {
                    c.performanceBonus = level.getPerformanceBonusOverride();
                }
            }
        }

        // 设计 §6.4：员工档案 performance_ratio (%) 设置时，按 baseSalary * ratio% 应用，覆盖固定金额
        if (Boolean.TRUE.equals(pos.getHasPerformanceBonus())
                && emp.getPerformanceRatio() != null
                && emp.getPerformanceRatio().compareTo(BigDecimal.ZERO) > 0) {
            c.performanceBonus = c.baseSalary
                    .multiply(emp.getPerformanceRatio())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        return c;
    }

    /**
     * 根据 base_type 决定加班/请假计算基数。
     * BASE: 基本工资；TOTAL: 基本 + 岗位 + 绩效；CUSTOM: overtimeBaseAmount（仅加班）；其它/null: 基本。
     */
    private BigDecimal resolveRateBase(Employee emp, SalaryComponents c, String baseType, BigDecimal customAmount) {
        if ("TOTAL".equals(baseType)) {
            return c.baseSalary.add(c.positionSalary).add(c.performanceBonus);
        }
        if ("CUSTOM".equals(baseType) && customAmount != null) {
            return customAmount;
        }
        return c.baseSalary;
    }

    private BigDecimal hourlyRate(BigDecimal monthly) {
        if (monthly == null || monthly.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;
        BigDecimal daily = monthly.divide(BigDecimal.valueOf(21.75), 4, RoundingMode.HALF_UP);
        return daily.divide(BigDecimal.valueOf(8), 2, RoundingMode.HALF_UP);
    }

    // ── Private helpers ───────────────────────────────────────────────────

    /**
     * 加班时长按工作日/周末/节假日分桶累计。
     * 桶归属判定（设计 §6.4）：
     *   1. 优先使用 form_data.overtimeType（用户提交时勾选"工作日加班/周末加班/节假日加班"）
     *   2. 其次按日期是否周末判定（DayOfWeek SAT/SUN → weekend，否则 weekday）
     *   3. holiday 仅当 overtimeType 明确标记为 节假日 时计入；无国家节假日表，避免误判
     */
    OvertimeBreakdown calculateOvertimeBreakdown(Long employeeId, LocalDate start, LocalDate end) {
        OvertimeBreakdown out = new OvertimeBreakdown();
        List<FormRecord> records = formRecordMapper.selectList(
                new LambdaQueryWrapper<FormRecord>()
                        .eq(FormRecord::getSubmitterId, employeeId)
                        .eq(FormRecord::getFormType, "OVERTIME")
                        .eq(FormRecord::getStatus, "APPROVED")
                        .eq(FormRecord::getDeleted, 0)
        );

        for (FormRecord r : records) {
            try {
                if (r.getFormData() == null) continue;
                Map<String, Object> data = objectMapper.readValue(r.getFormData(),
                        new TypeReference<Map<String, Object>>() {});
                String startTimeStr = (String) data.get("startTime");
                String endTimeStr = (String) data.get("endTime");
                String dateStr = (String) data.get("date");
                String overtimeType = (String) data.get("overtimeType");
                if (startTimeStr == null || endTimeStr == null) continue;
                int[] st = parseTime(startTimeStr);
                int[] et = parseTime(endTimeStr);
                double hours = (et[0] * 60 + et[1] - st[0] * 60 - st[1]) / 60.0;
                if (hours <= 0) continue;
                LocalDate date = null;
                if (dateStr != null && dateStr.length() >= 10) {
                    try { date = LocalDate.parse(dateStr.substring(0, 10)); } catch (Exception ignored) {}
                }
                if (date != null && (date.isBefore(start) || date.isAfter(end))) continue;
                BigDecimal bucket = BigDecimal.valueOf(hours);
                String t = overtimeType == null ? "" : overtimeType;
                boolean isHoliday = "HOLIDAY".equals(t) || "节假日加班".equals(t) || "holiday".equalsIgnoreCase(t);
                boolean isWeekend = "WEEKEND".equals(t) || "周末加班".equals(t) || "weekend".equalsIgnoreCase(t)
                        || (date != null && (date.getDayOfWeek() == java.time.DayOfWeek.SATURDAY
                                || date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY));
                if (isHoliday) out.holiday = out.holiday.add(bucket);
                else if (isWeekend) out.weekend = out.weekend.add(bucket);
                else out.weekday = out.weekday.add(bucket);
            } catch (Exception e) {
                log.warn("解析加班时长失败: formId={}", r.getId(), e);
            }
        }
        out.weekday = out.weekday.setScale(1, RoundingMode.HALF_UP);
        out.weekend = out.weekend.setScale(1, RoundingMode.HALF_UP);
        out.holiday = out.holiday.setScale(1, RoundingMode.HALF_UP);
        return out;
    }

    /** 加班分桶结果：weekday/weekend/holiday 小时数 */
    static class OvertimeBreakdown {
        BigDecimal weekday = BigDecimal.ZERO;
        BigDecimal weekend = BigDecimal.ZERO;
        BigDecimal holiday = BigDecimal.ZERO;
    }

    private BigDecimal calculateLeaveHours(Long employeeId, LocalDate start, LocalDate end) {
        List<FormRecord> records = formRecordMapper.selectList(
                new LambdaQueryWrapper<FormRecord>()
                        .eq(FormRecord::getSubmitterId, employeeId)
                        .eq(FormRecord::getFormType, "LEAVE")
                        .eq(FormRecord::getStatus, "APPROVED")
                        .eq(FormRecord::getDeleted, 0)
        );

        BigDecimal total = BigDecimal.ZERO;
        for (FormRecord r : records) {
            try {
                if (r.getFormData() == null) continue;
                Map<String, Object> data = objectMapper.readValue(r.getFormData(),
                        new TypeReference<Map<String, Object>>() {});
                Object daysObj = data.get("days");
                if (daysObj != null) {
                    double days = Double.parseDouble(daysObj.toString());
                    total = total.add(BigDecimal.valueOf(days * 8));
                }
            } catch (Exception e) {
                log.warn("解析请假天数失败: formId={}", r.getId(), e);
            }
        }
        return total.setScale(1, RoundingMode.HALF_UP);
    }

    private int[] parseTime(String hhmm) {
        String[] parts = hhmm.split(":");
        return new int[]{ Integer.parseInt(parts[0]), Integer.parseInt(parts[1]) };
    }

    private void saveSlipItem(Long slipId, Long itemDefId, BigDecimal amount, String remark) {
        PayrollSlipItem item = new PayrollSlipItem();
        item.setSlipId(slipId);
        item.setItemDefId(itemDefId);
        item.setAmount(amount);
        item.setRemark(remark);
        item.setCreatedAt(LocalDateTime.now());
        item.setUpdatedAt(LocalDateTime.now());
        slipItemMapper.insert(item);
    }

    private PayrollCycle requireCycle(Long cycleId) {
        PayrollCycle cycle = cycleMapper.selectById(cycleId);
        if (cycle == null || cycle.getDeleted() == 1) {
            throw new IllegalStateException("工资周期 [" + cycleId + "] 不存在");
        }
        return cycle;
    }

    private BigDecimal calculateSocialInsurance(Long positionId, BigDecimal baseSalary, String mode) {
        if (positionId == null) return BigDecimal.ZERO;

        List<SocialInsuranceItem> items = socialInsuranceItemMapper.selectList(
                new LambdaQueryWrapper<SocialInsuranceItem>()
                        .eq(SocialInsuranceItem::getPositionId, positionId)
                        .eq(SocialInsuranceItem::getIsEnabled, true)
                        .eq(SocialInsuranceItem::getDeleted, 0)
        );
        if (items.isEmpty()) return BigDecimal.ZERO;

        BigDecimal total = BigDecimal.ZERO;
        for (SocialInsuranceItem item : items) {
            if (item.getEmployeeRate() == null) continue;
            BigDecimal contribution = baseSalary.multiply(item.getEmployeeRate())
                    .setScale(2, RoundingMode.HALF_UP);
            total = total.add(contribution);
        }
        return total;
    }

    /**
     * 初始化系统内置工资项定义（首次使用时自动创建）
     */
    private void initSystemItemDefs() {
        ensureItemDef("BASE_SALARY", "基本工资", "EARNING", 1, true);
        ensureItemDef("POSITION_SALARY", "岗位工资", "EARNING", 11, true);
        ensureItemDef("PERFORMANCE_BONUS", "绩效奖金", "EARNING", 12, true);
        ensureItemDef("OVERTIME_PAY", "加班费", "EARNING", 2, true);
        ensureItemDef("LEAVE_DEDUCT", "请假扣款", "DEDUCTION", 3, true);
        ensureItemDef("SOCIAL_INSURANCE", "社会保险（个人）", "DEDUCTION", 4, true);
        ensureItemDef("COMPANY_PAID_SUBSIDY", "保险补贴", "EARNING", 5, true);
        ensureItemDef("TEMPORARY_BONUS", "临时补贴", "EARNING", 90, true);
        ensureItemDef("TEMPORARY_DEDUCT", "临时扣款", "DEDUCTION", 91, true);
    }

    private SlipItemDefs loadSlipItemDefs() {
        SlipItemDefs d = new SlipItemDefs();
        d.baseSalary = findOrCreateItemDef("BASE_SALARY", "基本工资", "EARNING", 1);
        d.positionSalary = findOrCreateItemDef("POSITION_SALARY", "岗位工资", "EARNING", 11);
        d.performanceBonus = findOrCreateItemDef("PERFORMANCE_BONUS", "绩效奖金", "EARNING", 12);
        d.overtime = findOrCreateItemDef("OVERTIME_PAY", "加班费", "EARNING", 2);
        d.leaveDeduct = findOrCreateItemDef("LEAVE_DEDUCT", "请假扣款", "DEDUCTION", 3);
        d.socialInsurance = findOrCreateItemDef("SOCIAL_INSURANCE", "社会保险（个人）", "DEDUCTION", 4);
        d.companySubsidy = findOrCreateItemDef("COMPANY_PAID_SUBSIDY", "保险补贴", "EARNING", 5);
        d.temporaryBonus = findOrCreateItemDef("TEMPORARY_BONUS", "临时补贴", "EARNING", 90);
        d.temporaryDeduct = findOrCreateItemDef("TEMPORARY_DEDUCT", "临时扣款", "DEDUCTION", 91);
        return d;
    }

    private void ensureItemDef(String code, String name, String type, int order, boolean system) {
        Long count = itemDefMapper.selectCount(
                new LambdaQueryWrapper<PayrollItemDef>()
                        .eq(PayrollItemDef::getCode, code)
                        .eq(PayrollItemDef::getDeleted, 0)
        );
        if (count == 0) {
            PayrollItemDef def = new PayrollItemDef();
            def.setCode(code);
            def.setName(name);
            def.setType(type);
            def.setDisplayOrder(order);
            def.setIsEnabled(true);
            def.setIsSystem(system);
            def.setCreatedAt(LocalDateTime.now());
            def.setUpdatedAt(LocalDateTime.now());
            def.setDeleted(0);
            itemDefMapper.insert(def);
        }
    }

    private PayrollItemDef findOrCreateItemDef(String code, String name, String type, int order) {
        PayrollItemDef existing = itemDefMapper.selectOne(
                new LambdaQueryWrapper<PayrollItemDef>()
                        .eq(PayrollItemDef::getCode, code)
                        .eq(PayrollItemDef::getDeleted, 0)
        );
        if (existing != null) return existing;
        ensureItemDef(code, name, type, order, false);
        return itemDefMapper.selectOne(
                new LambdaQueryWrapper<PayrollItemDef>()
                        .eq(PayrollItemDef::getCode, code)
                        .eq(PayrollItemDef::getDeleted, 0)
        );
    }

    private static <T> T firstNonNull(T a, T fallback) {
        return a != null ? a : fallback;
    }

    // ── Inner types ───────────────────────────────────────────────────────

    public record PrecheckItem(String key, String label, boolean pass, String message) {}

    /** 员工固定薪资项组合 */
    private static class SalaryComponents {
        BigDecimal baseSalary = BigDecimal.ZERO;
        BigDecimal positionSalary = BigDecimal.ZERO;
        BigDecimal performanceBonus = BigDecimal.ZERO;
        String overtimeBaseType;
        BigDecimal overtimeBaseAmount;
        BigDecimal overtimeRateWeekday = BigDecimal.valueOf(1.5);
        BigDecimal overtimeRateWeekend = BigDecimal.valueOf(2.0);
        BigDecimal overtimeRateHoliday = BigDecimal.valueOf(3.0);
        String leaveBaseType;
        String socialInsuranceMode;
    }

    /** 结算时复用的工资项定义引用 */
    private static class SlipItemDefs {
        PayrollItemDef baseSalary;
        PayrollItemDef positionSalary;
        PayrollItemDef performanceBonus;
        PayrollItemDef overtime;
        PayrollItemDef leaveDeduct;
        PayrollItemDef socialInsurance;
        PayrollItemDef companySubsidy;
        PayrollItemDef temporaryBonus;
        PayrollItemDef temporaryDeduct;
    }
}
