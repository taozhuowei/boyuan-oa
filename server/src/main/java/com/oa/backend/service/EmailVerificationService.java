package com.oa.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.oa.backend.entity.Employee;
import com.oa.backend.mapper.EmployeeMapper;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 邮箱验证码服务（D-F-23 / D-F-16）。
 *
 * <p>职责：
 *
 * <ul>
 *   <li>发送绑定邮箱验证码（cache key 前缀 "bind:"）
 *   <li>验证并写入员工 email 字段（D-F-23）
 *   <li>发送密码重置验证码（cache key 前缀 "pwd:"）
 * </ul>
 *
 * <p>设计说明：
 *
 * <ul>
 *   <li>验证码 TTL=5分钟，Caffeine 本地缓存；重启清零可接受
 *   <li>若 MAIL_FROM 环境变量为空（开发环境），跳过实际发送，仅日志输出
 * </ul>
 */
@Slf4j
@Service
public class EmailVerificationService {

  private static final int CODE_LENGTH = 6;
  private static final SecureRandom RANDOM = new SecureRandom();

  /** 可选注入：MAIL_FROM 未配置时 spring-boot-starter-mail 不创建 JavaMailSender bean。 */
  @Autowired(required = false)
  private JavaMailSender mailSender;

  private final EmployeeMapper employeeMapper;
  private final Environment environment;

  @Value("${spring.mail.username:}")
  private String mailFrom;

  public EmailVerificationService(EmployeeMapper employeeMapper, Environment environment) {
    this.employeeMapper = employeeMapper;
    this.environment = environment;
  }

  /** 验证码缓存：key = "bind:{email}" 或 "pwd:{email}"，value = CodeEntry。 TTL=5分钟，到期自动失效。 */
  private final Cache<String, CodeEntry> codeCache =
      Caffeine.newBuilder().expireAfterWrite(5, TimeUnit.MINUTES).build();

  // ── Bind email (D-F-23) ──────────────────────────────────────────────────

  /**
   * 发送邮箱绑定验证码。
   *
   * @param employeeId 当前登录员工 ID
   * @param email 待绑定的邮箱
   * @throws IllegalArgumentException 若邮箱已被其他员工占用
   */
  public void sendBindCode(Long employeeId, String email) {
    // 检查邮箱是否已被其他员工占用
    Employee existing =
        employeeMapper.selectOne(
            new LambdaQueryWrapper<Employee>()
                .eq(Employee::getEmail, email)
                .eq(Employee::getDeleted, 0));
    if (existing != null && !existing.getId().equals(employeeId)) {
      throw new IllegalArgumentException("该邮箱已被其他账号占用");
    }

    String code = generateCode();
    codeCache.put("bind:" + email, new CodeEntry(code, employeeId));
    sendEmail(email, "【OA系统】邮箱绑定验证码", "您的邮箱绑定验证码为：" + code + "，5分钟内有效，请勿泄露。");
    log.info("Email bind code sent to {} for employee {}", email, employeeId);
  }

  /**
   * 验证绑定验证码并写入 employee.email。
   *
   * @param employeeId 当前登录员工 ID
   * @param email 待绑定的邮箱
   * @param code 用户提交的验证码
   * @throws IllegalArgumentException 验证码无效/过期，或邮箱已被占用
   */
  @Transactional
  public void verifyAndBind(Long employeeId, String email, String code) {
    CodeEntry entry = codeCache.getIfPresent("bind:" + email);
    if (entry == null || !entry.code().equals(code) || !entry.employeeId().equals(employeeId)) {
      throw new IllegalArgumentException("验证码无效或已过期");
    }

    // 再次检查邮箱唯一性（防并发绑定）
    Employee existing =
        employeeMapper.selectOne(
            new LambdaQueryWrapper<Employee>()
                .eq(Employee::getEmail, email)
                .eq(Employee::getDeleted, 0));
    if (existing != null && !existing.getId().equals(employeeId)) {
      throw new IllegalArgumentException("该邮箱已被其他账号占用");
    }

    // 写入 email 字段
    Employee employee = employeeMapper.selectById(employeeId);
    if (employee == null) throw new IllegalArgumentException("员工不存在");
    employee.setEmail(email);
    employee.setUpdatedAt(LocalDateTime.now());
    employeeMapper.updateById(employee);

    codeCache.invalidate("bind:" + email);
    log.info("Email bound successfully: employee={}, email={}", employeeId, email);
  }

