package com.oa.backend.controller;

import com.oa.backend.entity.SalaryConfirmationAgreement;
import com.oa.backend.service.SalaryConfirmationAgreementService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 工资确认协议控制器 职责：管理员工确认工资条前需同意的协议版本（Finance 上传，全员查看）。
 *
 * <p>数据流： - 上传：Finance 上传协议版本号和内容，系统自动将该版本设为生效，其他版本设为失效 - 查询：所有认证用户可获取当前生效的协议
 *
 * <p>路由概览： - POST /salary-confirmation-agreement 上传新协议版本（FINANCE only） - GET
 * /salary-confirmation-agreement/current 获取当前生效协议（所有认证用户）
 */
@RestController
@RequestMapping("/salary-confirmation-agreement")
@RequiredArgsConstructor
public class SalaryConfirmationAgreementController {

  private final SalaryConfirmationAgreementService salaryAgreementService;

  /**
   * 上传新的工资确认协议版本。 权限：FINANCE only
   *
   * <p>数据流： 1. 校验请求参数（version, content 必填） 2. 获取当前登录用户 ID 作为上传人 3. 将所有现有协议的 is_active 设为 false 4.
   * 插入新协议记录，设置 is_active=true
   *
   * @param request 上传请求体（version, content）
   * @param authentication 当前认证信息
   * @return 创建后的协议记录
   */
  @PostMapping
  @PreAuthorize("hasRole('FINANCE')")
  public ResponseEntity<?> uploadAgreement(
      @RequestBody UploadAgreementRequest request, Authentication authentication) {

    if (request.version() == null || request.version().isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("message", "version 不能为空"));
    }
    if (request.content() == null || request.content().isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("message", "content 不能为空"));
    }

    // 获取当前登录用户的员工 ID
    Long employeeId = salaryAgreementService.resolveEmployeeIdByUsername(authentication.getName());

    // 将现有所有协议设为非激活状态，再插入新版本（由 Service 事务保证原子性）
    SalaryConfirmationAgreement agreement =
        salaryAgreementService.uploadNewVersion(request.version(), request.content(), employeeId);
    return ResponseEntity.ok(agreement);
  }

  /**
   * 获取当前生效的工资确认协议。 权限：所有认证用户
   *
   * <p>数据流：查询 salary_confirmation_agreement 表中 is_active=true 的最新记录
   *
   * @return 当前生效的协议内容，若不存在返回 404
   */
  @GetMapping("/current")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<?> getCurrentAgreement() {
    SalaryConfirmationAgreement agreement = salaryAgreementService.findCurrentAgreement();
    if (agreement == null) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(agreement);
  }

  // ── Inner request records ─────────────────────────────────────────────

  /**
   * 上传协议请求
   *
   * @param version 协议版本号（如 "v1.0"）
   * @param content 协议内容（纯文本）
   */
  public record UploadAgreementRequest(String version, String content) {}
}
