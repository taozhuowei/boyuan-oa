package com.oa.backend.security;

import com.oa.backend.entity.Employee;
import com.oa.backend.mapper.EmployeeMapper;
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
     * 根据用户名获取员工 ID
     * 查询 employee_no = username 的员工记录
     *
     * @param username 用户名（员工编号）
     * @param employeeMapper 员工数据访问接口
     * @return 员工 ID，未找到返回 null
     */
    public static Long getEmployeeIdFromUsername(String username, EmployeeMapper employeeMapper) {
        Employee employee = employeeMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Employee>()
                        .eq(Employee::getEmployeeNo, username)
                        .eq(Employee::getDeleted, 0)
        );
        return employee != null ? employee.getId() : null;
    }

    /**
     * 根据用户名获取员工信息
     *
     * @param username 用户名（员工编号）
     * @param employeeMapper 员工数据访问接口
     * @return 员工实体，未找到返回 null
     */
    public static Employee getEmployeeFromUsername(String username, EmployeeMapper employeeMapper) {
        return employeeMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Employee>()
                        .eq(Employee::getEmployeeNo, username)
                        .eq(Employee::getDeleted, 0)
        );
    }

    /**
     * 根据员工 ID 获取显示名称
     *
     * @param employeeId 员工 ID
     * @param employeeMapper 员工数据访问接口
     * @return 员工姓名，未找到返回 null
     */
    public static String getDisplayNameFromEmployeeId(Long employeeId, EmployeeMapper employeeMapper) {
        Employee employee = employeeMapper.selectById(employeeId);
        return employee != null ? employee.getName() : null;
    }

    /**
     * 根据用户名获取显示名称（兼容性方法，建议迁移到 DB 查询）
     * @deprecated 使用 {@link #getDisplayNameFromEmployeeId(Long, EmployeeMapper)} 替代
     */
    @Deprecated
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
     * 根据用户名获取部门（兼容性方法，建议迁移到 DB 查询）
     * @deprecated 使用员工部门关联查询替代
     */
    @Deprecated
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
