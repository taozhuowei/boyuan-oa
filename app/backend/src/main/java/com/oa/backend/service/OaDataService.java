package com.oa.backend.service;

import com.oa.backend.dto.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * OA 业务数据服务 - 内存级数据管理
 * 用于演示环境的快速部署与零配置运行
 */
@Service
@RequiredArgsConstructor
public class OaDataService {

    // 员工数据存储
    private final Map<Long, EmployeeData> employees = new ConcurrentHashMap<>();
    private final AtomicLong employeeSequence = new AtomicLong(0);

    // 项目数据存储
    private final Map<Long, ProjectData> projects = new ConcurrentHashMap<>();
    private final AtomicLong projectSequence = new AtomicLong(0);

    // 表单数据存储
    private final Map<Long, FormData> forms = new ConcurrentHashMap<>();
    private final AtomicLong formSequence = new AtomicLong(0);

    // 工资周期数据存储
    private final Map<Long, PayrollCycleData> payrollCycles = new ConcurrentHashMap<>();
    private final AtomicLong payrollCycleSequence = new AtomicLong(0);

    // 工资单数据存储
    private final Map<Long, PayrollSlipData> payrollSlips = new ConcurrentHashMap<>();
    private final AtomicLong payrollSlipSequence = new AtomicLong(0);

    // 备份任务数据存储
    private final Map<Long, BackupTaskData> backupTasks = new ConcurrentHashMap<>();
    private final AtomicLong backupTaskSequence = new AtomicLong(0);

    // 清理任务数据存储
    private final Map<Long, CleanupTaskData> cleanupTasks = new ConcurrentHashMap<>();
    private final AtomicLong cleanupTaskSequence = new AtomicLong(0);

    // 通知数据存储
    private final Map<Long, NotificationData> notifications = new ConcurrentHashMap<>();
    private final AtomicLong notificationSequence = new AtomicLong(0);

    // 保留策略数据存储
    private final Map<Long, RetentionPolicyData> retentionPolicies = new ConcurrentHashMap<>();
    private final AtomicLong retentionPolicySequence = new AtomicLong(0);

    // 保留提醒数据存储
    private final Map<Long, RetentionReminderData> retentionReminders = new ConcurrentHashMap<>();
    private final AtomicLong retentionReminderSequence = new AtomicLong(0);

    @PostConstruct
    void init() {
        initEmployees();
        initProjects();
        initPayrollCycles();
        initRetentionPolicies();
        initNotifications();
    }

    private void initEmployees() {
        seedEmployee(1L, "E001", "张晓宁", "综合管理部", null, "OFFICE", LocalDate.of(2022, 3, 15), "ACTIVE", "13800138001", "zhangxn@oa.com");
        seedEmployee(2L, "E002", "赵铁柱", "施工一部", "P001", "LABOR", LocalDate.of(2021, 6, 1), "ACTIVE", "13800138002", "zhaotz@oa.com");
        seedEmployee(3L, "E003", "李静", "财务管理部", null, "OFFICE", LocalDate.of(2020, 1, 10), "ACTIVE", "13800138003", "lijing@oa.com");
        seedEmployee(4L, "E004", "王建国", "项目一部", "P001", "OFFICE", LocalDate.of(2019, 8, 20), "ACTIVE", "13800138004", "wangjg@oa.com");
        seedEmployee(5L, "E005", "陈明远", "运营管理部", null, "OFFICE", LocalDate.of(2018, 5, 1), "ACTIVE", "13800138005", "chenmy@oa.com");
        seedEmployee(6L, "E006", "刘大力", "施工一部", "P002", "LABOR", LocalDate.of(2023, 2, 10), "ACTIVE", "13800138006", "liudl@oa.com");
        seedEmployee(7L, "E007", "王小燕", "施工二部", "P002", "LABOR", LocalDate.of(2022, 9, 15), "ACTIVE", "13800138007", "wangxy@oa.com");
    }

    private void initProjects() {
        seedProject(1L, "P001", "绿地中心大厦装修项目", "高层商业楼宇内部装修工程", "项目一部", "王建国",
            LocalDate.of(2024, 1, 1), LocalDate.of(2024, 12, 31), "ACTIVE",
            Arrays.asList("王建国", "赵铁柱", "刘大力"), 65.5);
        seedProject(2L, "P002", "科技园区基础设施改造", "园区道路、管网及绿化改造工程", "项目二部", "李华",
            LocalDate.of(2024, 3, 1), LocalDate.of(2024, 10, 30), "ACTIVE",
            Arrays.asList("李华", "王小燕"), 40.0);
        seedProject(3L, "P003", "地铁站出口建设工程", "地铁站B出口土建及装饰工程", "项目三部", "张伟",
            LocalDate.of(2023, 6, 1), LocalDate.of(2024, 6, 30), "COMPLETED",
            Arrays.asList("张伟", "赵铁柱"), 100.0);
    }

