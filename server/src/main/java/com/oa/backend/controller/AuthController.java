package com.oa.backend.controller;

import com.oa.backend.dto.AuthLoginRequest;
import com.oa.backend.dto.AuthLoginResponse;
import com.oa.backend.dto.AuthPasswordLoginRequest;
import com.oa.backend.entity.Employee;
import com.oa.backend.security.JwtTokenService;
import com.oa.backend.service.AccessManagementService;
import com.oa.backend.service.AuthDataService;
import com.oa.backend.service.CaptchaService;
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

  // D-F-19: 阶梯式限速状态（双层）。存内存，重启清零。
  // 1) 按 IP 维度计数（全局粗粒度保护，防止单 IP 爆破）
  // 2) 按账号维度计数（精准保护，避免共享 IP 场景一人输错全员被锁）
  // 登录时任一被锁即拒绝；失败时双方都累计；成功时双方都清零。
  private final ConcurrentHashMap<String, LoginFailState> loginFailStates =
      new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, LoginFailState> loginFailStatesByUsername =
      new ConcurrentHashMap<>();

  /** D-F-19: 触发第一阶梯锁定所需的最小失败次数（生产与测试均为 5，保持真实覆盖）。 */
  @Value("${app.rate-limit.login-fail-threshold:5}")
  private int loginFailThreshold;

  /** 清空全部 IP + 账号的登录失败计数。仅由 DevController /dev/reset-rate-limit 使用（dev profile）。 生产环境不应调用。 */
  public void resetAllLoginFailStates() {
    loginFailStates.clear();
    loginFailStatesByUsername.clear();
  }

  /**
   * 清空指定账号的登录失败计数（per-account 维度）。 由 PasswordResetController 在密码重置成功时调用，实现 DEF-AUTH-03 自助解锁。
   *
   * @param username 要清零的账号用户名（employee_no）
   */
  public void resetLoginFailStatesForUsername(String username) {
    if (username != null) {
      loginFailStatesByUsername.remove(username);
    }
  }

  private final JwtTokenService jwtTokenService;
  private final AccessManagementService accessManagementService;
  private final EmployeeService employeeService;
  private final AuthDataService authDataService;
  private final PasswordEncoder passwordEncoder;
  private final EmailVerificationService emailVerificationService;
  private final CaptchaService captchaService;

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

  /** 触发 captcha 挑战的累计失败阈值。达到或超过此值时下次登录必须带验证码。 */
  private static final int CAPTCHA_THRESHOLD = 3;

  /**
   * DEF-AUTH-02: 获取图形验证码。登录失败 ≥ 3 次后前端应调用此接口并在下一次 /auth/login 携带 captchaId + captchaAnswer。
   *
   * @return {captchaId, imageBase64}
   */
  @GetMapping("/captcha")
  public ResponseEntity<Map<String, String>> getCaptcha() {
    CaptchaService.Captcha captcha = captchaService.generate();
    return ResponseEntity.ok(
        Map.of("captchaId", captcha.captchaId(), "imageBase64", captcha.imageBase64()));
  }

  /**
   * 职责：处理用户密码登录请求，验证用户身份并返回 JWT 令牌
   *
   * <p>D-F-19: 登录失败阶梯锁定（per-IP + per-account 双层）
   *
   * <p>DEF-AUTH-02: 失败 ≥ 3 次后必须通过图形验证码
   */
  @PostMapping("/login")
  public ResponseEntity<?> login(
      @Valid @RequestBody AuthPasswordLoginRequest request, HttpServletRequest httpRequest) {
    String clientIp = httpRequest.getRemoteAddr();
    String username = request.username();

    // 检查 IP 或账号是否处于锁定期（任一被锁即拒绝）
    LoginFailState ipState = loginFailStates.get(clientIp);
    LoginFailState userState = username == null ? null : loginFailStatesByUsername.get(username);
    LoginFailState lockingState = null;
    if (ipState != null && ipState.isLocked()) lockingState = ipState;
    if (userState != null && userState.isLocked()) {
      if (lockingState == null
          || userState.remainingLockSeconds() > lockingState.remainingLockSeconds()) {
        lockingState = userState;
      }
    }
    if (lockingState != null) {
      int remainingMinutes = (int) Math.ceil(lockingState.remainingLockSeconds() / 60.0);
      Map<String, Object> body = new LinkedHashMap<>();
      body.put("code", 429);
      body.put("message", "登录尝试过于频繁，请" + remainingMinutes + "分钟后重试。若忘记密码请通过邮箱验证重置密码，可立即解除锁定。");
      body.put("selfServiceUnlock", "/me/forgot-password");
      return ResponseEntity.status(429).body(body);
    }

    // DEF-AUTH-02: 失败 ≥ CAPTCHA_THRESHOLD 次后，下一次登录必须通过图形验证码
    int prevFailCount =
        Math.max(
            ipState == null ? 0 : ipState.failCount(),
            userState == null ? 0 : userState.failCount());
    if (prevFailCount >= CAPTCHA_THRESHOLD) {
      if (!captchaService.verify(request.captchaId(), request.captchaAnswer())) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", 400);
        body.put("message", "请先通过图形验证码");
        body.put("captchaRequired", true);
        return ResponseEntity.badRequest().body(body);
      }
    }

    Optional<Employee> employeeOpt = employeeService.authenticate(username, request.password());

    if (employeeOpt.isEmpty()) {
      // 登录失败：IP + 账号双维度累计失败次数，按阶梯触发锁定
      final int threshold = loginFailThreshold;
      LoginFailState newIpState =
          loginFailStates.compute(
              clientIp,
              (ip, existing) -> {
                if (existing == null) existing = new LoginFailState();
                return existing.recordFailure(threshold);
              });
      LoginFailState newUserState = null;
      if (username != null) {
        newUserState =
            loginFailStatesByUsername.compute(
                username,
                (u, existing) -> {
                  if (existing == null) existing = new LoginFailState();
                  return existing.recordFailure(threshold);
                });
      }

      int ipLockMinutes = resolveLockMinutes(newIpState.failCount(), threshold);
      int userLockMinutes =
          newUserState == null ? 0 : resolveLockMinutes(newUserState.failCount(), threshold);
      int lockMinutes = Math.max(ipLockMinutes, userLockMinutes);
      if (lockMinutes > 0) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", 429);
        body.put("message", "登录尝试过于频繁，请" + lockMinutes + "分钟后重试。若忘记密码请通过邮箱验证重置密码，可立即解除锁定。");
        body.put("selfServiceUnlock", "/me/forgot-password");
        return ResponseEntity.status(429).body(body);
      }
      // DEF-AUTH-02: 未锁定但失败次数达到 captcha 阈值，告知前端下次须带验证码
      int newFailCount =
          Math.max(newIpState.failCount(), newUserState == null ? 0 : newUserState.failCount());
      if (newFailCount >= CAPTCHA_THRESHOLD) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", 401);
        body.put("message", "账号或密码错误");
        body.put("captchaRequired", true);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
      }
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "账号或密码错误");
    }

    // 登录成功：清除该 IP 与账号的失败记录
    loginFailStates.remove(clientIp);
    if (username != null) loginFailStatesByUsername.remove(username);

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

  /**
   * 首次登录设置密码。
   *
   * <p>仅限 isDefaultPassword=true 的已认证用户使用；不要求验证码，因为身份认证由 step 1（绑定邮箱+验证码）完成，step 2 不需要重复验证。
   *
   * <p>调用者：前端 /setup-account 页 step 2 "设置密码"。普通密码修改走 /auth/password/verify-reset。
   *
   * @param request 新密码（同 D-F-17 强度规则）
   * @return 204
   * @throws ResponseStatusException 用户未使用默认密码（非首次登录）→ 400；未绑定邮箱 → 400
   */
  @PostMapping("/password/first-login-set")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> firstLoginSetPassword(
      @RequestHeader(value = "Authorization", required = false) String authorization,
      @Valid @RequestBody FirstLoginSetPasswordRequest request) {
    Long userId = getCurrentUserId(authorization);
    if (userId == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "无法获取当前用户信息");
    }
    Employee employee =
        employeeService
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户不存在"));
    if (Boolean.FALSE.equals(employee.getIsDefaultPassword())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "当前账号非首次登录状态，请通过密码修改流程");
    }
    if (employee.getEmail() == null || employee.getEmail().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请先绑定邮箱");
    }
    String newPasswordHash = passwordEncoder.encode(request.newPassword());
    employeeService.updatePassword(employee.getId(), newPasswordHash, false);
    return ResponseEntity.noContent().build();
  }

  /** 首次登录设置密码请求体。 */
  public record FirstLoginSetPasswordRequest(
      @NotBlank(message = "新密码不能为空")
          @Pattern(
              regexp = "^(?=.*[A-Za-z])(?=.*\\d)[^\\s]{8,64}$",
              message = "密码须为8-64位，同时包含字母和数字，不允许空格")
          String newPassword) {}

  /**
   * 已登录用户主动修改密码（DESIGN.md §头像菜单 修改密码）。
   *
   * <p>与首次登录设置密码不同：此端点要求提供原密码并校验，适用于运营期密码轮换。
   *
   * @param authorization Authorization 请求头（JWT）
   * @param request 包含原密码 + 新密码
   * @return 204 No Content 表示修改成功
   * @throws ResponseStatusException 401（无法解析当前用户）/ 400（用户不存在 / 原密码错误）
   */
  @PostMapping("/change-password")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> changePassword(
      @RequestHeader(value = "Authorization", required = false) String authorization,
      @Valid @RequestBody ChangePasswordRequest request) {
    Long userId = getCurrentUserId(authorization);
    if (userId == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "无法获取当前用户信息");
    }
    Employee employee =
        employeeService
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户不存在"));
    if (!passwordEncoder.matches(request.currentPassword(), employee.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "原密码错误");
    }
    String newPasswordHash = passwordEncoder.encode(request.newPassword());
    employeeService.updatePassword(employee.getId(), newPasswordHash, false);
    return ResponseEntity.noContent().build();
  }

  /**
   * 已登录用户修改密码请求体。
   *
   * <p>newPassword 长度规则：6–64 位且不允许空格。比 first-login 的 8 位含字母数字要求更宽， 与现有种子密码（"123456"）和 C-INT-07
   * 测试 PW-03 用例（"新密码少于 6 位返回 400"）保持一致。 头像菜单的运营期密码修改与首次登录强密码门槛是不同场景，不强制套用同一规则。
   */
  public record ChangePasswordRequest(
      @NotBlank(message = "原密码不能为空") String currentPassword,
      @NotBlank(message = "新密码不能为空")
          @Pattern(
              regexp = "^[^\\s]{6,64}$",
              message = "新密码长度需为 6-64 位，且不允许空格")
          String newPassword) {}

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
