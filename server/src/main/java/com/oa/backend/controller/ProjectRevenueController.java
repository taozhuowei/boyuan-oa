package com.oa.backend.controller;

import com.oa.backend.entity.ProjectMilestone;
import com.oa.backend.exception.BusinessException;
import com.oa.backend.service.ProjectRevenueService;
import com.oa.backend.service.RevenueChangeService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 营收管理 Controller（设计 §8.5）。 数据复用 project_milestone 表的财务字段（contract_amount / receipt_status /
 * actual_receipt_amount / receipt_date）。
 *
 * <p>权限（设计 §8.5）： - 财务：所有项目完整成本明细 + 营收收款状态 - PM / CEO / 总经理：本项目营收汇总（PM 仅限本项目，已由 ProjectMember 校验）
 *
 * <p>路由： GET /projects/{id}/revenue 列出该项目里程碑（含合同金额 + 收款） PUT /projects/{id}/revenue/{milestoneId}
 * 财务/CEO 更新收款状态与金额 GET /projects/{id}/revenue/summary 汇总（合同合计 / 已收 / 待收）
 *
 * <p>业务逻辑委托给 {@link ProjectRevenueService}（查询/更新）和 {@link RevenueChangeService}（变更审批流）。
 */
@RestController
@RequestMapping("/projects/{projectId}/revenue")
@RequiredArgsConstructor
public class ProjectRevenueController {

  private final ProjectRevenueService revenueService;
  private final RevenueChangeService revenueChangeService;

  @GetMapping
  @PreAuthorize("hasAnyRole('CEO','GENERAL_MANAGER','FINANCE','PROJECT_MANAGER')")
  public ResponseEntity<List<ProjectMilestone>> list(@PathVariable Long projectId) {
    // 自动同步已审批的合同金额变更
    revenueChangeService.syncApprovedChanges(projectId);
    return ResponseEntity.ok(revenueService.listMilestonesForRevenue(projectId));
  }

  /**
   * 更新里程碑收款字段（receipt_*）。FINANCE/CEO。 contract_amount 不在此修改 — 必须通过 /contract-change 走对方审批（设计 §8.5）。
   */
  @PutMapping("/{milestoneId}")
  @PreAuthorize("hasAnyRole('CEO','FINANCE')")
  public ResponseEntity<?> update(
      @PathVariable Long projectId,
      @PathVariable Long milestoneId,
      @RequestBody RevenueUpdateRequest req) {
    ProjectMilestone m = revenueService.getMilestoneByIdAndProject(milestoneId, projectId);
    if (m == null) return ResponseEntity.notFound().build();
    if (req.contractAmount() != null
        && (m.getContractAmount() == null
            || req.contractAmount().compareTo(m.getContractAmount()) != 0)) {
      return ResponseEntity.badRequest()
          .body(Map.of("message", "合同金额变更须通过 POST /contract-change 走对方审批（设计 §8.5）"));
    }
    if (req.receiptStatus() != null) m.setReceiptStatus(req.receiptStatus());
    if (req.actualReceiptAmount() != null) m.setActualReceiptAmount(req.actualReceiptAmount());
    if (req.receiptDate() != null) m.setReceiptDate(req.receiptDate());
    if (req.receiptRemark() != null) m.setReceiptRemark(req.receiptRemark());
    return ResponseEntity.ok(revenueService.updateReceiptFields(m));
  }

  /** 发起合同金额变更（设计 §8.5 跨方审批） */
  @PostMapping("/{milestoneId}/contract-change")
  @PreAuthorize("hasAnyRole('FINANCE','PROJECT_MANAGER')")
  public ResponseEntity<?> proposeContractChange(
      @PathVariable Long projectId,
      @PathVariable Long milestoneId,
      @RequestBody ContractChangeRequest req,
      Authentication auth) {
    Long me = revenueService.resolveEmployeeId(auth.getName());
    String role =
        auth.getAuthorities().stream().map(a -> a.getAuthority()).anyMatch("ROLE_FINANCE"::equals)
            ? "FINANCE"
            : "PROJECT_MANAGER";
    try {
      ProjectMilestone m =
          revenueChangeService.createChange(milestoneId, req.amount(), req.reason(), me, role);
      return ResponseEntity.ok(m);
    } catch (IllegalStateException e) {
      throw new BusinessException(400, e.getMessage());
    }
  }

  /** 撤销变更（仅发起人本人） */
  @DeleteMapping("/{milestoneId}/contract-change")
  @PreAuthorize("hasAnyRole('FINANCE','PROJECT_MANAGER')")
  public ResponseEntity<?> cancelChange(
      @PathVariable Long projectId, @PathVariable Long milestoneId, Authentication auth) {
    Long me = revenueService.resolveEmployeeId(auth.getName());
    try {
      revenueChangeService.cancelChange(milestoneId, me);
      return ResponseEntity.ok(Map.of("message", "已撤销"));
    } catch (IllegalStateException e) {
      // 撤销失败语义为 "非发起人本人"，返回 403
      throw new BusinessException(403, e.getMessage());
    }
  }

  @GetMapping("/summary")
  @PreAuthorize("hasAnyRole('CEO','GENERAL_MANAGER','FINANCE','PROJECT_MANAGER')")
  public ResponseEntity<Map<String, Object>> summary(@PathVariable Long projectId) {
    revenueChangeService.syncApprovedChanges(projectId);
    return ResponseEntity.ok(revenueService.summarizeRevenue(projectId));
  }

  public record RevenueUpdateRequest(
      BigDecimal contractAmount,
      String receiptStatus,
      BigDecimal actualReceiptAmount,
      LocalDate receiptDate,
      String receiptRemark) {}

  public record ContractChangeRequest(BigDecimal amount, String reason) {}
}