    private void initPayrollCycles() {
        seedPayrollCycle(1L, "C202403", "2024年3月", LocalDate.of(2024, 3, 1), LocalDate.of(2024, 3, 31),
            "SETTLED", 1, true, LocalDateTime.now().minusDays(15), LocalDateTime.now().minusDays(10), 7, 285000.00);
        seedPayrollCycle(2L, "C202402", "2024年2月", LocalDate.of(2024, 2, 1), LocalDate.of(2024, 2, 29),
            "SETTLED", 1, true, LocalDateTime.now().minusDays(45), LocalDateTime.now().minusDays(40), 7, 280000.00);
        seedPayrollCycle(3L, "C202404", "2024年4月", LocalDate.of(2024, 4, 1), LocalDate.of(2024, 4, 30),
            "PRECHECK", 1, false, LocalDateTime.now().minusDays(2), null, 7, 290000.00);
    }

    private void initRetentionPolicies() {
        seedRetentionPolicy(1L, "FORM_RECORD", "表单记录", 365, 365, true, 730, LocalDate.of(2025, 6, 1),
            Arrays.asList(new CategoryRuleData("LEAVE", 730, "请假记录保留2年"),
                new CategoryRuleData("OVERTIME", 730, "加班记录保留2年")));
        seedRetentionPolicy(2L, "PAYROLL", "薪资数据", 2555, 2555, true, 3650, LocalDate.of(2031, 3, 1),
            Collections.emptyList());
        seedRetentionPolicy(3L, "ATTACHMENT", "附件文件", 180, 180, true, 365, LocalDate.of(2024, 9, 1),
            Collections.emptyList());
        seedRetentionPolicy(4L, "LOG", "系统日志", 90, 90, false, 180, LocalDate.of(2024, 6, 1),
            Collections.emptyList());
    }

    private void initNotifications() {
        seedNotification(1L, "TODO", "请假审批提醒", "您有1条待审批的请假申请需要处理", "系统", LocalDateTime.now().minusHours(2),
            false, null, "APPROVAL", "form/1", "HIGH");
        seedNotification(2L, "TODO", "工资条确认提醒", "2024年3月工资条已发布，请及时确认", "财务部", LocalDateTime.now().minusDays(1),
            false, null, "PAYROLL", "payroll/slip/1", "NORMAL");
        seedNotification(3L, "MESSAGE", "数据保留到期提醒", "部分表单数据将于30天后到期清理", "系统", LocalDateTime.now().minusHours(5),
            true, LocalDateTime.now().minusHours(4), "RETENTION", "retention/reminders", "HIGH");
    }

    // Employee methods
    private void seedEmployee(Long id, String employeeNo, String name, String department, String project,
                              String employeeType, LocalDate hireDate, String status, String phone, String email) {
        employees.put(id, new EmployeeData(id, employeeNo, name, department, project, employeeType, hireDate, status, phone, email));
        employeeSequence.set(Math.max(employeeSequence.get(), id));
    }

    public List<EmployeeProfileResponse> listEmployees() {
        return employees.values().stream()
            .map(this::toEmployeeResponse)
            .collect(Collectors.toList());
    }

    public Optional<EmployeeProfileResponse> getEmployee(Long id) {
        return Optional.ofNullable(employees.get(id))
            .map(this::toEmployeeResponse);
    }

    public Optional<EmployeeProfileResponse> getEmployeeByName(String name) {
        return employees.values().stream()
            .filter(e -> e.name.equals(name))
            .findFirst()
            .map(this::toEmployeeResponse);
    }

    private EmployeeProfileResponse toEmployeeResponse(EmployeeData e) {
        return new EmployeeProfileResponse(e.id, e.employeeNo, e.name, e.department, e.project, e.employeeType, e.hireDate, e.status, e.phone, e.email);
    }

    // Project methods
    private void seedProject(Long id, String projectNo, String name, String description, String department,
                             String manager, LocalDate startDate, LocalDate endDate, String status,
                             List<String> members, Double progress) {
        projects.put(id, new ProjectData(id, projectNo, name, description, department, manager, startDate, endDate, status, members, progress));
        projectSequence.set(Math.max(projectSequence.get(), id));
    }

