package com.oa.backend.controller;

import com.oa.backend.dto.AuthLoginRequest;
import com.oa.backend.dto.AuthLoginResponse;
import com.oa.backend.dto.AuthPasswordLoginRequest;
import com.oa.backend.entity.Employee;
import com.oa.backend.entity.Department;
import com.oa.backend.entity.Role;
import com.oa.backend.mapper.DepartmentMapper;
import com.oa.backend.mapper.RoleMapper;
import com.oa.backend.security.JwtTokenService;
import com.oa.backend.service.AccessManagementService;
import com.oa.backend.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

/**
 * 认证控制器
 * 负责处理用户登录相关的认证请求，包括密码登录和开发环境登录
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtTokenService jwtTokenService;
    private final AccessManagementService accessManagementService;
    private final EmployeeService employeeService;
    private final RoleMapper roleMapper;
    private final DepartmentMapper departmentMapper;

    /**
     * 职责：处理用户密码登录请求，验证用户身份并返回JWT令牌
     * 请求含义：提交用户名和密码进行身份验证
     * 响应含义：返回包含JWT令牌的用户认证信息，包括用户名、显示名称、角色、部门等
     * 权限期望：无需认证，任何用户均可访问
     */
    @PostMapping("/login")
    public ResponseEntity<AuthLoginResponse> login(@Valid @RequestBody AuthPasswordLoginRequest request) {
        // 使用 EmployeeService 进行真实认证
        Optional<Employee> employeeOpt = employeeService.authenticate(
            request.username(), 
            request.password()
        );

        if (employeeOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "账号或密码错误");
        }

        Employee employee = employeeOpt.get();

        // 生成JWT令牌
        String token = jwtTokenService.generateToken(
            employee.getEmployeeNo(),
            employee.getId(),
            employee.getRoleCode(),
            employee.getEmployeeType(),
            employee.getName()
        );

        // 查询角色名称
        String roleName = employee.getRoleCode();
        try {
            Role role = roleMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<Role>()
                    .eq("role_code", employee.getRoleCode())
            );
            if (role != null && role.getRoleName() != null) {
                roleName = role.getRoleName();
            }
        } catch (Exception e) {
            // 如果查询失败，使用 roleCode 本身
            roleName = employee.getRoleCode();
        }

        // 查询部门名称
        String departmentName = "";
        if (employee.getDepartmentId() != null) {
            try {
                Department dept = departmentMapper.selectById(employee.getDepartmentId());
                if (dept != null && dept.getName() != null) {
                    departmentName = dept.getName();
                }
            } catch (Exception e) {
                // 如果查询失败，使用空字符串
                departmentName = "";
            }
        }

        return ResponseEntity.ok(new AuthLoginResponse(
            token,
            "Bearer",
            "PASSWORD_LOGIN",
            employee.getId(),
            employee.getEmployeeNo(),
            employee.getName(),
            employee.getRoleCode(),
            roleName,
            departmentName,
            employee.getEmployeeType()
        ));
    }

    /**
     * 职责：处理开发环境登录请求，用于开发和测试场景快速登录
     * 请求含义：提交用户名、显示名称和角色信息进行快速身份构建（无需密码验证）
     * 响应含义：返回包含JWT令牌的用户认证信息，登录类型标记为DEV_LOGIN
     * 权限期望：无需认证，但建议仅在开发环境使用
     */
    @PostMapping("/dev-login")
    public ResponseEntity<AuthLoginResponse> devLogin(@Valid @RequestBody AuthLoginRequest request) {
        String displayName = request.displayName() == null || request.displayName().isBlank()
            ? request.username()
            : request.displayName().trim();
        String role = request.role() == null || request.role().isBlank()
            ? "employee"
            : request.role().trim().toLowerCase();
        AccessManagementService.AuthenticatedUser user = accessManagementService
            .buildProfile(request.username().trim(), displayName, role);
        String token = jwtTokenService.generateToken(user.username(), user.roleCode(), user.displayName());

        return ResponseEntity.ok(new AuthLoginResponse(
            token,
            "Bearer",
            "DEV_LOGIN",
            null,  // dev-login 没有真实 userId
            user.username(),
            user.displayName(),
            user.roleCode(),
            user.roleName(),
            user.department(),
            user.employeeType()
        ));
    }
}
