package com.oa.backend.controller;

import com.oa.backend.dto.ResetPasswordRequest;
import com.oa.backend.dto.SendResetCodeRequest;
import com.oa.backend.dto.VerifyResetCodeRequest;
import com.oa.backend.dto.VerifyResetCodeResponse;
import com.oa.backend.entity.Employee;
import com.oa.backend.security.ResetCodeStore;
import com.oa.backend.service.EmailVerificationService;
import com.oa.backend.service.EmployeeService;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * 忘记密码控制器（无需登录）。
 *
 * <p>采用邮箱链路：用户输入绑定邮箱 → 后端通过 EmailVerificationService 发 "pwd:" 验证码 → 用户填码换 resetToken → 凭 resetToken
 * 提交新密码完成重置。
 *
 * <p>三步流程：
 *
 * <ol>
 *   <li>POST /auth/send-reset-code : {"email":"xxx"} → 发码到该邮箱
 *   <li>POST /auth/verify-reset-code : {"email":"xxx","code":"123456"} → 换 resetToken
 *   <li>POST /auth/reset-password : {"resetToken":"xxx","newPassword":"yyy"} → 完成重置
 * </ol>
 *
 * <p>DEF-AUTH-03 自助解锁：重置成功后调用 AuthController.resetLoginFailStatesForUsername 立即解除该账号的登录锁定。
 *
 * <p>为避免邮箱枚举，步骤 1 对「邮箱不存在」和「邮箱存在但发送失败」同样返回 200；实际发码只在邮箱存在时进行。
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class PasswordResetController {

  private final EmployeeService employeeService;
  private final EmailVerificationService emailVerificationService;
  private final ResetCodeStore resetCodeStore;
  private final PasswordEncoder passwordEncoder;
  private final AuthController authController;

  /** 职责：向绑定邮箱发送密码重置验证码（6 位数字，5 分钟 TTL，Caffeine 缓存）。 邮箱不存在时仍返回 200，避免邮箱枚举。 */
  @PostMapping("/send-reset-code")
  public ResponseEntity<Map<String, String>> sendResetCode(
      @Valid @RequestBody SendResetCodeRequest request) {
    Optional<Employee> employeeOpt = employeeService.findByEmail(request.email());
    if (employeeOpt.isPresent()) {
      // sendPasswordResetCode 已校验 email 非空并写 Caffeine 缓存 + 发邮件；失败时抛 IllegalStateException
      emailVerificationService.sendPasswordResetCode(employeeOpt.get());
    } else {
      log.info("send-reset-code requested for unknown email (not disclosing)");
    }
    return ResponseEntity.ok(Map.of("message", "若邮箱存在，验证码已发送"));
  }

  /** 职责：验证邮箱+验证码，通过后签发 resetToken。验证码消费后立即失效（EmailVerificationService.verifyPasswordResetCode）。 */
  @PostMapping("/verify-reset-code")
  public ResponseEntity<VerifyResetCodeResponse> verifyResetCode(
      @Valid @RequestBody VerifyResetCodeRequest request) {
    Employee employee =
        employeeService
            .findByEmail(request.email())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "验证码不正确或已过期"));
    try {
      emailVerificationService.verifyPasswordResetCode(
          employee.getId(), request.email(), request.code());
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "验证码不正确或已过期");
    }
    // 复用 ResetCodeStore 的 token 分发与校验能力；key 使用邮箱以便第三步查回员工
    String token = resetCodeStore.createToken(request.email());
    return ResponseEntity.ok(new VerifyResetCodeResponse(token));
  }

  /** 职责：凭 resetToken 重置密码并立即解除该账号的登录失败锁定（DEF-AUTH-03 自助解锁）。 */
  @PostMapping("/reset-password")
  public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
    String email = resetCodeStore.verifyToken(request.resetToken());
    if (email == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "重置令牌无效或已过期");
    }
    Employee employee =
        employeeService
            .findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户不存在"));

    String newPasswordHash = passwordEncoder.encode(request.newPassword());
    employeeService.updatePassword(employee.getId(), newPasswordHash, false);
    resetCodeStore.removeToken(request.resetToken());

    // DEF-AUTH-03: 立即清零该账号的登录失败计数，无需等锁超时
    authController.resetLoginFailStatesForUsername(employee.getEmployeeNo());

    log.info("Password reset successful via email for employee: {}", employee.getEmployeeNo());
    return ResponseEntity.noContent().build();
  }
}