    public List<ProjectResponse> listProjects() {
        return projects.values().stream()
            .map(this::toProjectResponse)
            .collect(Collectors.toList());
    }

    private ProjectResponse toProjectResponse(ProjectData p) {
        return new ProjectResponse(p.id, p.projectNo, p.name, p.description, p.department, p.manager,
            p.startDate, p.endDate, p.status, p.members, p.progress);
    }

    // Form methods
    public List<FormRecordResponse> listFormsByStatus(String status) {
        return forms.values().stream()
            .filter(f -> status == null || f.status.equals(status))
            .map(this::toFormResponse)
            .collect(Collectors.toList());
    }

    public List<FormRecordResponse> listFormsByStatuses(List<String> statuses) {
        return forms.values().stream()
            .filter(f -> statuses == null || statuses.contains(f.status))
            .map(this::toFormResponse)
            .collect(Collectors.toList());
    }

    public List<FormRecordResponse> listFormsBySubmitter(String submitter) {
        return forms.values().stream()
            .filter(f -> f.submitterName.equals(submitter))
            .map(this::toFormResponse)
            .collect(Collectors.toList());
    }

    public Optional<FormRecordResponse> getForm(Long id) {
        return Optional.ofNullable(forms.get(id))
            .map(this::toFormResponse);
    }

    public FormRecordResponse createForm(String formType, String submitterName, String department,
                                          Map<String, Object> formData, String remark) {
        Long id = formSequence.incrementAndGet();
        String formNo = generateFormNo(formType, id);
        FormData data = new FormData(id, formNo, formType, 0L, submitterName, department,
            LocalDateTime.now(), "PENDING", "初审", formData, new ArrayList<>(), remark);
        forms.put(id, data);
        return toFormResponse(data);
    }

    public Optional<FormRecordResponse> approveForm(Long id, String action, String approver, String approverRole, String comment) {
        FormData form = forms.get(id);
        if (form == null) return Optional.empty();

        // 权限检查：初审只能由项目经理审批，终审只能由CEO审批
        if ("初审".equals(form.currentNode)) {
            if (!"PROJECT_MANAGER".equals(approverRole)) {
                return Optional.empty();
            }
        } else if ("终审".equals(form.currentNode)) {
            if (!"CEO".equals(approverRole)) {
                return Optional.empty();
            }
        }

        form.history.add(new ApprovalHistoryData(form.currentNode, approver, action, comment, LocalDateTime.now()));

        if ("APPROVE".equals(action)) {
            if ("初审".equals(form.currentNode)) {
                form.currentNode = "终审";
                form.status = "APPROVING";
            } else if ("终审".equals(form.currentNode)) {
                form.currentNode = "-";
                form.status = "ARCHIVED";
                form.archiveTime = LocalDateTime.now();
            }
        } else {
            form.currentNode = "-";
            form.status = "REJECTED";
        }
        return Optional.of(toFormResponse(form));
    }

    private FormRecordResponse toFormResponse(FormData f) {
        List<FormRecordResponse.ApprovalHistory> history = f.history.stream()
            .map(h -> new FormRecordResponse.ApprovalHistory(h.nodeName, h.approver, h.action, h.comment, h.time))
            .collect(Collectors.toList());
        return new FormRecordResponse(f.id, f.formNo, f.formType, getFormTypeName(f.formType),
            f.submitterName, f.department, f.submitTime, f.status, f.currentNode, f.formData, history, f.remark);
    }

    private String getFormTypeName(String formType) {
        return switch (formType) {
            case "LEAVE" -> "请假申请";
            case "OVERTIME" -> "加班申请";
            case "INJURY" -> "工伤补偿";
            case "LOG" -> "施工日志";
            default -> formType;
        };
    }

    private String generateFormNo(String formType, Long id) {
        String prefix = switch (formType) {
            case "LEAVE" -> "L";
            case "OVERTIME" -> "OT";
            case "INJURY" -> "INJ";
            case "LOG" -> "LOG";
            default -> "F";
        };
        return prefix + LocalDate.now().toString().replace("-", "") + String.format("%04d", id);
    }

    // Payroll methods
    private void seedPayrollCycle(Long id, String cycleNo, String cycleName, LocalDate startDate, LocalDate endDate,
                                  String status, Integer version, Boolean locked, LocalDateTime precheckTime,
                                  LocalDateTime settleTime, Integer employeeCount, Double totalAmount) {
        payrollCycles.put(id, new PayrollCycleData(id, cycleNo, cycleName, startDate, endDate, status, version,
            locked, precheckTime, settleTime, employeeCount, totalAmount));
        payrollCycleSequence.set(Math.max(payrollCycleSequence.get(), id));
    }

