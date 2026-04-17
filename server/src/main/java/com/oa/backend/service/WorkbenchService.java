package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.dto.UserProfileResponse;
import com.oa.backend.dto.WorkbenchConfigResponse;
import com.oa.backend.entity.FormRecord;
import com.oa.backend.entity.PayrollCycle;
import com.oa.backend.entity.Project;
import com.oa.backend.mapper.FormRecordMapper;
import com.oa.backend.mapper.PayrollCycleMapper;
import com.oa.backend.mapper.ProjectMapper;
import com.oa.backend.mapper.RetentionReminderMapper;
import com.oa.backend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

/**
 * 工作台业务逻辑。
 * 聚合个人资料、菜单配置、工作台摘要三类查询，封装多 Mapper 协同。
 */
@Service
@RequiredArgsConstructor
public class WorkbenchService {

    private final NotificationService notificationService;
    private final FormRecordMapper formRecordMapper;
    private final PayrollCycleMapper payrollCycleMapper;
    private final ProjectMapper projectMapper;
    private final RetentionReminderMapper retentionReminderMapper;

    /**
     * 构建工作台摘要。
     * @return 填充完毕的 Summary；employeeId 为 null 时返回 null，由调用方处理
     */
    public WorkbenchSummary buildWorkbenchSummary(Authentication authentication) {
        String role = extractRole(authentication);
        Long employeeId = SecurityUtils.getCurrentEmployeeId(authentication);
        if (employeeId == null) {
            return null;
        }

        WorkbenchSummary summary = new WorkbenchSummary();
        summary.unreadNotificationCount = notificationService.countUnread(employeeId);
        summary.pendingApprovalCount = calculatePendingApprovalCount(role, employeeId);

        if (SecurityUtils.hasFinanceAccess(authentication)) {
            summary.payrollStatus = getLatestPayrollCycleStatus();
        }
        if ("ceo".equals(role) || "project_manager".equals(role)) {
            summary.activeProjectCount = countActiveProjects();
        }
        if ("ceo".equals(role)) {
            summary.retentionAlertCount = countPendingRetentionReminders();
        }
        return summary;
    }

    public UserProfileResponse buildUserProfile(Authentication authentication) {
        String username = authentication.getName();
        String role = extractRole(authentication);
        return switch (username.toLowerCase()) {
            case "employee.demo" -> new UserProfileResponse(
                    username, "张晓宁", role, getRoleName(role), "综合管理部", "OFFICE", "ACTIVE",
                    getVisibleModules(role));
            case "worker.demo" -> new UserProfileResponse(
                    username, "赵铁柱", role, getRoleName(role), "施工一部", "LABOR", "ACTIVE",
                    getVisibleModules(role));
            case "finance.demo" -> new UserProfileResponse(
                    username, "李静", role, getRoleName(role), "财务管理部", "OFFICE", "ACTIVE",
                    getVisibleModules(role));
            case "pm.demo" -> new UserProfileResponse(
                    username, "王建国", role, getRoleName(role), "项目一部", "OFFICE", "ACTIVE",
                    getVisibleModules(role));
            case "ceo.demo" -> new UserProfileResponse(
                    username, "陈明远", role, getRoleName(role), "运营管理部", "OFFICE", "ACTIVE",
                    getVisibleModules(role));
            case "dept_manager.demo" -> new UserProfileResponse(
                    username, "周伟", role, getRoleName(role), "综合管理部", "OFFICE", "ACTIVE",
                    getVisibleModules(role));
            default -> new UserProfileResponse(
                    username, username, role, getRoleName(role), "未分配", "OFFICE", "ACTIVE",
                    getVisibleModules(role));
        };
    }

