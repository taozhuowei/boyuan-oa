package com.oa.backend.controller;

import com.oa.backend.dto.AuthLoginRequest;
import com.oa.backend.dto.AuthLoginResponse;
import com.oa.backend.dto.AuthPasswordLoginRequest;
import com.oa.backend.entity.Employee;
import com.oa.backend.security.JwtTokenService;
import com.oa.backend.service.AccessManagementService;
import com.oa.backend.service.AuthDataService;
import com.oa.backend.service.EmailVerificationService;
import com.oa.backend.service.EmployeeService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
 *
 * <p>D-F-19: 登录接口阶梯式限速（内存 ConcurrentHashMap，重启清零）。 阶梯规则：失败5次锁1分钟；10次锁5分钟；20次锁15分钟；30次锁60分钟。
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

  // D-F-19: 阶梯式限速状态，key=IP，value=失败状态记录。存内存，重启清零。
  private final ConcurrentHashMap<String, LoginFailState> loginFailStates =
      new ConcurrentHashMap<>();

  /** D-F-19: 触发第一阶梯锁定所需的最小失败次数（默认5）。 测试环境通过 app.rate-limit.login-fail-threshold 调高，避免集成测试互相干扰。 */
  @Value("${app.rate-limit.login-fail-threshold:5}")
  private int loginFailThreshold;

  private final JwtTokenService jwtTokenService;
  private final AccessManagementService accessManagementService;
  private final EmployeeService employeeService;
  private final AuthDataService authDataService;
  private final PasswordEncoder passwordEncoder;
  private final EmailVerificationService emailVerificationService;

  /**
   * D-F-19: 阶梯式锁定时长（分钟）查找表。 各阶梯相对于 baseThreshold 等比缩放： baseThreshold*1→1min, *2→5min, *4→15min,
   * *6→60min。
   *
   * <p>默认 baseThreshold=5，即失败5次锁1分钟、10次锁5分钟、20次锁15分钟、30次锁60分钟。 测试环境将 baseThreshold 调高（如 100000），
   * 使锁定阈值远超测试所需失败次数，防止测试之间相互干扰。
   *
   * @param failCount 当前累计失败次数
   * @param baseThreshold 第一阶梯触发所需失败次数
   * @return 锁定时长（分钟），0 表示不锁
   */
  static int resolveLockMinutes(int failCount, int baseThreshold) {
    if (failCount >= baseThreshold * 6) return 60;
    if (failCount >= baseThreshold * 4) return 15;
    if (failCount >= baseThreshold * 2) return 5;
    if (failCount >= baseThreshold) return 1;
    return 0;
  }

  /**
   * 职责：处理用户密码登录请求，验证用户身份并返回JWT令牌 请求含义：提交用户名和密码进行身份验证 响应含义：返回包含JWT令牌的用户认证信息，包括用户名、显示名称、角色、部门等
   * 权限期望：无需认证，任何用户均可访问
   *
   * <p>D-F-19: 登录失败时累计计数；超过阶梯阈值则锁定并返回 429。
   */
  @PostMapping("/login")
  public ResponseEntity<?> login(
      @Valid @RequestBody AuthPasswordLoginRequest request, HttpServletRequest httpRequest) {
    String clientIp = httpRequest.getRemoteAddr();

    // 检查是否处于锁定期
    LoginFailState state = loginFailStates.get(clientIp);
    if (state != null && state.isLocked()) {
      long remainingSeconds = state.remainingLockSeconds();
      int remainingMinutes = (int) Math.ceil(remainingSeconds / 60.0);
      Map<String, Object> body = new LinkedHashMap<>();
      body.put("code", 429);
      body.put("message", "登录尝试过于频繁，请" + remainingMinutes + "分钟后重试");
      return ResponseEntity.status(429).body(body);
    }

    Optional<Employee> employeeOpt =
        employeeService.authenticate(request.username(), request.password());

    if (employeeOpt.isEmpty()) {
      // 登录失败：累计失败次数，按阶梯触发锁定
      final int threshold = loginFailThreshold;
      LoginFailState newState =
          loginFailStates.compute(
              clientIp,
              (ip, existing) -> {
                if (existing == null) existing = new LoginFailState();
                return existing.recordFailure(threshold);
              });

      int lockMinutes = resolveLockMinutes(newState.failCount(), loginFailThreshold);
      if (lockMinutes > 0) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", 429);
        body.put("message", "登录尝试过于频繁，请" + lockMinutes + "分钟后重试");
        return ResponseEntity.status(429).body(body);
      }
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "账号或密码错误");
    }

    // 登录成功：清除该 IP 的失败记录
    loginFailStates.remove(clientIp);

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

  /** D-F-16: 向当前用户绑定邮箱发送密码重置验证码。 若用户未绑定邮箱返回 400。 权限期望：已认证用户。 */
  @PostMapping("/password/send-reset-code")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> sendPasswordResetCode(
      @RequestHeader(value = "Authorization", required = false) String authorization) {
    Long userId = getCurrentUserId(authorization);
    if (userId == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "无法获取当前用户信息");
    }
    Employee employee =
        employeeService
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户不存在"));
    emailVerificationService.sendPasswordResetCode(employee);
    return ResponseEntity.noContent().build();
  }

  /** D-F-16: 验证密码重置验证码并更新密码。 新密码须满足 D-F-17 强度规则；验证码 5 分钟过期。 权限期望：已认证用户。 */
  @PostMapping("/password/verify-reset")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> verifyPasswordReset(
      @RequestHeader(value = "Authorization", required = false) String authorization,
      @Valid @RequestBody VerifyResetRequest request) {
    Long userId = getCurrentUserId(authorization);
    if (userId == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "无法获取当前用户信息");
    }
    Employee employee =
        employeeService
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户不存在"));
    if (employee.getEmail() == null || employee.getEmail().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请先绑定邮箱");
    }
    // 验证验证码（内部校验通过后清除缓存）
    emailVerificationService.verifyPasswordResetCode(
        employee.getId(), employee.getEmail(), request.code());
    // 更新密码
    String newPasswordHash = passwordEncoder.encode(request.newPassword());
    employeeService.updatePassword(employee.getId(), newPasswordHash, false);
    return ResponseEntity.noContent().build();
  }

  /** D-F-16 密码重置请求体。 */
  public record VerifyResetRequest(
      @NotBlank(message = "验证码不能为空") @Size(min = 6, max = 6, message = "验证码必须为6位") String code,
      @NotBlank(message = "新密码不能为空")
          @Pattern(
              regexp = "^(?=.*[A-Za-z])(?=.*\\d)[^\\s]{8,64}$",
              message = "密码须为8-64位，同时包含字母和数字，不允许空格")
          String newPassword) {}

  /** 职责：获取当前登录用户的基本信息 请求含义：获取当前登录用户的详细信息 响应含义：返回用户基本信息，包括员工ID、工号、姓名、手机号、角色、部门等 权限期望：已认证用户 */
  @GetMapping("/me")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Map<String, Object>> me(
      @RequestHeader(value = "Authorization", required = false) String authorization) {
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
    response.put("email", employee.getEmail());

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

  // ── Inner types ───────────────────────────────────────────────────────────

  /**
   * D-F-19: 登录失败状态记录。 记录累计失败次数和锁定到期时间戳（毫秒），线程安全通过 synchronized 方法保证。
   *
   * <p>锁定触发逻辑：每次 recordFailure 后，若新的累计失败次数达到阶梯阈值，则设置锁定到期时间。 锁定到期后，下次失败调用自动重置计数器（从1开始）。
   */
  static class LoginFailState {
    private final AtomicInteger count = new AtomicInteger(0);
    private volatile long lockedUntilMs = 0L;

    /**
     * 记录一次失败，并根据阶梯规则触发锁定。
     *
     * @param baseThreshold 第一阶梯触发所需失败次数（来自 loginFailThreshold 配置项）
     * @return this（便于 compute lambda 链式使用）
     */
    synchronized LoginFailState recordFailure(int baseThreshold) {
      // 如果锁已过期，重置计数器（解锁后重新从0开始计次）
      if (lockedUntilMs > 0 && System.currentTimeMillis() > lockedUntilMs) {
        count.set(0);
        lockedUntilMs = 0L;
      }
      int newCount = count.incrementAndGet();
      int lockMinutes = resolveLockMinutes(newCount, baseThreshold);
      if (lockMinutes > 0) {
        lockedUntilMs = System.currentTimeMillis() + lockMinutes * 60_000L;
      }
      return this;
    }

    /** 当前是否处于锁定期。 */
    boolean isLocked() {
      return lockedUntilMs > 0 && System.currentTimeMillis() < lockedUntilMs;
    }

    /** 剩余锁定秒数（仅在 isLocked() 为 true 时有意义）。 */
    long remainingLockSeconds() {
      long remaining = lockedUntilMs - System.currentTimeMillis();
      return Math.max(0L, remaining / 1000L);
    }

    /** 当前累计失败次数。 */
    int failCount() {
      return count.get();
    }
  }
}