    public List<PayrollCycleResponse> listPayrollCycles() {
        return payrollCycles.values().stream()
            .map(this::toPayrollCycleResponse)
            .collect(Collectors.toList());
    }

    public Optional<PayrollCycleResponse> getPayrollCycle(Long id) {
        return Optional.ofNullable(payrollCycles.get(id))
            .map(this::toPayrollCycleResponse);
    }

    public boolean precheckPayrollCycle(Long id) {
        PayrollCycleData cycle = payrollCycles.get(id);
        if (cycle == null || cycle.locked) return false;
        cycle.precheckTime = LocalDateTime.now();
        cycle.status = "PRECHECK";
        return true;
    }

    public boolean settlePayrollCycle(Long id) {
        PayrollCycleData cycle = payrollCycles.get(id);
        if (cycle == null || cycle.locked) return false;
        cycle.settleTime = LocalDateTime.now();
        cycle.locked = true;
        cycle.status = "SETTLED";
        return true;
    }

    public boolean recalculatePayrollCycle(Long id) {
        PayrollCycleData cycle = payrollCycles.get(id);
        if (cycle == null || !cycle.locked) return false;
        cycle.version++;
        cycle.locked = false;
        cycle.status = "RECALCULATING";
        cycle.precheckTime = null;
        cycle.settleTime = null;
        return true;
    }

    private PayrollCycleResponse toPayrollCycleResponse(PayrollCycleData c) {
        return new PayrollCycleResponse(c.id, c.cycleNo, c.cycleName, c.startDate, c.endDate, c.status,
            c.version, c.locked, c.startDate, c.settleTime != null ? c.startDate : null, c.employeeCount, c.totalAmount);
    }

    public List<PayrollSlipResponse> listPayrollSlips(Long cycleId) {
        if (payrollSlips.isEmpty()) {
            initPayrollSlips();
        }
        return payrollSlips.values().stream()
            .filter(s -> cycleId == null || s.cycleId.equals(cycleId))
            .map(this::toPayrollSlipResponse)
            .collect(Collectors.toList());
    }

    public Optional<PayrollSlipResponse> getPayrollSlip(Long id) {
        if (payrollSlips.isEmpty()) {
            initPayrollSlips();
        }
        return Optional.ofNullable(payrollSlips.get(id))
            .map(this::toPayrollSlipResponse);
    }

    private void initPayrollSlips() {
        Long employeeId = 1L;
        for (PayrollCycleData cycle : payrollCycles.values()) {
            for (EmployeeData emp : employees.values()) {
                Long slipId = payrollSlipSequence.incrementAndGet();
                String slipNo = "S" + cycle.cycleNo + String.format("%03d", emp.id);
                double gross = 8000 + emp.id * 500;
                double net = gross * 0.85;
                List<PayrollSlipResponse.PayrollItem> items = Arrays.asList(
                    new PayrollSlipResponse.PayrollItem("BASE", "基本工资", 5000.0, ""),
                    new PayrollSlipResponse.PayrollItem("ALLOWANCE", "岗位津贴", 2000.0 + emp.id * 200, ""),
                    new PayrollSlipResponse.PayrollItem("BONUS", "绩效奖金", 1000.0, ""),
                    new PayrollSlipResponse.PayrollItem("DEDUCTION", "社保公积金", -gross * 0.15, "")
                );
                PayrollSlipData slip = new PayrollSlipData(slipId, slipNo, cycle.id, cycle.cycleNo, emp.id, emp.name,
                    emp.department, 1, "PENDING", itemsToString(items), gross, net, null, null, null);
                payrollSlips.put(slipId, slip);
            }
        }
    }

    private String itemsToString(List<PayrollSlipResponse.PayrollItem> items) {
        return items.stream()
            .map(i -> i.itemType() + ":" + i.itemName() + ":" + i.amount())
            .collect(Collectors.joining("|"));
    }

    private List<PayrollSlipResponse.PayrollItem> parseItems(String itemsStr) {
        if (itemsStr == null || itemsStr.isEmpty()) return Collections.emptyList();
        return Arrays.stream(itemsStr.split("\\|"))
            .map(s -> {
                String[] parts = s.split(":");
                return new PayrollSlipResponse.PayrollItem(parts[0], parts[1], Double.parseDouble(parts[2]), "");
            })
            .collect(Collectors.toList());
    }

