package com.oa.backend.controller;

import com.oa.backend.exception.BusinessException;
import com.oa.backend.service.SetupService;
import com.oa.backend.service.SetupService.SetupRequest;
import com.oa.backend.service.SetupService.SetupResult;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * 系统初始化控制器。 负责系统初始化状态查询、初始化向导、CEO 密码重置等相关接口。
 *
 * <p>安全策略：
 *
 * <ul>
 *   <li>/setup/status - 公开端点，无需认证
 *   <li>/setup/init - 公开端点，但系统初始化后返回 403
 *   <li>/setup/reset-ceo-password - 公开端点，需要有效的恢复码
 *   <li>其他 POST /setup/** - 系统初始化后返回 403
 * </ul>
 */
@Slf4j
@RestController
@RequestMapping("/setup")
@RequiredArgsConstructor
public class SetupController {

  private final SetupService setupService;

  /**
   * 获取系统初始化状态。 公开端点，无需认证。用于前端判断是否需要跳转到初始化向导页面。
   *
   * @return 初始化状态信息，包含 initialized 标志和提示消息
   */
  @GetMapping("/status")
  public ResponseEntity<Map<String, Object>> status() {
    boolean initialized = setupService.isInitialized();
    String companyName = setupService.getCompanyName();
    String message = initialized ? "系统已初始化" : "系统待初始化，请完成初始化向导";
    // Use HashMap to allow null values (Map.of rejects null)
    java.util.Map<String, Object> body = new java.util.HashMap<>();
    body.put("initialized", initialized);
    body.put("companyName", companyName);
    body.put("message", message);
    return ResponseEntity.ok(body);
  }

  /**
   * 初始化系统。 公开端点，但仅在系统未初始化时可调用。创建 CEO、HR 等初始账户。
   *
   * <p>请求体字段：
   *
   * <ul>
   *   <li>ceoName - CEO 姓名（必填）
   *   <li>ceoPhone - CEO 手机号（必填）
   *   <li>ceoPassword - CEO 密码（必填，至少 8 位）
   *   <li>hrName - HR 姓名（必填）
   *   <li>hrPhone - HR 手机号（必填）
   *   <li>opsName - 运营总监姓名（可选）
   *   <li>opsPhone - 运营总监手机号（可选）
   *   <li>gmName - 总经理姓名（可选）
   *   <li>gmPhone - 总经理手机号（可选）
   * </ul>
   *
   * @param request 初始化请求
   * @return 初始化结果，包含 recoveryCode（仅返回一次，请妥善保存）
   * @throws ResponseStatusException 如果系统已初始化（403）或请求无效（400）
   */
  @PostMapping("/init")
  public ResponseEntity<?> initialize(@Valid @RequestBody SetupInitRequest request) {
    // 检查系统是否已初始化
    if (setupService.isInitialized()) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "系统已初始化，不能重复执行");
    }

    try {
      SetupResult result = setupService.initialize(toServiceRequest(request));
      return ResponseEntity.ok(
          Map.of(
              "recoveryCode", result.recoveryCode(),
              "message", result.message()));
    } catch (IllegalStateException e) {
      // 初始化冲突（如已存在同名账户）→ 409
      // IllegalArgumentException 交由 GlobalExceptionHandler 统一 400
      throw new BusinessException(HttpStatus.CONFLICT.value(), e.getMessage());
    }
  }

  /**
   * 使用恢复码重置 CEO 密码。 公开端点，无需认证。验证恢复码后重置密码并轮换恢复码。
   *
   * @param request 重置请求，包含 recoveryCode 和 newPassword
   * @return 新的恢复码（明文，仅返回一次）
   * @throws ResponseStatusException 如果恢复码无效或请求格式错误
   */
  @PostMapping("/reset-ceo-password")
  public ResponseEntity<?> resetCeoPassword(@Valid @RequestBody ResetCeoPasswordRequest request) {
    // IllegalArgumentException（恢复码无效）→ GlobalExceptionHandler 统一 400
    // IllegalStateException（系统未初始化 / 状态不允许）属于 client 错误，在此转 BusinessException(400)
    // 保留原始 message（如 "系统未初始化"），避免 fallback 500 丢失业务语义
    try {
      String newRecoveryCode =
          setupService.resetCeoPassword(request.recoveryCode(), request.newPassword());
      return ResponseEntity.ok(Map.of("recoveryCode", newRecoveryCode, "message", "密码重置成功"));
    } catch (IllegalStateException e) {
      throw new BusinessException(400, e.getMessage() != null ? e.getMessage() : "系统状态不允许此操作");
    }
  }

  // ==================== Private Helpers ====================

  private SetupRequest toServiceRequest(SetupInitRequest req) {
    return new SetupRequest(
        req.companyName(),
        req.ceoName(),
        req.ceoPhone(),
        req.ceoPassword(),
        req.hrName(),
        req.hrPhone(),
        req.opsName(),
        req.opsPhone(),
        req.gmName(),
        req.gmPhone(),
        null // customRoles 暂不通过此接口支持
        );
  }

  // ==================== Inner Request Records ====================

  /** 系统初始化请求。 */
  public record SetupInitRequest(
      String companyName, // 企业名称（可选）
      @NotBlank(message = "CEO 姓名不能为空") String ceoName,
      @NotBlank(message = "CEO 手机号不能为空") String ceoPhone,
      @NotBlank(message = "CEO 密码不能为空")
          @Pattern(
              regexp = "^(?=.*[A-Za-z])(?=.*\\d)[^\\s]{8,64}$",
              message = "密码须为8-64位，同时包含字母和数字，不允许空格")
          String ceoPassword,
      @NotBlank(message = "HR 姓名不能为空") String hrName,
      @NotBlank(message = "HR 手机号不能为空") String hrPhone,
      String opsName,
      String opsPhone,
      String gmName,
      String gmPhone) {}

  /** CEO 密码重置请求。 */
  public record ResetCeoPasswordRequest(
      @NotBlank(message = "恢复码不能为空") String recoveryCode,
      @NotBlank(message = "新密码不能为空")
          @Pattern(
              regexp = "^(?=.*[A-Za-z])(?=.*\\d)[^\\s]{8,64}$",
              message = "密码须为8-64位，同时包含字母和数字，不允许空格")
          String newPassword) {}
}
