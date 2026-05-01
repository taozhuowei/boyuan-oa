package com.oa.backend.controller;

import com.oa.backend.entity.Employee;
import com.oa.backend.security.JwtTokenService;
import com.oa.backend.service.EmailVerificationService;
import com.oa.backend.service.EmployeeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * 邮箱绑定控制器（D-F-23）。
 *
 * <p>职责：提供邮箱绑定验证码发送和验证接口，用于首次登录强制绑定邮箱。 所有接口要求已认证（isAuthenticated()），通过 JWT token 解析当前员工 ID。
 */
@RestController
@RequestMapping("/auth/email")
@RequiredArgsConstructor
public class EmailController {

  private final EmailVerificationService emailVerificationService;
  private final EmployeeService employeeService;
  private final JwtTokenService jwtTokenService;
  private final Environment environment;

  /**
   * 发送邮箱绑定验证码。
   *
   * <p>请求体：{"email": "xxx@example.com"}
   *
   * <p>响应：204 No Content（发送成功）
   */
  @PostMapping("/send-bind-code")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<?> sendBindCode(
      @RequestHeader("Authorization") String authorization,
      @Valid @RequestBody SendBindCodeRequest request) {
    Long employeeId = resolveEmployeeId(authorization);
    String code = emailVerificationService.sendBindCode(employeeId, request.email());
    if (isDevProfile()) {
      return ResponseEntity.ok(Map.of("_devCode", code));
    }
    return ResponseEntity.noContent().build();
  }

  private boolean isDevProfile() {
    for (String p : environment.getActiveProfiles()) {
      if ("dev".equalsIgnoreCase(p)) return true;
    }
    return false;
  }

  /**
   * 验证邮箱绑定验证码并完成绑定。
   *
   * <p>请求体：{"email": "xxx@example.com", "code": "123456"}
   *
   * <p>响应：204 No Content（绑定成功）
   */
  @PostMapping("/verify-bind")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> verifyBind(
      @RequestHeader("Authorization") String authorization,
      @Valid @RequestBody VerifyBindRequest request) {
    Long employeeId = resolveEmployeeId(authorization);
    emailVerificationService.verifyAndBind(employeeId, request.email(), request.code());
    return ResponseEntity.noContent().build();
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private Long resolveEmployeeId(String authorization) {
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "无法获取当前用户信息");
    }
    String token = authorization.substring(7);
    Long userId =
        jwtTokenService
            .verify(token)
            .map(jwt -> jwt.getClaim("userId").asLong())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token 无效"));
    if (userId == null || userId == 0L) {
      // dev-login token 无 userId，不允许调用此接口
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "当前登录方式不支持邮箱绑定");
    }
    Employee employee =
        employeeService
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户不存在"));
    return employee.getId();
  }

  // ── Request records ─────────────────────────────────────────────────────

  /** 发送绑定验证码请求体。 */
  public record SendBindCodeRequest(
      @NotBlank(message = "邮箱不能为空") @Email(message = "邮箱格式不正确") String email) {}

  /** 验证绑定验证码请求体。 */
  public record VerifyBindRequest(
      @NotBlank(message = "邮箱不能为空") @Email(message = "邮箱格式不正确") String email,
      @NotBlank(message = "验证码不能为空") @Size(min = 6, max = 6, message = "验证码必须为6位") String code) {}
}