    private PayrollSlipResponse toPayrollSlipResponse(PayrollSlipData s) {
        return new PayrollSlipResponse(s.id, s.slipNo, s.cycleNo, payrollCycles.get(s.cycleId) != null ?
            payrollCycles.get(s.cycleId).cycleName : "", s.employeeId, s.employeeName, s.department,
            s.version, s.status, parseItems(s.items), s.grossAmount, s.netAmount, s.confirmTime,
            s.confirmIp, s.disputeReason, null);
    }

    public boolean confirmPayrollSlip(Long id, String ip) {
        PayrollSlipData slip = payrollSlips.get(id);
        if (slip == null) return false;
        slip.status = "CONFIRMED";
        slip.confirmTime = LocalDateTime.now();
        slip.confirmIp = ip;
        return true;
    }

    public boolean disputePayrollSlip(Long id, String reason) {
        PayrollSlipData slip = payrollSlips.get(id);
        if (slip == null) return false;
        slip.status = "DISPUTED";
        slip.disputeReason = reason;
        return true;
    }

    // Retention methods
    private void seedRetentionPolicy(Long id, String dataCategory, String categoryName, Integer defaultDays,
                                     Integer currentDays, Boolean canExtend, Integer maxExtendDays,
                                     LocalDate nextCleanupDate, List<CategoryRuleData> overrideRules) {
        retentionPolicies.put(id, new RetentionPolicyData(id, dataCategory, categoryName, defaultDays,
            currentDays, canExtend, maxExtendDays, nextCleanupDate, overrideRules));
        retentionPolicySequence.set(Math.max(retentionPolicySequence.get(), id));
    }

    public List<RetentionPolicyResponse> listRetentionPolicies() {
        return retentionPolicies.values().stream()
            .map(this::toRetentionPolicyResponse)
            .collect(Collectors.toList());
    }

    public Optional<RetentionPolicyResponse> extendRetentionPolicy(Long id, Integer extendDays) {
        RetentionPolicyData policy = retentionPolicies.get(id);
        if (policy == null || !policy.canExtend) return Optional.empty();
        policy.currentDays += extendDays;
        policy.nextCleanupDate = policy.nextCleanupDate.plusDays(extendDays);
        return Optional.of(toRetentionPolicyResponse(policy));
    }

    private RetentionPolicyResponse toRetentionPolicyResponse(RetentionPolicyData p) {
        List<RetentionPolicyResponse.CategoryRule> rules = p.overrideRules.stream()
            .map(r -> new RetentionPolicyResponse.CategoryRule(r.subCategory, r.days, r.description))
            .collect(Collectors.toList());
        return new RetentionPolicyResponse(p.id, p.dataCategory, p.categoryName, p.defaultDays,
            p.currentDays, p.canExtend, p.maxExtendDays, p.nextCleanupDate, rules);
    }

    public List<RetentionReminderResponse> listRetentionReminders() {
        return retentionReminders.values().stream()
            .map(this::toRetentionReminderResponse)
            .collect(Collectors.toList());
    }

    private RetentionReminderResponse toRetentionReminderResponse(RetentionReminderData r) {
        return new RetentionReminderResponse(r.id, r.objectType, r.objectName, r.objectId, r.expireDate,
            r.daysRemaining, r.urgency, r.suggestedAction, r.actionTaken, r.actionType, r.reminderTime);
    }

    // Backup & Cleanup methods
    private void seedBackupTask(Long id, String taskNo, String taskName, String dataScope, String status,
                                Integer totalPackages, Integer completedPackages, Boolean compressed,
                                Long fileSize, String downloadUrl, LocalDateTime expireTime, Integer retryCount,
                                String errorMessage, LocalDateTime createdAt, LocalDateTime completedAt) {
        backupTasks.put(id, new BackupTaskData(id, taskNo, taskName, dataScope, status, totalPackages,
            completedPackages, compressed, fileSize, downloadUrl, expireTime, retryCount, errorMessage,
            createdAt, completedAt));
        backupTaskSequence.set(Math.max(backupTaskSequence.get(), id));
    }