    public WorkbenchConfigResponse buildWorkbenchConfig(Authentication authentication) {
        String role = extractRole(authentication);
        List<WorkbenchConfigResponse.MenuItem> menus = buildMenus(role);
        List<WorkbenchConfigResponse.QuickAction> quickActions = Arrays.asList(
                new WorkbenchConfigResponse.QuickAction("leave", "请假", "calendar", "/forms/leave", true),
                new WorkbenchConfigResponse.QuickAction("overtime", "加班", "clock-circle", "/forms/overtime", true),
                new WorkbenchConfigResponse.QuickAction("notification", "通知", "bell", "/notifications", true)
        );
        WorkbenchConfigResponse.DashboardWidgets widgets = new WorkbenchConfigResponse.DashboardWidgets(
                true, true, true, true);
        return new WorkbenchConfigResponse(menus, quickActions, widgets);
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private Integer calculatePendingApprovalCount(String role, Long employeeId) {
        return switch (role) {
            case "ceo", "project_manager", "department_manager" -> {
                Long count = formRecordMapper.selectCount(
                        new LambdaQueryWrapper<FormRecord>()
                                .eq(FormRecord::getStatus, "PENDING")
                                .eq(FormRecord::getDeleted, 0)
                );
                yield count != null ? count.intValue() : 0;
            }
            case "employee", "worker" -> {
                Long count = formRecordMapper.selectCount(
                        new LambdaQueryWrapper<FormRecord>()
                                .eq(FormRecord::getSubmitterId, employeeId)
                                .eq(FormRecord::getStatus, "PENDING")
                                .eq(FormRecord::getDeleted, 0)
                );
                yield count != null ? count.intValue() : 0;
            }
            default -> 0;
        };
    }

    private String getLatestPayrollCycleStatus() {
        List<PayrollCycle> cycles = payrollCycleMapper.selectList(
                new LambdaQueryWrapper<PayrollCycle>()
                        .eq(PayrollCycle::getDeleted, 0)
                        .orderByDesc(PayrollCycle::getPeriod)
                        .last("LIMIT 1")
        );
        return cycles.isEmpty() ? null : cycles.get(0).getStatus();
    }

    private Integer countActiveProjects() {
        Long count = projectMapper.selectCount(
                new LambdaQueryWrapper<Project>()
                        .eq(Project::getStatus, "ACTIVE")
                        .eq(Project::getDeleted, 0)
        );
        return count != null ? count.intValue() : 0;
    }

    private Integer countPendingRetentionReminders() {
        return retentionReminderMapper.countByStatus("PENDING");
    }

    private String extractRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .filter(a -> a.getAuthority().startsWith("ROLE_"))
                .map(a -> a.getAuthority().replace("ROLE_", "").toLowerCase())
                .findFirst()
                .orElse("employee");
    }

    private String getRoleName(String role) {
        return switch (role) {
            case "employee" -> "员工";
            case "finance" -> "财务";
            case "project_manager" -> "项目经理";
            case "ceo" -> "首席经营者";
            case "worker" -> "劳工";
            case "hr" -> "人力资源";
            case "department_manager" -> "部门经理";
            default -> "员工";
        };
    }

    private List<String> getVisibleModules(String role) {
        return switch (role) {
            case "ceo" -> List.of("workbench", "forms", "employees", "projects", "directory", "payroll", "retention", "role");
            case "finance" -> List.of("workbench", "forms", "employees", "directory", "payroll");
            case "project_manager" -> List.of("workbench", "forms", "employees", "projects");
            case "worker" -> List.of("workbench", "forms", "employees", "projects", "payroll");
            case "department_manager" -> List.of("workbench", "employees", "attendance", "todo", "team");
            default -> List.of("workbench", "forms", "employees", "projects", "payroll");
        };
    }

