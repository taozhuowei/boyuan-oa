package com.oa.backend.service;

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
    private final FormRecordMapper formRecordMapper;
    private final SocialInsuranceItemMapper socialInsuranceItemMapper;
    private final ObjectMapper objectMapper;

    // ── 周期管理 ──────────────────────────────────────────────────────────

    /**
     * 创建新的工资周期。
     *
     * @param period 周期标识，如 "2026-04"
     * @return 创建的 PayrollCycle
     */
    @Transactional
    public PayrollCycle createCycle(String period) {
        // 防重
        PayrollCycle existing = cycleMapper.findByPeriod(period);
        if (existing != null) {
            throw new IllegalStateException("周期 [" + period + "] 已存在");
        }

        YearMonth ym = YearMonth.parse(period);
        LocalDate startDate = ym.atDay(1);
        LocalDate endDate = ym.atEndOfMonth();
        // 发薪日为次月15日（遇周末顺延，此处简化为固定15日）
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
     * 窗口开放后，员工可提交考勤申报；窗口截止日由 Scheduler 自动关闭。
     *
     * @param cycleId 周期 ID
     * @return 更新后的周期
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
     * 强制检查 2 项：① 无 PENDING_REVIEW 状态 PayrollSlip；② 无 CALCULATING 状态 PayrollCycle
     *
     * @param cycleId 周期 ID
     * @return 检查结果列表
     */
    public List<PrecheckItem> precheck(Long cycleId) {
        requireCycle(cycleId);

        // 检查1：无 PUBLISHED 未确认工资条（本周期）
        int publishedCount = slipMapper.countByStatus(cycleId, "PUBLISHED");
        boolean check1Pass = publishedCount == 0;

        // 检查2：无其他 CALCULATING 或 SETTLING 状态的周期
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
     * 执行预检查 → 计算每个员工的工资 → 生成 PayrollSlip + PayrollSlipItem → 锁定周期。
     *
     * @param cycleId 周期 ID
     * @return 结算后的周期
     */
    @Transactional
    public PayrollCycle settle(Long cycleId) {
        PayrollCycle cycle = requireCycle(cycleId);

        if (!"WINDOW_CLOSED".equals(cycle.getStatus()) && !"OPEN".equals(cycle.getStatus())
                && !"WINDOW_OPEN".equals(cycle.getStatus())) {
            throw new IllegalStateException("周期状态为 [" + cycle.getStatus() + "]，无法执行结算");
        }

        // 执行预检查
        List<PrecheckItem> checks = precheck(cycleId);
        boolean allPass = checks.stream().allMatch(PrecheckItem::pass);
        if (!allPass) {
            String failMsg = checks.stream()
                    .filter(c -> !c.pass())
                    .map(PrecheckItem::message)
                    .reduce("", (a, b) -> a + "; " + b);
            throw new IllegalStateException("预结算检查未通过: " + failMsg);
        }

        // 确保系统工资项定义存在
        initSystemItemDefs();

        // 获取所有活跃员工
        List<Employee> employees = employeeMapper.selectList(
                new LambdaQueryWrapper<Employee>()
                        .eq(Employee::getAccountStatus, "ACTIVE")
                        .eq(Employee::getDeleted, 0)
        );

        // 加载工资项定义
        PayrollItemDef baseSalaryDef = findOrCreateItemDef("BASE_SALARY", "基本工资", "EARNING", 1);
        PayrollItemDef overtimeDef = findOrCreateItemDef("OVERTIME_PAY", "加班费", "EARNING", 2);
        PayrollItemDef leaveDeductDef = findOrCreateItemDef("LEAVE_DEDUCT", "请假扣款", "DEDUCTION", 3);
        PayrollItemDef socialInsuranceDef = findOrCreateItemDef("SOCIAL_INSURANCE", "社会保险（个人）", "DEDUCTION", 4);
        PayrollItemDef companyPaidSubsidyDef = findOrCreateItemDef("COMPANY_PAID_SUBSIDY", "社保补贴（公司代缴）", "EARNING", 5);

        for (Employee emp : employees) {
            calculateAndSaveSlip(cycle, emp, baseSalaryDef, overtimeDef, leaveDeductDef,
                    socialInsuranceDef, companyPaidSubsidyDef);
        }

        // 锁定周期
        cycle.setStatus("SETTLED");
        cycle.setLockedAt(LocalDateTime.now());
        cycle.setUpdatedAt(LocalDateTime.now());
        cycleMapper.updateById(cycle);

        log.info("结算完成: cycleId={}, period={}, employeeCount={}", cycleId, cycle.getPeriod(), employees.size());
        return cycle;
    }

    // ── Private helpers ───────────────────────────────────────────────────

    /**
     * 计算并保存单个员工的工资条
     *
     * @param socialInsuranceDef   个人社保扣款项定义（MERGED 模式使用）
     * @param companyPaidSubsidyDef 公司代缴补贴项定义（COMPANY_PAID 模式使用）
     */
    private void calculateAndSaveSlip(PayrollCycle cycle, Employee emp,
                                       PayrollItemDef baseDef, PayrollItemDef overtimeDef, PayrollItemDef leaveDef,
                                       PayrollItemDef socialInsuranceDef, PayrollItemDef companyPaidSubsidyDef) {
        // 获取基本工资及社保模式（从岗位配置读取）
        BigDecimal baseSalary = BigDecimal.ZERO;
        String socialInsuranceMode = null;
        if (emp.getPositionId() != null) {
            Position pos = positionMapper.selectById(emp.getPositionId());
            if (pos != null) {
                if (pos.getBaseSalary() != null) baseSalary = pos.getBaseSalary();
                socialInsuranceMode = pos.getSocialInsuranceMode();
            }
        }

        // 统计审批通过的加班时长（小时）
        BigDecimal overtimeHours = calculateOvertimeHours(emp.getId(), cycle.getStartDate(), cycle.getEndDate());

        // 统计审批通过的请假时长（小时）
        BigDecimal leaveHours = calculateLeaveHours(emp.getId(), cycle.getStartDate(), cycle.getEndDate());

        // 计算日薪（月薪 / 21.75 工作日）
        BigDecimal dailyRate = baseSalary.divide(BigDecimal.valueOf(21.75), 2, RoundingMode.HALF_UP);
        BigDecimal hourlyRate = dailyRate.divide(BigDecimal.valueOf(8), 2, RoundingMode.HALF_UP);

        // 默认加班倍率 1.5（简化，实际读岗位配置）
        BigDecimal overtimePay = hourlyRate.multiply(overtimeHours).multiply(BigDecimal.valueOf(1.5))
                .setScale(2, RoundingMode.HALF_UP);

        // 请假扣款（按实际时长扣，默认100%，即 hourlyRate * hours）
        BigDecimal leaveDeduct = hourlyRate.multiply(leaveHours).setScale(2, RoundingMode.HALF_UP);

        // 计算社保（根据岗位社保模式，null/empty 视为 MERGED）
        BigDecimal socialInsuranceAmount = calculateSocialInsurance(emp.getPositionId(), baseSalary, socialInsuranceMode);
        boolean isCompanyPaid = "COMPANY_PAID".equals(socialInsuranceMode);

        // 净收入：MERGED 模式扣减个人社保；COMPANY_PAID 模式不扣
        BigDecimal netPay = baseSalary.add(overtimePay).subtract(leaveDeduct);
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

        // 保存工资项明细
        saveSlipItem(slip.getId(), baseDef.getId(), baseSalary, "基本工资");
        if (overtimePay.compareTo(BigDecimal.ZERO) > 0) {
            saveSlipItem(slip.getId(), overtimeDef.getId(), overtimePay,
                    "加班费 " + overtimeHours + " 小时 × " + hourlyRate + " × 1.5");
        }
        if (leaveDeduct.compareTo(BigDecimal.ZERO) > 0) {
            saveSlipItem(slip.getId(), leaveDef.getId(), leaveDeduct.negate(),
                    "请假扣款 " + leaveHours + " 小时 × " + hourlyRate);
        }
        // 社保明细：MERGED→扣款（负数），COMPANY_PAID→补贴（正数，仅记录）
        if (socialInsuranceAmount.compareTo(BigDecimal.ZERO) > 0) {
            if (isCompanyPaid) {
                saveSlipItem(slip.getId(), companyPaidSubsidyDef.getId(), socialInsuranceAmount,
                        "社保补贴（公司代缴，记录用）");
            } else {
                saveSlipItem(slip.getId(), socialInsuranceDef.getId(), socialInsuranceAmount.negate(),
                        "社会保险个人部分");
            }
        }
    }

    /**
     * 查询员工在周期内已通过审批的加班时长（OVERTIME 类型表单）
     */
    private BigDecimal calculateOvertimeHours(Long employeeId, LocalDate start, LocalDate end) {
        List<FormRecord> records = formRecordMapper.selectList(
                new LambdaQueryWrapper<FormRecord>()
                        .eq(FormRecord::getSubmitterId, employeeId)
                        .eq(FormRecord::getFormType, "OVERTIME")
                        .eq(FormRecord::getStatus, "APPROVED")
                        .eq(FormRecord::getDeleted, 0)
        );

        BigDecimal total = BigDecimal.ZERO;
        for (FormRecord r : records) {
            try {
                if (r.getFormData() == null) continue;
                Map<String, Object> data = objectMapper.readValue(r.getFormData(),
                        new TypeReference<Map<String, Object>>() {});
                String startTimeStr = (String) data.get("startTime");
                String endTimeStr = (String) data.get("endTime");
                if (startTimeStr != null && endTimeStr != null) {
                    // 简化计算：解析 HH:mm 格式
                    int[] st = parseTime(startTimeStr);
                    int[] et = parseTime(endTimeStr);
                    double hours = (et[0] * 60 + et[1] - st[0] * 60 - st[1]) / 60.0;
                    if (hours > 0) total = total.add(BigDecimal.valueOf(hours));
                }
            } catch (Exception e) {
                log.warn("解析加班时长失败: formId={}", r.getId(), e);
            }
        }
        return total.setScale(1, RoundingMode.HALF_UP);
    }

    /**
     * 查询员工在周期内已通过审批的请假时长（LEAVE 类型表单，按天数计算）
     */
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
                    total = total.add(BigDecimal.valueOf(days * 8)); // 1天=8小时
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

    /**
     * 计算员工社保金额。
     *
     * 数据来源：social_insurance_item 表按 position_id 过滤，以 employee_rate * baseSalary 累加。
     * 若岗位无社保项，返回 ZERO。
     *
     * @param positionId  岗位 ID（可为 null）
     * @param baseSalary  月基本工资，用作缴费基数
     * @param mode        社保模式（"COMPANY_PAID" / null/"MERGED"）
     * @return 社保金额（恒为非负数，由调用方决定正负方向）
     */
    private BigDecimal calculateSocialInsurance(Long positionId, BigDecimal baseSalary, String mode) {
        if (positionId == null) return BigDecimal.ZERO;

        List<SocialInsuranceItem> items = socialInsuranceItemMapper.selectList(
                new LambdaQueryWrapper<SocialInsuranceItem>()
                        .eq(SocialInsuranceItem::getPositionId, positionId)
                        .eq(SocialInsuranceItem::getIsEnabled, true)
                        .eq(SocialInsuranceItem::getDeleted, 0)
        );

        if (items.isEmpty()) return BigDecimal.ZERO;

        // MERGED 模式：按 employee_rate 计算个人缴纳部分
        // COMPANY_PAID 模式：按 employee_rate 计算公司代缴金额（记录用）
        // 两种模式金额计算逻辑相同，区别由调用方处理（扣款 vs 补贴）
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
        ensureItemDef("OVERTIME_PAY", "加班费", "EARNING", 2, true);
        ensureItemDef("LEAVE_DEDUCT", "请假扣款", "DEDUCTION", 3, true);
        ensureItemDef("SOCIAL_INSURANCE", "社会保险（个人）", "DEDUCTION", 4, true);
        ensureItemDef("COMPANY_PAID_SUBSIDY", "社保补贴（公司代缴）", "EARNING", 5, true);
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
        ensureItemDef(code, name, type, order, true);
        return itemDefMapper.selectOne(
                new LambdaQueryWrapper<PayrollItemDef>()
                        .eq(PayrollItemDef::getCode, code)
                        .eq(PayrollItemDef::getDeleted, 0)
        );
    }

    // ── Inner types ───────────────────────────────────────────────────────

    /**
     * 预结算检查项结果
     */
    public record PrecheckItem(String key, String label, boolean pass, String message) {}
}
