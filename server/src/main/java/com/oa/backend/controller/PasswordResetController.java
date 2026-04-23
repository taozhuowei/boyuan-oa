package com.oa.backend.controller;

import com.oa.backend.dto.ResetPasswordRequest;
import com.oa.backend.dto.SendResetCodeRequest;
import com.oa.backend.dto.VerifyResetCodeRequest;
import com.oa.backend.dto.VerifyResetCodeResponse;
import com.oa.backend.entity.Employee;
import com.oa.backend.security.ResetCodeStore;
import com.oa.backend.service.EmployeeService;
import jakarta.validation.Valid;
import java.security.SecureRandom;
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
 * 密码重置控制器 负责处理忘记密码场景的完整三步流程： 1. 发送验证码到手机号 (/auth/send-reset-code) 2. 验证验证码并签发 resetToken
 * (/auth/verify-reset-code) 3. 凭 resetToken 提交新密码完成重置 (/auth/reset-password) 所有端点均无需登录认证，通过
 * resetToken 机制保证操作安全性。 从 AuthController 拆分，遵守单一职责原则。
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class PasswordResetController {

  private final EmployeeService employeeService;
  private final ResetCodeStore resetCodeStore;
  private final PasswordEncoder passwordEncoder;
  private final AuthController authController;

  private final SecureRandom secureRandom = new SecureRandom();

  /**
   * 职责：发送密码重置验证码到用户手机 请求含义：提交手机号请求发送验证码（开发阶段仅打印日志） 响应含义：返回发送成功消息（无论手机号是否存在，都返回成功，避免暴露用户信息）
   * 权限期望：无需认证
   */
  @PostMapping("/send-reset-code")
  public ResponseEntity<Map<String, String>> sendResetCode(
      @Valid @RequestBody SendResetCodeRequest request) {
    // 查找该手机号对应的员工（仅用于日志记录，不暴露是否存在）
    Optional<Employee> employeeOpt = employeeService.findByPhone(request.phone());

    if (employeeOpt.isPresent()) {
      // 生成6位随机验证码
      String code = String.format("%06d", secureRandom.nextInt(1000000));
      resetCodeStore.storeCode(request.phone(), code);
      log.debug("SMS code generated for phone={}", maskPhone(request.phone()));
    } else {
      // 手机号不存在，仍然返回成功，但记录日志用于调试
      log.debug("Send reset code requested for non-existent phone: {}", request.phone());
    }

    return ResponseEntity.ok(Map.of("message", "验证码已发送"));
  }

  /** 职责：验证重置验证码 请求含义：提交手机号和验证码进行验证 响应含义：验证成功后返回 resetToken，用于后续重置密码 权限期望：无需认证 */
  @PostMapping("/verify-reset-code")
  public ResponseEntity<VerifyResetCodeResponse> verifyResetCode(
      @Valid @RequestBody VerifyResetCodeRequest request) {
    // 验证验证码
    if (!resetCodeStore.verifyCode(request.phone(), request.code())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "验证码不正确或已过期");
    }

    // 删除已使用的验证码
    resetCodeStore.removeCode(request.phone());

    // 生成 resetToken
    String token = resetCodeStore.createToken(request.phone());

    return ResponseEntity.ok(new VerifyResetCodeResponse(token));
  }

  /**
   * 职责：使用 resetToken 重置密码 请求含义：提交 resetToken 和新密码进行密码重置 响应含义：重置成功返回 204 No Content 权限期望：无需认证（通过
   * resetToken 验证身份）
   */
  @PostMapping("/reset-password")
  public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
    // 验证 resetToken
    String phone = resetCodeStore.verifyToken(request.resetToken());
    if (phone == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "重置令牌无效或已过期");
    }

    // 查找员工
    Employee employee =
        employeeService
            .findByPhone(phone)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户不存在"));

    // 更新密码
    String newPasswordHash = passwordEncoder.encode(request.newPassword());
    employeeService.updatePassword(employee.getId(), newPasswordHash, false);

    // 删除已使用的 token
    resetCodeStore.removeToken(request.resetToken());

    // DEF-AUTH-03: 自助解锁 —— 密码重置成功后清零该账号的登录失败计数，立即解除锁定
    authController.resetLoginFailStatesForUsername(employee.getEmployeeNo());

    log.info("Password reset successfully for employee: {}", employee.getEmployeeNo());
    return ResponseEntity.noContent().build();
  }

  /**
   * 职责：对手机号进行脱敏处理用于日志输出 规则：保留前 3 位和后 4 位，中间用 **** 替代；长度不足 7 或 null 时返回 **** 原因：防止明文手机号写入日志造成个人信息泄露
   */
  private static String maskPhone(String phone) {
    if (phone == null || phone.length() < 7) {
      return "****";
    }
    return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
  }
}
