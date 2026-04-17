package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.oa.backend.entity.Department;
import com.oa.backend.entity.Role;
import com.oa.backend.entity.SecondRoleAssignment;
import com.oa.backend.mapper.DepartmentMapper;
import com.oa.backend.mapper.RoleMapper;
import com.oa.backend.mapper.SecondRoleAssignmentMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

/**
 * 认证辅助数据服务
 *
 * 职责：为 /auth/login 和 /auth/me 响应提供辅助字段查询：
 *   - 按 roleCode 查询角色中文名称（role 表）
 *   - 按 departmentId 查询部门名称（department 表）
 *   - 按 employeeId 查询有效的第二角色编码列表（second_role_assignment 表）
 *
 * 所有方法均采用"失败兜底"策略：查询异常时返回安全默认值，不阻塞登录主流程。
 *
 * 注意：本服务不依赖 AuthController，不存在循环依赖风险。
 * 调用方：AuthController。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthDataService {

    private final RoleMapper roleMapper;
    private final DepartmentMapper departmentMapper;
    private final SecondRoleAssignmentMapper secondRoleAssignmentMapper;

    /**
     * 查询角色中文名称。查询失败时兜底返回 roleCode 本身。
     *
     * @param roleCode    角色编码（如 "finance"）
     * @param fallback    兜底值（通常传 roleCode）
     * @param logContext  日志标识（如员工 ID），用于 warn 输出
     * @return 角色中文名称，查询失败返回 fallback
     */
    public String resolveRoleName(String roleCode, String fallback, Object logContext) {
        try {
            Role role = roleMapper.selectOne(
                new QueryWrapper<Role>().eq("role_code", roleCode)
            );
            if (role != null && role.getRoleName() != null) {
                return role.getRoleName();
            }
        } catch (Exception e) {
            log.warn("AuthData: failed to load role name for context={}, roleCode={}", logContext, roleCode, e);
        }
        return fallback;
    }

    /**
     * 查询部门名称。departmentId 为 null 时直接返回空串；查询失败兜底空串。
     *
     * @param departmentId 部门 ID，可为 null
     * @param logContext   日志标识（如员工 ID）
     * @return 部门名称，无部门或查询失败返回 ""
     */
    public String resolveDepartmentName(Long departmentId, Object logContext) {
        if (departmentId == null) return "";
        try {
            Department dept = departmentMapper.selectById(departmentId);
            if (dept != null && dept.getName() != null) {
                return dept.getName();
            }
        } catch (Exception e) {
            log.warn("AuthData: failed to load department name for context={}, departmentId={}", logContext, departmentId, e);
        }
        return "";
    }

    /**
     * 查询员工有效的第二角色编码列表（revoked=false、deleted=0）。
     * 查询失败兜底返回空列表，不阻塞登录主流程。
     *
     * @param employeeId 员工 ID
     * @return 第二角色编码列表，查询失败返回空列表
     */
    public List<String> resolveSecondRoles(Long employeeId) {
        try {
            return secondRoleAssignmentMapper.selectList(
                new LambdaQueryWrapper<SecondRoleAssignment>()
                    .eq(SecondRoleAssignment::getEmployeeId, employeeId)
                    .ne(SecondRoleAssignment::getRevoked, true)
                    .eq(SecondRoleAssignment::getDeleted, 0)
            ).stream().map(SecondRoleAssignment::getRoleCode).toList();
        } catch (Exception e) {
            log.warn("AuthData: failed to query second roles for employeeId={}", employeeId, e);
            return Collections.emptyList();
        }
    }
}
