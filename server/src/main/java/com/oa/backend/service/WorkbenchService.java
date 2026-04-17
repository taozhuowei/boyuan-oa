package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.dto.UserProfileResponse;
import com.oa.backend.dto.WorkbenchConfigResponse;
import com.oa.backend.dto.WorkbenchSummaryResponse;
import com.oa.backend.entity.Department;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.FormRecord;
import com.oa.backend.entity.PayrollCycle;
import com.oa.backend.entity.Project;
import com.oa.backend.mapper.DepartmentMapper;
import com.oa.backend.mapper.EmployeeMapper;
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
    private final EmployeeMapper employeeMapper;
    private final DepartmentMapper departmentMapper;

    /**
     * 构建工作台摘要。
     * @return 填充完毕的 Summary；employeeId 为 null 时返回 null，由调用方处理
     */
    public WorkbenchSummaryResponse buildWorkbenchSummary(Authentication authentication) {
        String role = extractRole(authentication);
        Long employeeId = SecurityUtils.getCurrentEmployeeId(authentication);
        if (employeeId == null) {
            return null;
        }

        Integer unreadNotificationCount = notificationService.countUnread(employeeId);
        Integer pendingApprovalCount = calculatePendingApprovalCount(role, employeeId);
        String payrollStatus = SecurityUtils.hasFinanceAccess(authentication)
                ? getLatestPayrollCycleStatus()
                : null;
        Integer activeProjectCount = ("ceo".equals(role) || "project_manager".equals(role))
                ? countActiveProjects()
                : null;
        Integer retentionAlertCount = "ceo".equals(role)
                ? countPendingRetentionReminders()
                : null;

        return new WorkbenchSummaryResponse(
                pendingApprovalCount,
                payrollStatus,
                activeProjectCount,
                retentionAlertCount,
                unreadNotificationCount
        );
    }

    /**
     * 构建当前登录用户的个人资料。
     * 姓名、部门、员工类型、账号状态均来源于 employee / department 表，
     * 不依赖任何硬编码 demo 账号映射；确保生产环境同名用户也得到真实数据。
     */
    public UserProfileResponse buildUserProfile(Authentication authentication) {
        String username = authentication.getName();
        String role = extractRole(authentication);

        Employee employee = employeeMapper.selectOne(
                new LambdaQueryWrapper<Employee>()
                        .eq(Employee::getEmployeeNo, username)
                        .eq(Employee::getDeleted, 0)
        );

        if (employee == null) {
            // 兜底：JWT 有效但数据库查不到（理论上不应发生，例如 dev-login 或员工已删除）。
            return new UserProfileResponse(
                    username, username, role, getRoleName(role), "未分配", "OFFICE", "ACTIVE",
                    getVisibleModules(role));
        }

        String departmentName = "未分配";
        if (employee.getDepartmentId() != null) {
            Department department = departmentMapper.selectById(employee.getDepartmentId());
            if (department != null && department.getName() != null && !department.getName().isBlank()) {
                departmentName = department.getName();
            }
        }

        String displayName = (employee.getName() != null && !employee.getName().isBlank())
                ? employee.getName()
                : username;
        String employeeType = employee.getEmployeeType() != null ? employee.getEmployeeType() : "OFFICE";
        String accountStatus = employee.getAccountStatus() != null ? employee.getAccountStatus() : "ACTIVE";

        return new UserProfileResponse(
                username,
                displayName,
                role,
                getRoleName(role),
                departmentName,
                employeeType,
                accountStatus,
                getVisibleModules(role)
        );
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

    /**
     * 按角色构建侧边栏菜单。
     * 单一事实源（SOT）为前端 app/h5/layouts/default.vue 的 ROLE_MENUS；
     * 本方法产物必须与之一一对应（code/label/path 全部一致），
     * 以保证前端在 API 菜单生效前（首屏静态 fallback）与生效后的体验一致。
     * 路径均为 snake_case 以匹配 Phase A 页面目录重命名结果。
     */
    private List<WorkbenchConfigResponse.MenuItem> buildMenus(String role) {
        return switch (role) {
            case "ceo" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "工作台", "dashboard", "/", true, null),
                    new WorkbenchConfigResponse.MenuItem("todo", "审批中心", "check-circle", "/todo", true, null),
                    new WorkbenchConfigResponse.MenuItem("employees", "员工管理", "team", "/employees", true, null),
                    new WorkbenchConfigResponse.MenuItem("org", "组织架构", "apartment", "/org", true, null),
                    new WorkbenchConfigResponse.MenuItem("positions", "岗位管理", "idcard", "/positions", true, null),
                    new WorkbenchConfigResponse.MenuItem("allowances", "补贴配置", "idcard", "/allowances", true, null),
                    new WorkbenchConfigResponse.MenuItem("role", "角色管理", "user-switch", "/role", true, null),
                    new WorkbenchConfigResponse.MenuItem("projects", "项目管理", "project", "/projects", true, null),
                    new WorkbenchConfigResponse.MenuItem("payroll", "薪资管理", "money", "/payroll", true, null),
                    new WorkbenchConfigResponse.MenuItem("construction_log", "施工日志", "file-text", "/construction_log", true, null),
                    new WorkbenchConfigResponse.MenuItem("injury", "工伤补偿", "alert", "/injury", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-apply", "费用报销", "wallet", "/expense/apply", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-records", "报销记录", "solution", "/expense/records", true, null),
                    new WorkbenchConfigResponse.MenuItem("retention", "数据保留", "safety", "/retention", true, null),
                    new WorkbenchConfigResponse.MenuItem("data_export", "数据导出", "export", "/data_export", true, null),
                    new WorkbenchConfigResponse.MenuItem("data_viewer", "数据查看", "database", "/data_viewer", true, null),
                    new WorkbenchConfigResponse.MenuItem("operation_logs", "操作日志", "audit", "/operation_logs", true, null),
                    new WorkbenchConfigResponse.MenuItem("config", "系统配置", "setting", "/config", true, null)
            );
            case "finance" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "工作台", "dashboard", "/", true, null),
                    new WorkbenchConfigResponse.MenuItem("todo", "审批中心", "check-circle", "/todo", true, null),
                    new WorkbenchConfigResponse.MenuItem("employees", "员工管理", "team", "/employees", true, null),
                    new WorkbenchConfigResponse.MenuItem("payroll", "薪资管理", "money", "/payroll", true, null),
                    new WorkbenchConfigResponse.MenuItem("injury", "工伤理赔", "alert", "/injury", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-apply", "费用报销", "wallet", "/expense/apply", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-records", "报销记录", "solution", "/expense/records", true, null),
                    new WorkbenchConfigResponse.MenuItem("allowances", "补贴配置", "idcard", "/allowances", true, null),
                    new WorkbenchConfigResponse.MenuItem("positions", "岗位薪资配置", "idcard", "/positions", true, null),
                    new WorkbenchConfigResponse.MenuItem("projects", "项目管理", "project", "/projects", true, null),
                    new WorkbenchConfigResponse.MenuItem("directory", "通讯录导入", "import", "/directory", true, null)
            );
            case "project_manager" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "工作台", "dashboard", "/", true, null),
                    new WorkbenchConfigResponse.MenuItem("todo", "审批中心", "check-circle", "/todo", true, null),
                    new WorkbenchConfigResponse.MenuItem("projects", "项目管理", "project", "/projects", true, null),
                    new WorkbenchConfigResponse.MenuItem("construction_log", "施工日志", "file-text", "/construction_log", true, null),
                    new WorkbenchConfigResponse.MenuItem("templates", "工作项模板", "form", "/construction_log/templates", true, null),
                    new WorkbenchConfigResponse.MenuItem("forms", "表单中心", "file", "/forms", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-apply", "费用报销", "wallet", "/expense/apply", true, null)
            );
            case "hr" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "工作台", "dashboard", "/", true, null),
                    new WorkbenchConfigResponse.MenuItem("employees", "员工管理", "team", "/employees", true, null),
                    new WorkbenchConfigResponse.MenuItem("org", "组织架构", "apartment", "/org", true, null),
                    new WorkbenchConfigResponse.MenuItem("positions", "岗位管理", "idcard", "/positions", true, null),
                    new WorkbenchConfigResponse.MenuItem("leave_types", "假期配额", "calendar", "/leave_types", true, null),
                    new WorkbenchConfigResponse.MenuItem("attendance", "考勤管理", "calendar", "/attendance", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-apply", "费用报销", "wallet", "/expense/apply", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-records", "报销记录", "solution", "/expense/records", true, null)
            );
            case "department_manager" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "工作台", "dashboard", "/", true, null),
                    new WorkbenchConfigResponse.MenuItem("todo", "审批中心", "check-circle", "/todo", true, null),
                    new WorkbenchConfigResponse.MenuItem("team", "团队成员", "team", "/team", true, null),
                    new WorkbenchConfigResponse.MenuItem("attendance", "考勤管理", "calendar", "/attendance", true, null),
                    new WorkbenchConfigResponse.MenuItem("employees", "员工管理", "user", "/employees", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-apply", "费用报销", "wallet", "/expense/apply", true, null)
            );
            case "worker" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "工作台", "dashboard", "/", true, null),
                    new WorkbenchConfigResponse.MenuItem("attendance", "考勤申请", "calendar", "/attendance", true, null),
                    new WorkbenchConfigResponse.MenuItem("construction_log", "施工日志", "file-text", "/construction_log", true, null),
                    new WorkbenchConfigResponse.MenuItem("injury", "工伤补偿", "alert", "/injury", true, null),
                    new WorkbenchConfigResponse.MenuItem("forms", "表单中心", "file", "/forms", true, null),
                    new WorkbenchConfigResponse.MenuItem("payroll", "工资条", "money", "/payroll", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-apply", "费用报销", "wallet", "/expense/apply", true, null)
            );
            // 总经理：可见全项目与营收，但不见考勤/薪资/HR 档案（设计 §3.2）
            case "general_manager" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "工作台", "dashboard", "/", true, null),
                    new WorkbenchConfigResponse.MenuItem("todo", "审批中心", "check-circle", "/todo", true, null),
                    new WorkbenchConfigResponse.MenuItem("projects", "项目管理", "project", "/projects", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-apply", "费用报销", "wallet", "/expense/apply", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-records", "报销记录", "solution", "/expense/records", true, null)
            );
            case "ops" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "工作台", "dashboard", "/", true, null),
                    new WorkbenchConfigResponse.MenuItem("operation_logs", "操作日志", "audit", "/operation_logs", true, null)
            );
            case "employee" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "工作台", "dashboard", "/", true, null),
                    new WorkbenchConfigResponse.MenuItem("forms", "表单中心", "file", "/forms", true, null),
                    new WorkbenchConfigResponse.MenuItem("attendance", "考勤管理", "calendar", "/attendance", true, null),
                    new WorkbenchConfigResponse.MenuItem("payroll", "工资条", "money", "/payroll", true, null),
                    new WorkbenchConfigResponse.MenuItem("expense-apply", "费用报销", "wallet", "/expense/apply", true, null)
            );
            // 未知角色仅展示最小菜单，防止未授权访问
            default -> List.of(
                    new WorkbenchConfigResponse.MenuItem("workbench", "工作台", "dashboard", "/", true, null)
            );
        };
    }
}
