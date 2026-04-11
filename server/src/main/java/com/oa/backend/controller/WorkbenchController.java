package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.dto.UserProfileResponse;
import com.oa.backend.dto.WorkbenchConfigResponse;
import com.oa.backend.entity.FormRecord;
import com.oa.backend.entity.PayrollCycle;
import com.oa.backend.entity.Project;
import com.oa.backend.entity.RetentionReminder;
import com.oa.backend.mapper.FormRecordMapper;
import com.oa.backend.mapper.PayrollCycleMapper;
import com.oa.backend.mapper.ProjectMapper;
import com.oa.backend.mapper.RetentionReminderMapper;
import com.oa.backend.security.SecurityUtils;
import com.oa.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * 工作台控制器。
 * <p>
 * 提供工作台相关的配置、用户资料和摘要信息查询。
 * 摘要信息根据用户角色动态返回不同的数据项。
 *
 * @author OA Backend Team
 * @since 1.0
 */
@RestController
@RequiredArgsConstructor
public class WorkbenchController {

    private final NotificationService notificationService;
    private final FormRecordMapper formRecordMapper;
    private final PayrollCycleMapper payrollCycleMapper;
    private final ProjectMapper projectMapper;
    private final RetentionReminderMapper retentionReminderMapper;

    /**
     * 获取当前用户个人资料。
     * <p>
     * 权限：所有登录用户
     *
     * @param authentication 当前用户认证信息
     * @return 用户资料
     */
    @GetMapping("/me/profile")
    public ResponseEntity<UserProfileResponse> getMyProfile(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        String username = authentication.getName();
        String role = getRoleFromAuthentication(authentication);
        return ResponseEntity.ok(buildUserProfile(username, role));
    }

    /**
     * 获取工作台配置。
     * <p>
     * 权限：所有登录用户
     *
     * @param authentication 当前用户认证信息
     * @return 工作台配置
     */
    @GetMapping("/workbench/config")
    public ResponseEntity<WorkbenchConfigResponse> getWorkbenchConfig(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        String role = getRoleFromAuthentication(authentication);
        return ResponseEntity.ok(buildWorkbenchConfig(role));
    }