    public List<BackupTaskResponse> listBackupTasks() {
        if (backupTasks.isEmpty()) {
            seedBackupTask(1L, "B20240301001", "2024年Q1数据备份", "FORM_RECORD", "COMPLETED",
                5, 5, true, 1024000L, "/download/backup/B20240301001.zip",
                LocalDateTime.now().plusDays(30), 0, null, LocalDateTime.now().minusDays(5),
                LocalDateTime.now().minusDays(4));
            backupTaskSequence.set(1L);
        }
        return backupTasks.values().stream()
            .map(this::toBackupTaskResponse)
            .collect(Collectors.toList());
    }

    public BackupTaskResponse createBackupTask(String dataScope, String scopeId, String taskName,
                                                List<String> dataTypes, Boolean compress) {
        Long id = backupTaskSequence.incrementAndGet();
        String taskNo = "B" + LocalDate.now().toString().replace("-", "") + String.format("%03d", id);
        BackupTaskData task = new BackupTaskData(id, taskNo, taskName, dataScope, "PENDING",
            0, 0, compress, 0L, null, null, 0, null, LocalDateTime.now(), null);
        backupTasks.put(id, task);
        return toBackupTaskResponse(task);
    }

    public boolean retryBackupTask(Long id) {
        BackupTaskData task = backupTasks.get(id);
        if (task == null) return false;
        task.status = "PENDING";
        task.retryCount++;
        task.errorMessage = null;
        return true;
    }

    private BackupTaskResponse toBackupTaskResponse(BackupTaskData t) {
        return new BackupTaskResponse(t.id, t.taskNo, t.taskName, t.dataScope, t.status, t.totalPackages,
            t.completedPackages, t.compressed, t.fileSize, t.downloadUrl, t.expireTime, t.retryCount,
            t.errorMessage, t.createdAt, t.completedAt);
    }

    public List<CleanupTaskResponse> listCleanupTasks() {
        if (cleanupTasks.isEmpty()) {
            seedCleanupTask(1L, "C20240301001", "FORM_RECORD", "SCHEDULED", 100, 0, 0,
                0, null, LocalDateTime.now().plusDays(1), null, null);
            cleanupTaskSequence.set(1L);
        }
        return cleanupTasks.values().stream()
            .map(this::toCleanupTaskResponse)
            .collect(Collectors.toList());
    }

    private void seedCleanupTask(Long id, String taskNo, String dataCategory, String status, Integer targetCount,
                                 Integer deletedCount, Integer failedCount, Integer retryCount,
                                 String errorMessage, LocalDateTime scheduledTime, LocalDateTime startedAt,
                                 LocalDateTime completedAt) {
        cleanupTasks.put(id, new CleanupTaskData(id, taskNo, dataCategory, status, targetCount, deletedCount,
            failedCount, retryCount, errorMessage, scheduledTime, startedAt, completedAt));
        cleanupTaskSequence.set(Math.max(cleanupTaskSequence.get(), id));
    }

    public CleanupTaskResponse createCleanupTask(String dataCategory) {
        Long id = cleanupTaskSequence.incrementAndGet();
        String taskNo = "C" + LocalDate.now().toString().replace("-", "") + String.format("%03d", id);
        CleanupTaskData task = new CleanupTaskData(id, taskNo, dataCategory, "PENDING", 0, 0, 0, 0,
            null, LocalDateTime.now().plusHours(1), null, null);
        cleanupTasks.put(id, task);
        return toCleanupTaskResponse(task);
    }

    public boolean retryCleanupTask(Long id) {
        CleanupTaskData task = cleanupTasks.get(id);
        if (task == null) return false;
        task.status = "PENDING";
        task.retryCount++;
        task.errorMessage = null;
        return true;
    }

    private CleanupTaskResponse toCleanupTaskResponse(CleanupTaskData t) {
        return new CleanupTaskResponse(t.id, t.taskNo, t.dataCategory, t.status, t.targetCount,
            t.deletedCount, t.failedCount, t.retryCount, t.errorMessage, t.scheduledTime, t.startedAt, t.completedAt);
    }

    // Notification methods
    private void seedNotification(Long id, String type, String title, String content, String sender,
                                  LocalDateTime sendTime, Boolean read, LocalDateTime readTime,
                                  String actionType, String actionTarget, String priority) {
        notifications.put(id, new NotificationData(id, type, title, content, sender, sendTime,
            read, readTime, actionType, actionTarget, priority));
        notificationSequence.set(Math.max(notificationSequence.get(), id));
    }

    public List<NotificationResponse> listNotifications() {
        return notifications.values().stream()
            .sorted((a, b) -> b.sendTime.compareTo(a.sendTime))
            .map(this::toNotificationResponse)
            .collect(Collectors.toList());
    }