    private List<WorkbenchConfigResponse.MenuItem> buildMenus(String role) {
        return switch (role) {
            case "ceo" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "\u5de5\u4f5c\u53f0", "dashboard", "/workbench", true, null),
                    new WorkbenchConfigResponse.MenuItem("todo", "\u5ba1\u6279\u4e2d\u5fc3", "check-circle", "/todo", true, null),
                    new WorkbenchConfigResponse.MenuItem("employees", "\u5458\u5de5\u7ba1\u7406", "team", "/employees", true, null),
                    new WorkbenchConfigResponse.MenuItem("org", "\u7ec4\u7ec7\u67b6\u6784", "apartment", "/org", true, null),
                    new WorkbenchConfigResponse.MenuItem("positions", "\u5c97\u4f4d\u7ba1\u7406", "idcard", "/positions", true, null),
                    new WorkbenchConfigResponse.MenuItem("allowances", "\u8865\u8d34\u914d\u7f6e", "idcard", "/allowances", true, null),
                    new WorkbenchConfigResponse.MenuItem("role", "\u89d2\u8272\u7ba1\u7406", "user-switch", "/role", true, null),
                    new WorkbenchConfigResponse.MenuItem("projects", "\u9879\u76ee\u7ba1\u7406", "project", "/projects", true, null),
                    new WorkbenchConfigResponse.MenuItem("payroll", "\u85aa\u8d44\u7ba1\u7406", "money", "/payroll", true, null),
                    new WorkbenchConfigResponse.MenuItem("construction-log", "\u65bd\u5de5\u65e5\u5fd7", "file-text", "/construction_log", true, null),
                    new WorkbenchConfigResponse.MenuItem("injury", "\u5de5\u4f24\u8865\u507f", "alert", "/injury", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-apply", "\u8d39\u7528\u62a5\u9500", "wallet", "/expense/apply", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-records", "\u62a5\u9500\u8bb0\u5f55", "solution", "/expense/records", true, null),
                    new WorkbenchConfigResponse.MenuItem("retention", "\u6570\u636e\u4fdd\u7559", "safety", "/retention", true, null),
                    new WorkbenchConfigResponse.MenuItem("operation-logs", "\u64cd\u4f5c\u65e5\u5fd7", "audit", "/operation_logs", true, null),
                    new WorkbenchConfigResponse.MenuItem("config", "\u7cfb\u7edf\u914d\u7f6e", "setting", "/config", true, null)
            );
            case "finance" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "\u5de5\u4f5c\u53f0", "dashboard", "/workbench", true, null),
                    new WorkbenchConfigResponse.MenuItem("todo", "\u5ba1\u6279\u4e2d\u5fc3", "check-circle", "/todo", true, null),
                    new WorkbenchConfigResponse.MenuItem("employees", "\u5458\u5de5\u7ba1\u7406", "team", "/employees", true, null),
                    new WorkbenchConfigResponse.MenuItem("payroll", "\u85aa\u8d44\u7ba1\u7406", "money", "/payroll", true, null),
                    new WorkbenchConfigResponse.MenuItem("injury", "\u5de5\u4f24\u7406\u8d54", "alert", "/injury", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-apply", "\u8d39\u7528\u62a5\u9500", "wallet", "/expense/apply", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-records", "\u62a5\u9500\u8bb0\u5f55", "solution", "/expense/records", true, null),
                    new WorkbenchConfigResponse.MenuItem("directory", "\u901a\u8baf\u5f55\u5bfc\u5165", "import", "/directory", true, null)
            );
            case "project_manager" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "\u5de5\u4f5c\u53f0", "dashboard", "/workbench", true, null),
                    new WorkbenchConfigResponse.MenuItem("todo", "\u5ba1\u6279\u4e2d\u5fc3", "check-circle", "/todo", true, null),
                    new WorkbenchConfigResponse.MenuItem("projects", "\u9879\u76ee\u7ba1\u7406", "project", "/projects", true, null),
                    new WorkbenchConfigResponse.MenuItem("construction-log", "\u65bd\u5de5\u65e5\u5fd7", "file-text", "/construction_log", true, null),
                    new WorkbenchConfigResponse.MenuItem("templates", "\u5de5\u4f5c\u9879\u6a21\u677f", "form", "/construction_log/templates", true, null),
                    new WorkbenchConfigResponse.MenuItem("forms", "\u8868\u5355\u4e2d\u5fc3", "file", "/forms", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-apply", "\u8d39\u7528\u62a5\u9500", "wallet", "/expense/apply", true, null)
            );
            case "hr" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "\u5de5\u4f5c\u53f0", "dashboard", "/workbench", true, null),
                    new WorkbenchConfigResponse.MenuItem("employees", "\u5458\u5de5\u7ba1\u7406", "team", "/employees", true, null),
                    new WorkbenchConfigResponse.MenuItem("org", "\u7ec4\u7ec7\u67b6\u6784", "apartment", "/org", true, null),
                    new WorkbenchConfigResponse.MenuItem("positions", "\u5c97\u4f4d\u7ba1\u7406", "idcard", "/positions", true, null),
                    new WorkbenchConfigResponse.MenuItem("attendance", "\u8003\u52e4\u7ba1\u7406", "calendar", "/attendance", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-apply", "\u8d39\u7528\u62a5\u9500", "wallet", "/expense/apply", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-records", "\u62a5\u9500\u8bb0\u5f55", "solution", "/expense/records", true, null)
            );
            case "department_manager" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "\u5de5\u4f5c\u53f0", "dashboard", "/workbench", true, null),
                    new WorkbenchConfigResponse.MenuItem("todo", "\u5ba1\u6279\u4e2d\u5fc3", "check-circle", "/todo", true, null),
                    new WorkbenchConfigResponse.MenuItem("team", "\u56e2\u961f\u6210\u5458", "team", "/team", true, null),
                    new WorkbenchConfigResponse.MenuItem("attendance", "\u8003\u52e4\u7ba1\u7406", "calendar", "/attendance", true, null),
                    new WorkbenchConfigResponse.MenuItem("employees", "\u5458\u5de5\u7ba1\u7406", "user", "/employees", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-apply", "\u8d39\u7528\u62a5\u9500", "wallet", "/expense/apply", true, null)
            );
            case "worker" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "\u5de5\u4f5c\u53f0", "dashboard", "/workbench", true, null),
                    new WorkbenchConfigResponse.MenuItem("construction-log", "\u65bd\u5de5\u65e5\u5fd7", "file-text", "/construction_log", true, null),
                    new WorkbenchConfigResponse.MenuItem("injury", "\u5de5\u4f24\u8865\u507f", "alert", "/injury", true, null),
                    new WorkbenchConfigResponse.MenuItem("forms", "\u8868\u5355\u4e2d\u5fc3", "file", "/forms", true, null),
                    new WorkbenchConfigResponse.MenuItem("payroll", "\u5de5\u8d44\u6761", "money", "/payroll", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-apply", "\u8d39\u7528\u62a5\u9500", "wallet", "/expense/apply", true, null)
            );
            case "general_manager" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "\u5de5\u4f5c\u53f0", "dashboard", "/workbench", true, null),
                    new WorkbenchConfigResponse.MenuItem("todo", "\u5ba1\u6279\u4e2d\u5fc3", "check-circle", "/todo", true, null),
                    new WorkbenchConfigResponse.MenuItem("projects", "\u9879\u76ee\u7ba1\u7406", "project", "/projects", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-apply", "\u8d39\u7528\u62a5\u9500", "wallet", "/expense/apply", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-records", "\u62a5\u9500\u8bb0\u5f55", "solution", "/expense/records", true, null)
            );
            default -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "\u5de5\u4f5c\u53f0", "dashboard", "/workbench", true, null),
                    new WorkbenchConfigResponse.MenuItem("forms", "\u8868\u5355\u4e2d\u5fc3", "file", "/forms", true, null),
                    new WorkbenchConfigResponse.MenuItem("attendance", "\u8003\u52e4\u7ba1\u7406", "calendar", "/attendance", true, null),
                    new WorkbenchConfigResponse.MenuItem("payroll", "\u5de5\u8d44\u6761", "money", "/payroll", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-apply", "\u8d39\u7528\u62a5\u9500", "wallet", "/expense/apply", true, null)
            );
        };
    }

    /**
     * 工作台摘要数据传输对象。
     * 字段值根据请求用户角色可能为 null。
     */
    public static class WorkbenchSummary {
        public Integer pendingApprovalCount;
        public String payrollStatus;
        public Integer activeProjectCount;
        public Integer retentionAlertCount;
        public Integer unreadNotificationCount;
    }
}