    /**
     * 获取工作台摘要信息。
     * <p>
     * 根据用户角色返回不同的数据项：
     * <ul>
     *   <li>待审批数量（相关角色）</li>
     *   <li>薪资状态（财务/CEO）</li>
     *   <li>活跃项目数（CEO/项目经理）</li>
     *   <li>保留提醒数（CEO）</li>
     *   <li>未读通知数（所有角色）</li>
     * </ul>
     *
     * @param authentication 当前用户认证信息
     * @return 摘要数据，字段值根据角色可能为 null
     */
    @GetMapping("/workbench/summary")
    public ResponseEntity<?> getWorkbenchSummary(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("message", "未登录"));
        }

        String role = getRoleFromAuthentication(authentication);
        Long employeeId = SecurityUtils.getCurrentEmployeeId(authentication);
        if (employeeId == null) {
            return ResponseEntity.status(403).body(Map.of("message", "无法识别当前用户"));
        }

        WorkbenchSummary summary = new WorkbenchSummary();

        // 未读通知数 - 所有角色
        summary.unreadNotificationCount = notificationService.countUnread(employeeId);

        // 待审批数量 - 根据角色返回不同数据
        summary.pendingApprovalCount = calculatePendingApprovalCount(role, employeeId);

        // 薪资状态 - 仅财务和 CEO
        if (SecurityUtils.hasFinanceAccess(authentication)) {
            summary.payrollStatus = getLatestPayrollCycleStatus();
        }

        // 活跃项目数 - CEO 和项目经理
        if ("ceo".equals(role) || "project_manager".equals(role)) {
            summary.activeProjectCount = countActiveProjects();
        }

        // 保留提醒数 - 仅 CEO
        if ("ceo".equals(role)) {
            summary.retentionAlertCount = countPendingRetentionReminders();
        }

        return ResponseEntity.ok(summary);
    }

    // ── Private helpers ───────────────────────────────────────────────────

    /**
     * 计算待审批数量。
     * <p>
     * 根据角色返回不同的待审批计数逻辑。
     *
     * @param role       用户角色
     * @param employeeId 员工 ID
     * @return 待审批数量
     */
    private Integer calculatePendingApprovalCount(String role, Long employeeId) {
        return switch (role) {
            case "ceo", "project_manager" -> {
                // 审批人视角：统计需要我审批的 PENDING 状态表单
                Long count = formRecordMapper.selectCount(
                        new LambdaQueryWrapper<FormRecord>()
                                .eq(FormRecord::getStatus, "PENDING")
                                .eq(FormRecord::getDeleted, 0)
                );
                yield count != null ? count.intValue() : 0;
            }
            case "employee", "worker" -> {
                // 提交人视角：统计我提交的待审批表单
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

    /**
     * 获取最新工资周期的状态。
     *
     * @return 最新工资周期状态，无数据时返回 null
     */
    private String getLatestPayrollCycleStatus() {
        List<PayrollCycle> cycles = payrollCycleMapper.selectList(
                new LambdaQueryWrapper<PayrollCycle>()
                        .eq(PayrollCycle::getDeleted, 0)
                        .orderByDesc(PayrollCycle::getPeriod)
                        .last("LIMIT 1")
        );
        return cycles.isEmpty() ? null : cycles.get(0).getStatus();
    }

    /**
     * 统计活跃项目数量。
     *
     * @return 活跃项目数
     */
    private Integer countActiveProjects() {
        Long count = projectMapper.selectCount(
                new LambdaQueryWrapper<Project>()
                        .eq(Project::getStatus, "ACTIVE")
                        .eq(Project::getDeleted, 0)
        );
        return count != null ? count.intValue() : 0;
    }

    /**
     * 统计待处理的保留提醒数量。
     *
     * @return 待处理提醒数
     */
    private Integer countPendingRetentionReminders() {
        return retentionReminderMapper.countByStatus("PENDING");
    }

    /**
     * 从认证信息中提取角色。
     *
     * @param authentication 认证信息
     * @return 角色名称（小写）
     */
    private String getRoleFromAuthentication(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .filter(a -> a.getAuthority().startsWith("ROLE_"))
                .map(a -> a.getAuthority().replace("ROLE_", "").toLowerCase())
                .findFirst()
                .orElse("employee");
    }

    /**
     * 构建用户资料响应。
     *
     * @param username 用户名
     * @param role     角色
     * @return 用户资料
     */
    private UserProfileResponse buildUserProfile(String username, String role) {
        return switch (username.toLowerCase()) {
            case "employee.demo" -> new UserProfileResponse(
                    username, "张晓宁", role, getRoleName(role), "综合管理部", "OFFICE", "ACTIVE",
                    getVisibleModules(role)
            );
            case "worker.demo" -> new UserProfileResponse(
                    username, "赵铁柱", role, getRoleName(role), "施工一部", "LABOR", "ACTIVE",
                    getVisibleModules(role)
            );
            case "finance.demo" -> new UserProfileResponse(
                    username, "李静", role, getRoleName(role), "财务管理部", "OFFICE", "ACTIVE",
                    getVisibleModules(role)
            );
            case "pm.demo" -> new UserProfileResponse(
                    username, "王建国", role, getRoleName(role), "项目一部", "OFFICE", "ACTIVE",
                    getVisibleModules(role)
            );
            case "ceo.demo" -> new UserProfileResponse(
                    username, "陈明远", role, getRoleName(role), "运营管理部", "OFFICE", "ACTIVE",
                    getVisibleModules(role)
            );
            default -> new UserProfileResponse(
                    username, username, role, getRoleName(role), "未分配", "OFFICE", "ACTIVE",
                    getVisibleModules(role)
            );
        };
    }

    /**
     * 获取角色显示名称。
     *
     * @param role 角色编码
     * @return 角色名称
     */
    private String getRoleName(String role) {
        return switch (role) {
            case "employee" -> "员工";
            case "finance" -> "财务";
            case "project_manager" -> "项目经理";
            case "ceo" -> "首席经营者";
            case "worker" -> "劳工";
            default -> "员工";
        };
    }

    /**
     * 获取角色可见模块列表。
     *
     * @param role 角色编码
     * @return 模块列表
     */
    private List<String> getVisibleModules(String role) {
        return switch (role) {
            case "ceo" -> List.of("workbench", "forms", "employees", "projects", "directory", "payroll", "retention", "role");
            case "finance" -> List.of("workbench", "forms", "employees", "directory", "payroll");
            case "project_manager" -> List.of("workbench", "forms", "employees", "projects");
            case "worker" -> List.of("workbench", "forms", "employees", "projects", "payroll");
            default -> List.of("workbench", "forms", "employees", "projects", "payroll");
        };
    }

    /**
     * 构建工作台配置响应。
     *
     * @param role 角色编码
     * @return 工作台配置
     */
    private WorkbenchConfigResponse buildWorkbenchConfig(String role) {
        List<WorkbenchConfigResponse.MenuItem> menus = switch (role) {
            case "ceo" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "工作台", "dashboard", "/workbench", true, null),
                    new WorkbenchConfigResponse.MenuItem("approval", "审批中心", "check-circle", "/approval", true, null),
                    new WorkbenchConfigResponse.MenuItem("employees", "员工管理", "team", "/employees", true, null),
                    new WorkbenchConfigResponse.MenuItem("projects", "项目管理", "project", "/projects", true, null),
                    new WorkbenchConfigResponse.MenuItem("payroll", "薪资管理", "money", "/payroll", true, null),
                    new WorkbenchConfigResponse.MenuItem("retention", "数据保留", "safety", "/retention", true, null),
                    new WorkbenchConfigResponse.MenuItem("operation-logs", "Operation Logs", "audit", "/operation-logs", true, null),
                    new WorkbenchConfigResponse.MenuItem("settings", "System Config", "setting", "/config", true, null)
            );
            case "finance" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "工作台", "dashboard", "/workbench", true, null),
                    new WorkbenchConfigResponse.MenuItem("approval", "审批中心", "check-circle", "/approval", true, null),
                    new WorkbenchConfigResponse.MenuItem("employees", "员工管理", "team", "/employees", true, null),
                    new WorkbenchConfigResponse.MenuItem("payroll", "薪资管理", "money", "/payroll", true, null),
                    new WorkbenchConfigResponse.MenuItem("directory", "通讯录导入", "import", "/directory", true, null)
            );
            case "project_manager" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "工作台", "dashboard", "/workbench", true, null),
                    new WorkbenchConfigResponse.MenuItem("approval", "审批中心", "check-circle", "/approval", true, null),
                    new WorkbenchConfigResponse.MenuItem("projects", "项目管理", "project", "/projects", true, null),
                    new WorkbenchConfigResponse.MenuItem("forms", "表单中心", "form", "/forms", true, null)
            );
            case "worker" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "工作台", "dashboard", "/workbench", true, null),
                    new WorkbenchConfigResponse.MenuItem("forms", "表单中心", "form", "/forms", true,
                            Arrays.asList(
                                    new WorkbenchConfigResponse.MenuItem("log", "施工日志", "file", "/forms/log", true, null),
                                    new WorkbenchConfigResponse.MenuItem("injury", "工伤补偿", "alert", "/forms/injury", true, null)
                            )),
                    new WorkbenchConfigResponse.MenuItem("payroll", "工资条", "money", "/payroll/slips", true, null)
            );
            case "hr" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "Workbench", "dashboard", "/workbench", true, null),
                    new WorkbenchConfigResponse.MenuItem("employees", "Employee Mgmt", "team", "/employees", true, null),
                    new WorkbenchConfigResponse.MenuItem("org", "Org Chart", "apartment", "/org", true, null),
                    new WorkbenchConfigResponse.MenuItem("positions", "Position Mgmt", "idcard", "/positions", true, null),
                    new WorkbenchConfigResponse.MenuItem("attendance", "Attendance", "calendar", "/attendance", true, null)
            );
            default -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "工作台", "dashboard", "/workbench", true, null),
                    new WorkbenchConfigResponse.MenuItem("forms", "表单中心", "form", "/forms", true, null),
                    new WorkbenchConfigResponse.MenuItem("payroll", "工资条", "money", "/payroll/slips", true, null)
            );
        };

        List<WorkbenchConfigResponse.QuickAction> quickActions = Arrays.asList(
                new WorkbenchConfigResponse.QuickAction("leave", "请假", "calendar", "/forms/leave", true),
                new WorkbenchConfigResponse.QuickAction("overtime", "加班", "clock-circle", "/forms/overtime", true),
                new WorkbenchConfigResponse.QuickAction("notification", "通知", "bell", "/notifications", true)
        );

        WorkbenchConfigResponse.DashboardWidgets widgets = new WorkbenchConfigResponse.DashboardWidgets(
                true, true, true, true
        );

        return new WorkbenchConfigResponse(menus, quickActions, widgets);
    }

    // ── Inner types ───────────────────────────────────────────────────────

    /**
     * 工作台摘要数据传输对象。
     * <p>
     * 字段值根据请求用户角色可能为 null。
     */
    public static class WorkbenchSummary {
        /** 待审批数量 */
        public Integer pendingApprovalCount;

        /** 最新薪资周期状态 */
        public String payrollStatus;

        /** 活跃项目数量 */
        public Integer activeProjectCount;

        /** 待处理保留提醒数量 */
        public Integer retentionAlertCount;

        /** 未读通知数量 */
        public Integer unreadNotificationCount;
    }
}