    public long getUnreadNotificationCount() {
        return notifications.values().stream()
            .filter(n -> !n.read)
            .count();
    }

    private NotificationResponse toNotificationResponse(NotificationData n) {
        return new NotificationResponse(n.id, n.type, n.title, n.content, n.sender, n.sendTime,
            n.read, n.readTime, n.actionType, n.actionTarget, n.priority);
    }

    // Inner classes for data storage (mutable for updates)
    private static class EmployeeData {
        Long id; String employeeNo; String name; String department; String project;
        String employeeType; LocalDate hireDate; String status; String phone; String email;
        EmployeeData(Long id, String employeeNo, String name, String department, String project,
                     String employeeType, LocalDate hireDate, String status, String phone, String email) {
            this.id = id; this.employeeNo = employeeNo; this.name = name; this.department = department;
            this.project = project; this.employeeType = employeeType; this.hireDate = hireDate;
            this.status = status; this.phone = phone; this.email = email;
        }
    }

    private static class ProjectData {
        Long id; String projectNo; String name; String description; String department;
        String manager; LocalDate startDate; LocalDate endDate; String status;
        List<String> members; Double progress;
        ProjectData(Long id, String projectNo, String name, String description, String department,
                    String manager, LocalDate startDate, LocalDate endDate, String status,
                    List<String> members, Double progress) {
            this.id = id; this.projectNo = projectNo; this.name = name; this.description = description;
            this.department = department; this.manager = manager; this.startDate = startDate;
            this.endDate = endDate; this.status = status; this.members = members; this.progress = progress;
        }
    }

    private static class FormData {
        Long id; String formNo; String formType; Long submitterId; String submitterName;
        String department; LocalDateTime submitTime; String status; String currentNode;
        Map<String, Object> formData; List<ApprovalHistoryData> history; String remark;
        LocalDateTime archiveTime;
        FormData(Long id, String formNo, String formType, Long submitterId, String submitterName,
                 String department, LocalDateTime submitTime, String status, String currentNode,
                 Map<String, Object> formData, List<ApprovalHistoryData> history, String remark) {
            this.id = id; this.formNo = formNo; this.formType = formType; this.submitterId = submitterId;
            this.submitterName = submitterName; this.department = department; this.submitTime = submitTime;
            this.status = status; this.currentNode = currentNode; this.formData = formData;
            this.history = history; this.remark = remark;
        }
    }

    private record ApprovalHistoryData(String nodeName, String approver, String action, String comment,
                                       LocalDateTime time) {
    }

    private static class PayrollCycleData {
        Long id; String cycleNo; String cycleName; LocalDate startDate; LocalDate endDate;
        String status; Integer version; Boolean locked; LocalDateTime precheckTime; LocalDateTime settleTime;
        Integer employeeCount; Double totalAmount;
        PayrollCycleData(Long id, String cycleNo, String cycleName, LocalDate startDate, LocalDate endDate,
                         String status, Integer version, Boolean locked, LocalDateTime precheckTime,
                         LocalDateTime settleTime, Integer employeeCount, Double totalAmount) {
            this.id = id; this.cycleNo = cycleNo; this.cycleName = cycleName; this.startDate = startDate;
            this.endDate = endDate; this.status = status; this.version = version; this.locked = locked;
            this.precheckTime = precheckTime; this.settleTime = settleTime; this.employeeCount = employeeCount;
            this.totalAmount = totalAmount;
        }
    }

    private static class PayrollSlipData {
        Long id; String slipNo; Long cycleId; String cycleNo; Long employeeId; String employeeName;
        String department; Integer version; String status; String items; Double grossAmount; Double netAmount;
        LocalDateTime confirmTime; String confirmIp; String disputeReason;
        PayrollSlipData(Long id, String slipNo, Long cycleId, String cycleNo, Long employeeId, String employeeName,
                        String department, Integer version, String status, String items, Double grossAmount,
                        Double netAmount, LocalDateTime confirmTime, String confirmIp, String disputeReason) {
            this.id = id; this.slipNo = slipNo; this.cycleId = cycleId; this.cycleNo = cycleNo;
            this.employeeId = employeeId; this.employeeName = employeeName; this.department = department;
            this.version = version; this.status = status; this.items = items; this.grossAmount = grossAmount;
            this.netAmount = netAmount; this.confirmTime = confirmTime; this.confirmIp = confirmIp;
            this.disputeReason = disputeReason;
        }
    }

