package com.oa.backend.controller;

import com.oa.backend.annotation.OperationLogRecord;
import com.oa.backend.security.SecurityUtils;
import com.oa.backend.service.SignatureService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 电子签名控制器，处理签名绑定与状态查询。
 *
 * <p>路由概览：
 *
 * <ul>
 *   <li>POST /signature/bind - 绑定电子签名（EMPLOYEE/WORKER）
 *   <li>GET /signature/status - 查询签名绑定状态（EMPLOYEE/WORKER）
 * </ul>
 *
 * @author OA Backend Team
 * @since 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/signature")
@RequiredArgsConstructor
public class SignatureController {

  private final SignatureService signatureService;

  /**
   * 绑定电子签名。
   *
   * <p>请求体：
   *
   * <pre>
   * {
   *   "signatureImage": "data:image/png;base64,iVBORw0...",
   *   "pin": "123456",
   *   "confirmPin": "123456"
   * }
   * </pre>
   *
   * @param request 绑定请求
   * @param authentication 当前用户认证信息
   * @return 200 OK 成功，400 Bad Request 失败
   */
  @PostMapping("/bind")
  @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER')")
  @OperationLogRecord(action = "BIND_SIGNATURE", targetType = "SIGNATURE")
  public ResponseEntity<?> bindSignature(
      @RequestBody BindSignatureRequest request, Authentication authentication) {
    // 获取当前员工 ID
    Long employeeId = SecurityUtils.getCurrentEmployeeId(authentication);
    if (employeeId == null) {
      return ResponseEntity.status(403).body(Map.of("message", "无法识别当前用户"));
    }

    // 参数校验
    if (request.signatureImage() == null || request.signatureImage().isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("message", "签名图片不能为空"));
    }

    if (request.pin() == null || request.pin().isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("message", "PIN 码不能为空"));
    }

    if (request.confirmPin() == null || !request.pin().equals(request.confirmPin())) {
      return ResponseEntity.badRequest().body(Map.of("message", "两次输入的 PIN 码不一致"));
    }

    // PIN 码长度校验
    if (request.pin().length() < 4 || request.pin().length() > 6) {
      return ResponseEntity.badRequest().body(Map.of("message", "PIN 码长度必须为 4-6 位"));
    }

    // IllegalArgumentException 和其它未知异常均由 GlobalExceptionHandler 统一处理
    // （400 参数不合法 / 500 服务器内部错误）。
    signatureService.bindSignature(employeeId, request.signatureImage(), request.pin());
    return ResponseEntity.ok(Map.of("message", "签名绑定成功"));
  }

  /**
   * 查询签名绑定状态。
   *
   * @param authentication 当前用户认证信息
   * @return { "bound": true/false }
   */
  @GetMapping("/status")
  @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER')")
  public ResponseEntity<?> getSignatureStatus(Authentication authentication) {
    Long employeeId = SecurityUtils.getCurrentEmployeeId(authentication);
    if (employeeId == null) {
      return ResponseEntity.status(403).body(Map.of("message", "无法识别当前用户"));
    }

    boolean bound = signatureService.isBound(employeeId);
    return ResponseEntity.ok(Map.of("bound", bound));
  }

  /**
   * 绑定签名请求体。
   *
   * @param signatureImage Base64 编码的签名图片
   * @param pin PIN 码（4-6 位数字）
   * @param confirmPin 确认 PIN 码
   */
  public record BindSignatureRequest(String signatureImage, String pin, String confirmPin) {}
}
