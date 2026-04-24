package com.oa.backend.controller;

import com.oa.backend.filter.GlobalRateLimitFilter;
import com.oa.backend.service.CaptchaService;
import com.oa.backend.service.EmailVerificationService;
import com.oa.backend.service.SetupService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 开发环境专用控制器。 提供开发调试用的辅助接口，仅在 'dev' 配置文件激活时加载。
 *
 * <p><strong>警告：</strong>此控制器包含危险操作（如重置业务数据）， 绝对禁止在生产环境使用。{@code @Profile("dev")} 确保仅在 dev profile
 * 下加载， 生产环境此路由物理不存在。
 *
 * <p>可用端点：
 *
 * <ul>
 *   <li>POST /dev/reset - 截断全部业务/事务表，保留账号/角色/参照数据（E2E 测试用）
 *   <li>POST /dev/reset-setup - 重置系统初始化状态（允许重新执行初始化向导）
 *   <li>POST /dev/skip-setup - 标记系统为已初始化（跳过向导直接进入登录）
 * </ul>
 */
@Slf4j
@Profile("dev")
@RestController
@RequestMapping("/dev")
@RequiredArgsConstructor
public class DevController {

  private final SetupService setupService;
  private final JdbcTemplate jdbcTemplate;
  private final EmailVerificationService emailVerificationService;
  private final AuthController authController;
  private final GlobalRateLimitFilter globalRateLimitFilter;
  private final CaptchaService captchaService;

  /**
   * E2E 测试数据重置。
   *
   * <p>截断全部业务/事务表，保留参照数据（账号、角色、部门、项目、审批流定义等）。 每个 E2E spec 文件执行前调用，确保测试从干净状态启动。
   *
   * <p>保留表：sys_user、sys_role、employee、department、project、project_member、
   * approval_flow_def、approval_flow_node、payroll_item_def、salary_grade、
   * leave_type_def、form_type_def、retention_policy、system_config、
   * allowance_def、second_role_def、after_sale_type_def、work_item_template 等。
   *
   * @return 操作结果消息
   */
  @PostMapping("/reset")
  public ResponseEntity<Map<String, String>> resetForE2E() {
    log.warn("[DEV] E2E data reset triggered — truncating all business tables");

    // PostgreSQL: truncate all business tables in one statement; CASCADE resolves FK order
    // automatically.
    String tableList = String.join(", ", BUSINESS_TABLES);
    jdbcTemplate.execute("TRUNCATE TABLE " + tableList + " CASCADE");
    // Remove setup-wizard-created accounts (CEO001/HR001/SYS_ADMIN001/GM001) and
    // any test-created employees (auto-increment starts at 100, seeds are 1–8)
    jdbcTemplate.execute(
        "DELETE FROM employee WHERE employee_no IN ('CEO001','HR001','SYS_ADMIN001','GM001') OR id >= 100");
    // Restore seed employee statuses — E2E-06 disables an employee; reset must undo that
    jdbcTemplate.execute("UPDATE employee SET account_status = 'ACTIVE' WHERE id < 100");

    log.info("[DEV] E2E data reset completed");
    return ResponseEntity.ok(Map.of("message", "reset ok"));
  }

  /**
   * Business tables to truncate on E2E reset. Reference/config tables are intentionally excluded.
   */
  private static final String[] BUSINESS_TABLES = {
    "form_record",
    "approval_record",
    "overtime_notification",
    "overtime_response",
    "construction_attendance",
    "project_milestone",
    "project_progress_log",
    "construction_log_summary",
    "project_insurance_def",
    "payroll_cycle",
    "payroll_slip",
    "payroll_slip_item",
    "payroll_adjustment",
    "payroll_confirmation",
    "payroll_bonus",
    "employee_signature",
    "salary_confirmation_agreement",
    "evidence_chain",
    "injury_claim",
    "attachment_meta",
    "operation_log",
    "notification",
    "retention_reminder",
    "cleanup_task",
    "export_backup_task",
    "second_role_assignment",
    "after_sale_ticket",
    "project_material_cost",
    "expense_claim",
    "expense_item",
    "emergency_contact"
  };

