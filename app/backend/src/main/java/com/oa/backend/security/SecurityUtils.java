package com.oa.backend.security;

import org.springframework.security.core.Authentication;

import java.util.Arrays;
import java.util.List;

/**
 * 安全工具类
 * 集中管理权限判断和用户相关工具方法
 */
public class SecurityUtils {

    private static final List<String> EMPLOYEE_ACCESS_ROLES = Arrays.asList(
            "ROLE_EMPLOYEE", "ROLE_FINANCE", "ROLE_PROJECT_MANAGER", "ROLE_CEO", "ROLE_WORKER"
    );

    private static final List<String> FINANCE_ACCESS_ROLES = Arrays.asList(
            "ROLE_FINANCE", "ROLE_CEO"
    );

    private static final List<String> APPROVER_ROLES = Arrays.asList(
            "ROLE_PROJECT_MANAGER", "ROLE_CEO"
    );

    /**
     * 根据用户名获取显示名称
     */
    public static String getDisplayNameFromUsername(String username) {
        return switch (username.toLowerCase()) {
            case "employee.demo" -> "张晓宁";
            case "worker.demo" -> "赵铁柱";
            case "finance.demo" -> "李静";
            case "pm.demo" -> "王建国";
            case "ceo.demo" -> "陈明远";
            default -> username;
        };
    }

    /**
     * 根据用户名获取部门
     */
    public static String getDepartmentFromUsername(String username) {
        return switch (username.toLowerCase()) {
            case "employee.demo" -> "综合管理部";
            case "worker.demo" -> "施工一部";
            case "finance.demo" -> "财务管理部";
            case "pm.demo" -> "项目一部";
            case "ceo.demo" -> "运营管理部";
            default -> "未分配";
        };
    }

    /**
     * 判断是否为 CEO
     */
    public static boolean isCEO(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_CEO".equals(a.getAuthority()));
    }

    /**
     * 判断是否为财务角色
     */
    public static boolean isFinance(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_FINANCE".equals(a.getAuthority()));
    }

    /**
     * 判断是否仅有财务角色（不包含 CEO）
     */
    public static boolean isFinanceOnly(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_FINANCE".equals(a.getAuthority()));
    }

    /**
     * 判断是否有财务访问权限（财务或 CEO）
     */
    public static boolean hasFinanceAccess(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> FINANCE_ACCESS_ROLES.contains(a.getAuthority()));
    }

    /**
     * 判断是否有员工访问权限
     */
    public static boolean hasEmployeeAccess(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> EMPLOYEE_ACCESS_ROLES.contains(a.getAuthority()));
    }

    /**
     * 判断是否为劳工角色
     */
    public static boolean isWorker(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_WORKER".equals(a.getAuthority()));
    }

    /**
     * 判断是否为项目经理
     */
    public static boolean isProjectManager(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_PROJECT_MANAGER".equals(a.getAuthority()));
    }

    /**
     * 判断是否可以审批（项目经理或 CEO）
     */
    public static boolean canApprove(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> APPROVER_ROLES.contains(a.getAuthority()));
    }

    /**
     * 获取审批者角色
     */
    public static String getApproverRole(Authentication authentication) {
        if (authentication == null) {
            return null;
        }

        return authentication.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .filter(APPROVER_ROLES::contains)
                .findFirst()
                .map(authority -> authority.replace("ROLE_", ""))
                .orElse(null);
    }
}
