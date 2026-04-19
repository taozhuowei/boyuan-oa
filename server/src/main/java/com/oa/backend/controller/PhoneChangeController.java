package com.oa.backend.controller;

import com.oa.backend.entity.Employee;
import com.oa.backend.security.JwtTokenService;
import com.oa.backend.service.EmployeeService;
import com.oa.backend.service.PhoneChangeService;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
 * 手机号变更控制器 负责处理已登录用户修改绑定手机号的完整四步流程： 1. 发送验证码到当前手机号，验证旧号码所有权 (/auth/phone-change/send-current-code)
 * 2. 验证当前手机号验证码，签发 changeToken (/auth/phone-change/verify-current-code) 3. 发送验证码到新手机号，验证新号码持有
 * (/auth/phone-change/send-new-code) 4. 提交新号码和验证码，完成绑定变更 (/auth/phone-change/confirm)
 * 所有端点均要求登录认证（@PreAuthorize("isAuthenticated()")）。 业务状态（验证码、changeToken）由 PhoneChangeService
 * 持有，本类仅做 HTTP 分发与参数校验。 从 AuthController 拆分，遵守单一职责原则。
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class PhoneChangeController {

  private final JwtTokenService jwtTokenService;
  private final EmployeeService employeeService;
  private final PhoneChangeService phoneChangeService;

  private final SecureRandom secureRandom = new SecureRandom();

  /** 职责：发送当前手机号的变更验证码 请求含义：向当前登录用户的绑定手机号发送验证码 响应含义：返回发送成功消息 权限期望：已认证用户 */
  @PostMapping("/phone-change/send-current-code")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Map<String, String>> sendCurrentPhoneCode(
      @RequestHeader("Authorization") String authorization) {
    Long userId = getCurrentUserId(authorization);
    if (userId == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "无法获取当前用户信息");
    }
    Employee employee =
        employeeService
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户不存在"));
    if (employee.getPhone() == null || employee.getPhone().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "当前用户未绑定手机号");
    }
    String code = String.format("%06d", secureRandom.nextInt(1000000));
    phoneChangeService.putCurrentCode(
        "phone-change-current:" + userId, code, LocalDateTime.now().plusMinutes(5));
    log.debug("SMS code generated for phone={}", maskPhone(employee.getPhone()));
    return ResponseEntity.ok(Map.of("message", "验证码已发送"));
  }

  /** 职责：验证当前手机号的变更验证码 请求含义：提交验证码验证当前手机号所有权 响应含义：验证成功后返回 changeToken 权限期望：已认证用户 */
  @PostMapping("/phone-change/verify-current-code")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Map<String, String>> verifyCurrentPhoneCode(
      @RequestHeader("Authorization") String authorization,
      @RequestBody Map<String, String> request) {
    Long userId = getCurrentUserId(authorization);
    if (userId == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "无法获取当前用户信息");
    }
    String code = request.get("code");
    if (code == null || code.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "验证码不能为空");
    }
    String key = "phone-change-current:" + userId;
    PhoneChangeService.PhoneChangeCodeEntry entry = phoneChangeService.getCurrentCode(key);
    if (entry == null || entry.isExpired() || !entry.code().equals(code)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "验证码不正确或已过期");
    }
    phoneChangeService.removeCurrentCode(key);

    String token = UUID.randomUUID().toString();
    phoneChangeService.putToken(
        "phone-change-token:" + token, userId, LocalDateTime.now().plusMinutes(10));
    return ResponseEntity.ok(Map.of("changeToken", token));
  }

  /** 职责：发送新手机号的变更验证码 请求含义：使用 changeToken 向新手机号发送验证码 响应含义：返回发送成功消息 权限期望：已认证用户 */
  @PostMapping("/phone-change/send-new-code")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Map<String, String>> sendNewPhoneCode(
      @RequestBody Map<String, String> request) {
    String changeToken = request.get("changeToken");
    String newPhone = request.get("newPhone");
    if (changeToken == null || changeToken.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "changeToken 不能为空");
    }
    if (newPhone == null || newPhone.isBlank() || !newPhone.matches("^1[3-9]\\d{9}$")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "手机号格式不正确");
    }

    String tokenKey = "phone-change-token:" + changeToken;
    PhoneChangeService.PhoneChangeTokenEntry tokenEntry = phoneChangeService.getToken(tokenKey);
    if (tokenEntry == null || tokenEntry.isExpired()) {
      phoneChangeService.removeToken(tokenKey);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "changeToken 无效或已过期");
    }
    Long userId = tokenEntry.userId();

    String code = String.format("%06d", secureRandom.nextInt(1000000));
    phoneChangeService.putNewCode(
        "phone-change-new:" + userId, code, LocalDateTime.now().plusMinutes(5));
    log.debug("SMS code generated for phone={}", maskPhone(newPhone));
    return ResponseEntity.ok(Map.of("message", "验证码已发送"));
  }

  /** 职责：确认手机号变更 请求含义：提交 changeToken、新手机号和验证码完成变更 响应含义：返回变更成功消息 权限期望：已认证用户 */
  @PostMapping("/phone-change/confirm")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Map<String, String>> confirmPhoneChange(
      @RequestBody Map<String, String> request) {
    String changeToken = request.get("changeToken");
    String newPhone = request.get("newPhone");
    String code = request.get("code");
    if (changeToken == null || changeToken.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "changeToken 不能为空");
    }
    if (newPhone == null || newPhone.isBlank() || !newPhone.matches("^1[3-9]\\d{9}$")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "手机号格式不正确");
    }
    if (code == null || code.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "验证码不能为空");
    }

    String tokenKey = "phone-change-token:" + changeToken;
    PhoneChangeService.PhoneChangeTokenEntry tokenEntry = phoneChangeService.getToken(tokenKey);
    if (tokenEntry == null || tokenEntry.isExpired()) {
      phoneChangeService.removeToken(tokenKey);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "changeToken 无效或已过期");
    }
    Long userId = tokenEntry.userId();

    String codeKey = "phone-change-new:" + userId;
    PhoneChangeService.PhoneChangeCodeEntry codeEntry = phoneChangeService.getNewCode(codeKey);
    if (codeEntry == null || codeEntry.isExpired() || !codeEntry.code().equals(code)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "验证码不正确或已过期");
    }

    employeeService.updatePhone(userId, newPhone);

    // 失效该用户的所有变更令牌和验证码
    phoneChangeService.removeTokenByUserId(userId);
    phoneChangeService.removeCurrentCode("phone-change-current:" + userId);
    phoneChangeService.removeNewCode(codeKey);

    return ResponseEntity.ok(Map.of("message", "手机号修改成功"));
  }

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
