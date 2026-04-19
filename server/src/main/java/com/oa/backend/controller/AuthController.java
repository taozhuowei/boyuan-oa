package com.oa.backend.controller;

import com.oa.backend.dto.AuthLoginRequest;
import com.oa.backend.dto.AuthLoginResponse;
import com.oa.backend.dto.AuthPasswordLoginRequest;
import com.oa.backend.entity.Employee;
import com.oa.backend.security.JwtTokenService;
import com.oa.backend.service.AccessManagementService;
import com.oa.backend.service.AuthDataService;
import com.oa.backend.service.EmployeeService;
import jakarta.validation.Valid;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * 核心认证控制器 负责处理用户登录、登出、当前用户信息查询以及密码修改。 密码重置流程（忘记密码）由 PasswordResetController 负责。 手机号变更流程由
 * PhoneChangeController 负责。 辅助数据查询（角色名/部门名/第二角色）委托 {@link AuthDataService}。
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

  private final JwtTokenService jwtTokenService;
  private final AccessManagementService accessManagementService;
  private final EmployeeService employeeService;
  private final AuthDataService authDataService;
  private final PasswordEncoder passwordEncoder;

  /**
   * 职责：处理用户密码登录请求，验证用户身份并返回JWT令牌 请求含义：提交用户名和密码进行身份验证 响应含义：返回包含JWT令牌的用户认证信息，包括用户名、显示名称、角色、部门等
   * 权限期望：无需认证，任何用户均可访问
   */
  @PostMapping("/login")
  public ResponseEntity<AuthLoginResponse> login(
      @Valid @RequestBody AuthPasswordLoginRequest request) {
    Optional<Employee> employeeOpt =
        employeeService.authenticate(request.username(), request.password());

    if (employeeOpt.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "账号或密码错误");
    }

    Employee employee = employeeOpt.get();

    String token =
        jwtTokenService.generateToken(
            employee.getEmployeeNo(),
            employee.getId(),
            employee.getRoleCode(),
            employee.getEmployeeType(),
            employee.getName());

    String roleName =
        authDataService.resolveRoleName(
            employee.getRoleCode(), employee.getRoleCode(), employee.getId());
    String departmentName =
        authDataService.resolveDepartmentName(employee.getDepartmentId(), employee.getId());
    java.util.List<String> secondRoles = authDataService.resolveSecondRoles(employee.getId());

    return ResponseEntity.ok(
        new AuthLoginResponse(
            token,
            "Bearer",
            "PASSWORD_LOGIN",
            employee.getId(),
            employee.getEmployeeNo(),
            employee.getName(),
            employee.getRoleCode(),
            roleName,
            departmentName,
            employee.getEmployeeType(),
            secondRoles));
  }

  /**
   * 职责：处理开发环境登录请求，用于开发和测试场景快速登录 请求含义：提交用户名、显示名称和角色信息进行快速身份构建（无需密码验证）
   * 响应含义：返回包含JWT令牌的用户认证信息，登录类型标记为DEV_LOGIN 权限期望：无需认证，但建议仅在开发环境使用
   */
  @PostMapping("/dev-login")
  public ResponseEntity<AuthLoginResponse> devLogin(@Valid @RequestBody AuthLoginRequest request) {
    String displayName =
        request.displayName() == null || request.displayName().isBlank()
            ? request.username()
            : request.displayName().trim();
    String role =
        request.role() == null || request.role().isBlank()
            ? "employee"
            : request.role().trim().toLowerCase();
    AccessManagementService.AuthenticatedUser user =
        accessManagementService.buildProfile(request.username().trim(), displayName, role);
    String token =
        jwtTokenService.generateToken(user.username(), user.roleCode(), user.displayName());

    return ResponseEntity.ok(
        new AuthLoginResponse(
            token,
            "Bearer",
            "DEV_LOGIN",
            null,
            user.username(),
            user.displayName(),
            user.roleCode(),
            user.roleName(),
            user.department(),
            user.employeeType(),
            Collections.emptyList()));
  }

  /** 职责：修改当前登录用户的密码 请求含义：提交当前密码和新密码进行密码修改 响应含义：密码修改成功返回 204 No Content 权限期望：已认证用户 */
  @PostMapping("/change-password")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> changePassword(
      @RequestHeader("Authorization") String authorization,
      @RequestBody Map<String, String> request) {
    Long userId = getCurrentUserId(authorization);
    if (userId == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "无法获取当前用户信息");
    }

    String currentPassword = request.get("currentPassword");
    String newPassword = request.get("newPassword");

    if (currentPassword == null || currentPassword.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "当前密码不能为空");
    }
    if (newPassword == null || newPassword.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "新密码不能为空");
    }
    if (newPassword.length() < 6) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "新密码长度不能少于6位");
    }

    Employee employee =
        employeeService
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户不存在"));

    if (!passwordEncoder.matches(currentPassword, employee.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "current password is incorrect");
    }

    String newPasswordHash = passwordEncoder.encode(newPassword);
    employeeService.updatePassword(employee.getId(), newPasswordHash, false);

    return ResponseEntity.noContent().build();
  }

  /** 职责：获取当前登录用户的基本信息 请求含义：获取当前登录用户的详细信息 响应含义：返回用户基本信息，包括员工ID、工号、姓名、手机号、角色、部门等 权限期望：已认证用户 */
  @GetMapping("/me")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Map<String, Object>> me(
      @RequestHeader("Authorization") String authorization) {
    Long userId = getCurrentUserId(authorization);
    if (userId == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "无法获取当前用户信息");
    }

    Employee employee =
        employeeService
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户不存在"));

    String roleName =
        authDataService.resolveRoleName(
            employee.getRoleCode(), employee.getRoleCode(), employee.getId());
    String departmentName =
        authDataService.resolveDepartmentName(employee.getDepartmentId(), employee.getId());

    Map<String, Object> response = new java.util.HashMap<>();
    response.put("employeeId", employee.getId());
    response.put("employeeNo", employee.getEmployeeNo());
    response.put("name", employee.getName());
    response.put("phone", employee.getPhone());
    response.put("roleCode", employee.getRoleCode());
    response.put("roleName", roleName);
    response.put("departmentName", departmentName);
    response.put("employeeType", employee.getEmployeeType());
    response.put("isDefaultPassword", employee.getIsDefaultPassword());

    return ResponseEntity.ok(response);
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private Long getCurrentUserId(String authorization) {
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      return null;
    }
    String token = authorization.substring(7);
    return jwtTokenService
        .verify(token)
        .map(decodedJWT -> decodedJWT.getClaim("userId").asLong())
        .orElse(null);
  }
}
