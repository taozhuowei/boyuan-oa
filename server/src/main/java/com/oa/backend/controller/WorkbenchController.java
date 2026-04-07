package com.oa.backend.controller;

import com.oa.backend.dto.UserProfileResponse;
import com.oa.backend.dto.WorkbenchConfigResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

/**
 * 工作台控制器
 */
@RestController
@RequiredArgsConstructor
public class WorkbenchController {

    /**
     * 获取当前用户个人资料
     * 权限：所有登录用户
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
     * 获取工作台配置
     * 权限：所有登录用户
     */
    @GetMapping("/workbench/config")
    public ResponseEntity<WorkbenchConfigResponse> getWorkbenchConfig(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        String role = getRoleFromAuthentication(authentication);
        return ResponseEntity.ok(buildWorkbenchConfig(role));
    }

    private String getRoleFromAuthentication(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .filter(a -> a.getAuthority().startsWith("ROLE_"))
                .map(a -> a.getAuthority().replace("ROLE_", "").toLowerCase())
                .findFirst()
                .orElse("employee");
    }

    private WorkbenchConfigResponse buildWorkbenchConfig(String role) {
        List<WorkbenchConfigResponse.MenuItem> menus = switch (role) {
            case "ceo" -> Arrays.asList(
                    new WorkbenchConfigResponse.MenuItem("workbench", "工作台", "dashboard", "/workbench", true, null),
                    new WorkbenchConfigResponse.MenuItem("approval", "审批中心", "check-circle", "/approval", true, null),
                    new WorkbenchConfigResponse.MenuItem("employees", "员工管理", "team", "/employees", true, null),
                    new WorkbenchConfigResponse.MenuItem("projects", "项目管理", "project", "/projects", true, null),
                    new WorkbenchConfigResponse.MenuItem("payroll", "薪资管理", "money", "/payroll", true, null),
                    new WorkbenchConfigResponse.MenuItem("retention", "数据保留", "safety", "/retention", true, null),
                    new WorkbenchConfigResponse.MenuItem("settings", "系统设置", "setting", "/settings", true, null)
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
}