    private static class BackupTaskData {
        Long id; String taskNo; String taskName; String dataScope; String status;
        Integer totalPackages; Integer completedPackages; Boolean compressed; Long fileSize;
        String downloadUrl; LocalDateTime expireTime; Integer retryCount; String errorMessage;
        LocalDateTime createdAt; LocalDateTime completedAt;
        BackupTaskData(Long id, String taskNo, String taskName, String dataScope, String status,
                       Integer totalPackages, Integer completedPackages, Boolean compressed, Long fileSize,
                       String downloadUrl, LocalDateTime expireTime, Integer retryCount, String errorMessage,
                       LocalDateTime createdAt, LocalDateTime completedAt) {
            this.id = id; this.taskNo = taskNo; this.taskName = taskName; this.dataScope = dataScope;
            this.status = status; this.totalPackages = totalPackages; this.completedPackages = completedPackages;
            this.compressed = compressed; this.fileSize = fileSize; this.downloadUrl = downloadUrl;
            this.expireTime = expireTime; this.retryCount = retryCount; this.errorMessage = errorMessage;
            this.createdAt = createdAt; this.completedAt = completedAt;
        }
    }

    private static class CleanupTaskData {
        Long id; String taskNo; String dataCategory; String status; Integer targetCount;
        Integer deletedCount; Integer failedCount; Integer retryCount; String errorMessage;
        LocalDateTime scheduledTime; LocalDateTime startedAt; LocalDateTime completedAt;
        CleanupTaskData(Long id, String taskNo, String dataCategory, String status, Integer targetCount,
                        Integer deletedCount, Integer failedCount, Integer retryCount, String errorMessage,
                        LocalDateTime scheduledTime, LocalDateTime startedAt, LocalDateTime completedAt) {
            this.id = id; this.taskNo = taskNo; this.dataCategory = dataCategory; this.status = status;
            this.targetCount = targetCount; this.deletedCount = deletedCount; this.failedCount = failedCount;
            this.retryCount = retryCount; this.errorMessage = errorMessage; this.scheduledTime = scheduledTime;
            this.startedAt = startedAt; this.completedAt = completedAt;
        }
    }

    private static class RetentionPolicyData {
        Long id; String dataCategory; String categoryName; Integer defaultDays; Integer currentDays;
        Boolean canExtend; Integer maxExtendDays; LocalDate nextCleanupDate; List<CategoryRuleData> overrideRules;
        RetentionPolicyData(Long id, String dataCategory, String categoryName, Integer defaultDays,
                            Integer currentDays, Boolean canExtend, Integer maxExtendDays, LocalDate nextCleanupDate,
                            List<CategoryRuleData> overrideRules) {
            this.id = id; this.dataCategory = dataCategory; this.categoryName = categoryName;
            this.defaultDays = defaultDays; this.currentDays = currentDays; this.canExtend = canExtend;
            this.maxExtendDays = maxExtendDays; this.nextCleanupDate = nextCleanupDate; this.overrideRules = overrideRules;
        }
    }

    private record CategoryRuleData(String subCategory, Integer days, String description) {
    }

    private static class RetentionReminderData {
        Long id; String objectType; String objectName; Long objectId; LocalDate expireDate;
        Integer daysRemaining; String urgency; String suggestedAction; Boolean actionTaken;
        String actionType; LocalDateTime reminderTime;
        RetentionReminderData(Long id, String objectType, String objectName, Long objectId, LocalDate expireDate,
                              Integer daysRemaining, String urgency, String suggestedAction, Boolean actionTaken,
                              String actionType, LocalDateTime reminderTime) {
            this.id = id; this.objectType = objectType; this.objectName = objectName; this.objectId = objectId;
            this.expireDate = expireDate; this.daysRemaining = daysRemaining; this.urgency = urgency;
            this.suggestedAction = suggestedAction; this.actionTaken = actionTaken; this.actionType = actionType;
            this.reminderTime = reminderTime;
        }
    }

    private static class NotificationData {
        Long id; String type; String title; String content; String sender; LocalDateTime sendTime;
        Boolean read; LocalDateTime readTime; String actionType; String actionTarget; String priority;
        NotificationData(Long id, String type, String title, String content, String sender, LocalDateTime sendTime,
                         Boolean read, LocalDateTime readTime, String actionType, String actionTarget, String priority) {
            this.id = id; this.type = type; this.title = title; this.content = content; this.sender = sender;
            this.sendTime = sendTime; this.read = read; this.readTime = readTime; this.actionType = actionType;
            this.actionTarget = actionTarget; this.priority = priority;
        }
    }
}