  /**
   * 重置系统初始化状态。 将 system_config 中的 'initialized' 设置为 false，允许重新执行初始化向导。
   *
   * <p><strong>注意：</strong>此操作不会删除已创建的账户数据，仅重置初始化标记。
   *
   * @return 操作结果消息
   */
  @PostMapping("/reset-setup")
  public ResponseEntity<Map<String, String>> resetSetup() {
    setupService.resetForDev();
    return ResponseEntity.ok(Map.of("message", "reset ok"));
  }

  /**
   * Marks the system as initialized for development environment. Used when working with pre-seeded
   * dev data without running the setup wizard.
   *
   * @return operation result message
   */
  @PostMapping("/skip-setup")
  public ResponseEntity<Map<String, String>> skipSetup() {
    setupService.markInitializedForDev();
    return ResponseEntity.ok(Map.of("message", "marked as initialized"));
  }

  /**
   * 清空全部限流计数（登录失败阶梯锁定 + 全局 IP 限流）。
   *
   * <p>用于 E2E 测试场景：每个非限流专项测试开头调用一次，确保冷却不影响后续测试； 限流专项测试不调用此接口，按生产阈值真实触发 429。
   *
   * @return 操作结果消息
   */
  @PostMapping("/reset-rate-limit")
  public ResponseEntity<Map<String, String>> resetRateLimit() {
    authController.resetAllLoginFailStates();
    globalRateLimitFilter.resetAll();
    log.info("[DEV] Rate limit counters cleared (login fail + global IP)");
    return ResponseEntity.ok(Map.of("message", "rate limit reset ok"));
  }

  /**
   * Returns the live verification code from the in-memory cache for the given email.
   *
   * <p>Used by E2E tests instead of IMAP polling — avoids dependency on QQ Mail delivery speed. The
   * code is the same one that would be sent via email; this endpoint just reads it from the
   * Caffeine cache before it expires (5-minute TTL).
   *
   * @param type "bind" (email-bind flow) or "pwd" (password-reset flow)
   * @param email the target email address
   * @return 200 + {"code":"123456"} if a live code exists; 404 if not found or expired
   */
  @GetMapping("/verification-code")
  public ResponseEntity<Map<String, String>> getVerificationCode(
      @RequestParam String type, @RequestParam String email) {
    String code = emailVerificationService.getCachedCode(type, email);
    if (code == null) {
      return ResponseEntity.notFound().build();
    }
    log.info("[DEV] Returning cached verification code for type={} email={}", type, email);
    return ResponseEntity.ok(Map.of("code", code));
  }

  /**
   * Returns the expected answer for a live captcha from the in-memory cache.
   *
   * <p>Used by E2E tests to solve the image-based captcha without OCR. The captcha image is
   * rendered server-side with AWT (BufferedImage) and cannot be decoded by automated test code;
   * this endpoint exposes the cached answer so tests can submit a valid captcha to exercise the
   * login rate-limit lockout flow (per-IP + per-account) which requires clearing the captcha
   * challenge on every attempt after failure count ≥ 3.
   *
   * <p>The captcha answer is consumed on first successful /auth/login verify, so tests must call
   * this endpoint after each captcha generation and before submitting the login request. The
   * endpoint is dev-profile-only and does not leak captcha data in production.
   *
   * @param captchaId the id returned by GET /auth/captcha
   * @return 200 + {"answer":"1234"} if a live captcha exists; 404 if not found or expired
   */
  @GetMapping("/captcha-answer")
  public ResponseEntity<Map<String, String>> getCaptchaAnswer(@RequestParam String captchaId) {
    String answer = captchaService.peekAnswer(captchaId);
    if (answer == null) {
      return ResponseEntity.notFound().build();
    }
    log.info("[DEV] Returning cached captcha answer for captchaId={}", captchaId);
    return ResponseEntity.ok(Map.of("answer", answer));
  }
}