  // ── Password reset (D-F-16) ──────────────────────────────────────────────

  /**
   * 向员工绑定邮箱发送密码重置验证码。
   *
   * @param employee 当前员工实体
   * @throws IllegalArgumentException 若员工未绑定邮箱
   */
  public void sendPasswordResetCode(Employee employee) {
    if (employee.getEmail() == null || employee.getEmail().isBlank()) {
      throw new IllegalArgumentException("请先绑定邮箱");
    }
    String email = employee.getEmail();
    String code = generateCode();
    codeCache.put("pwd:" + email, new CodeEntry(code, employee.getId()));
    sendEmail(email, "【OA系统】密码重置验证码", "您的密码重置验证码为：" + code + "，5分钟内有效，请勿泄露。");
    log.info("Password reset code sent to {} for employee {}", email, employee.getId());
  }

  /**
   * 验证密码重置验证码，验证通过后清除缓存。
   *
   * @param employeeId 员工 ID
   * @param email 员工绑定邮箱
   * @param code 用户提交的验证码
   * @throws IllegalArgumentException 验证码无效或过期
   */
  public void verifyPasswordResetCode(Long employeeId, String email, String code) {
    CodeEntry entry = codeCache.getIfPresent("pwd:" + email);
    if (entry == null || !entry.code().equals(code) || !entry.employeeId().equals(employeeId)) {
      throw new IllegalArgumentException("验证码无效或已过期");
    }
    codeCache.invalidate("pwd:" + email);
  }

  // ── Dev helpers (dev profile only) ───────────────────────────────────────

  /**
   * Returns the cached verification code for the given email and type prefix. Only intended for the
   * dev-only DevController — never expose in production.
   *
   * @param prefix "bind" or "pwd"
   * @param email target email address
   * @return the 6-digit code, or null if no live code exists for this email
   */
  public String getCachedCode(String prefix, String email) {
    CodeEntry entry = codeCache.getIfPresent(prefix + ":" + email);
    return entry != null ? entry.code() : null;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private String generateCode() {
    int num = RANDOM.nextInt(1_000_000);
    return String.format("%06d", num);
  }

  /**
   * 发送邮件。行为取决于激活的 profile：
   *
   * <ul>
   *   <li><b>dev / test profile</b>：**永不调用 SMTP**。验证码仅写入 Caffeine 缓存 + 明码打到 INFO 日志，测试环境通过
   *       /dev/verification-code 读取。避免 QQ Mail 限流下旧邮件堆积混淆最新码。
   *   <li><b>其他 profile（prod/staging）</b>：若 MAIL_FROM 未配置则跳过（同 dev 默认）；否则真实 send，失败抛
   *       IllegalStateException 由 GlobalExceptionHandler 返回用户"邮件发送失败"。
   * </ul>
   *
   * @param to 收件人邮箱
   * @param subject 主题
   * @param text 正文（含明码，仅在 dev 日志里打印）
   */
  private void sendEmail(String to, String subject, String text) {
    if (isDevOrTestProfile()) {
      log.info(
          "[DEV/TEST] Email NOT sent (SMTP skipped in dev). to={}, subject={}, body={}",
          to,
          subject,
          text);
      return;
    }
    if (mailSender == null || mailFrom == null || mailFrom.isBlank()) {
      log.info(
          "[DEV] Email skipped (mail not configured). to={}, subject={}, text={}",
          to,
          subject,
          text);
      return;
    }
    try {
      SimpleMailMessage message = new SimpleMailMessage();
      message.setFrom(mailFrom);
      message.setTo(to);
      message.setSubject(subject);
      message.setText(text);
      mailSender.send(message);
    } catch (Exception e) {
      log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
      throw new IllegalStateException("邮件发送失败，请稍后重试");
    }
  }

  private boolean isDevOrTestProfile() {
    for (String p : environment.getActiveProfiles()) {
      if ("dev".equalsIgnoreCase(p) || "test".equalsIgnoreCase(p)) return true;
    }
    return false;
  }

  // ── Inner types ───────────────────────────────────────────────────────────

  /**
   * 验证码缓存条目。
   *
   * @param code 6位数字验证码
   * @param employeeId 关联的员工 ID，防止跨员工验证
   */
  private record CodeEntry(String code, Long employeeId) {}
}
