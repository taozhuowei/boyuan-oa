package com.oa.backend.controller;

import com.oa.backend.entity.PayrollAdjustment;
import com.oa.backend.entity.PayrollCycle;
import com.oa.backend.entity.PayrollSlip;
import com.oa.backend.exception.BusinessException;
import com.oa.backend.security.SecurityUtils;
import com.oa.backend.service.PayrollCorrectionService;
import com.oa.backend.service.PayrollCycleService;
import com.oa.backend.service.PayrollEngine;
import com.oa.backend.service.PayrollSlipService;
import com.oa.backend.service.SignatureService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 薪酬系统控制器 职责：工资周期管理（Finance/CEO）、工资条查看与确认/异议（Employee/Worker）。 业务逻辑委托 {@link PayrollEngine}、{@link
 * PayrollCycleService}、 {@link PayrollSlipService}、{@link SignatureService}、{@link
 * PayrollCorrectionService}。
 *
 * <p>路由概览： - GET /payroll/cycles 查询所有工资周期（Finance/CEO） - POST /payroll/cycles 创建工资周期（Finance/CEO） -
 * POST /payroll/cycles/{id}/open-window 开放申报窗口（Finance/CEO） - POST /payroll/cycles/{id}/precheck
 * 预结算检查（Finance/CEO） - POST /payroll/cycles/{id}/settle 正式结算（Finance/CEO） - POST
 * /payroll/cycles/{id}/unlock CEO 解锁已结算周期 - GET /payroll/slips 查询工资条（员工看自己，Finance/CEO 按周期查全部） -
 * GET /payroll/slips/{id} 工资条详情含明细 - POST /payroll/slips/{id}/confirm 员工确认工资条（Employee/Worker） -
 * POST /payroll/slips/{id}/dispute 员工提出异议（Employee/Worker） - POST /payroll/slips/{id}/correction
 * Finance 发起更正 - GET /payroll/corrections 列出更正记录（Finance/CEO）
 */
@RestController
@RequestMapping("/payroll")
@RequiredArgsConstructor
public class PayrollController {

  private final PayrollEngine payrollEngine;
  private final PayrollCycleService payrollCycleService;
  private final PayrollSlipService payrollSlipService;
  private final SignatureService signatureService;
  private final PayrollCorrectionService correctionService;

  // ── 周期管理（Finance/CEO） ──────────────────────────────────────────────

  /** 查询所有工资周期，按 period 降序返回。 */
  @GetMapping("/cycles")
  @PreAuthorize("hasAnyRole('FINANCE','CEO')")
  public ResponseEntity<List<PayrollCycle>> listCycles() {
    return ResponseEntity.ok(payrollCycleService.listCycles());
  }

  /** 创建工资周期。 请求体：{ "period": "2026-04" } */
  @PostMapping("/cycles")
  @PreAuthorize("hasAnyRole('FINANCE','CEO')")
  public ResponseEntity<?> createCycle(@RequestBody CreateCycleRequest request) {
    if (request.period() == null || request.period().isBlank()) {
      throw new BusinessException(400, "period 不能为空（格式：yyyy-MM）");
    }
    try {
      PayrollCycle cycle = payrollEngine.createCycle(request.period());
      return ResponseEntity.ok(cycle);
    } catch (IllegalStateException e) {
      throw new BusinessException(400, e.getMessage());
    }
  }

  /** 开放申报窗口，进入 WINDOW_OPEN 状态。 */
  @PostMapping("/cycles/{id}/open-window")
  @PreAuthorize("hasAnyRole('FINANCE','CEO')")
  public ResponseEntity<?> openWindow(@PathVariable Long id) {
    try {
      PayrollCycle cycle = payrollEngine.openWindow(id);
      return ResponseEntity.ok(cycle);
    } catch (IllegalStateException e) {
      throw new BusinessException(400, e.getMessage());
    }
  }

  /** 预结算检查：返回检查项列表。 */
  @PostMapping("/cycles/{id}/precheck")
  @PreAuthorize("hasAnyRole('FINANCE','CEO')")
  public ResponseEntity<?> precheck(@PathVariable Long id) {
    try {
      List<PayrollEngine.PrecheckItem> items = payrollEngine.precheck(id);
      boolean allPass = items.stream().allMatch(PayrollEngine.PrecheckItem::pass);
      return ResponseEntity.ok(Map.of("pass", allPass, "items", items));
    } catch (IllegalStateException e) {
      throw new BusinessException(400, e.getMessage());
    }
  }

  /** 正式结算：生成 PayrollSlip + PayrollSlipItem，并将周期置为 SETTLED。 */
  @PostMapping("/cycles/{id}/settle")
  @PreAuthorize("hasAnyRole('FINANCE','CEO')")
  public ResponseEntity<?> settle(@PathVariable Long id) {
    try {
      PayrollCycle cycle = payrollEngine.settle(id);
      return ResponseEntity.ok(cycle);
    } catch (IllegalStateException e) {
      throw new BusinessException(400, e.getMessage());
    }
  }

  /** CEO 解锁已结算周期（设计 §6.6）：仅 CEO，无需审批；操作日志自动记录；通知财务。 */
  @PostMapping("/cycles/{id}/unlock")
  @PreAuthorize("hasRole('CEO')")
  @com.oa.backend.annotation.OperationLogRecord(
      action = "PAYROLL_CYCLE_UNLOCK",
      targetType = "PAYROLL_CYCLE")
  public ResponseEntity<?> unlock(@PathVariable Long id, Authentication auth) {
    PayrollCycleService.UnlockResult result = payrollCycleService.unlock(id);
    if (result instanceof PayrollCycleService.UnlockResult.Ok ok) {
      return ResponseEntity.ok(ok.cycle());
    } else if (result instanceof PayrollCycleService.UnlockResult.NotFound) {
      return ResponseEntity.notFound().build();
    } else {
      PayrollCycleService.UnlockResult.BadState bad =
          (PayrollCycleService.UnlockResult.BadState) result;
      return ResponseEntity.badRequest()
          .body(Map.of("message", "周期当前状态 [" + bad.currentStatus() + "] 不需要解锁"));
    }
  }

  // ── 工资条（分角色权限） ────────────────────────────────────────────────

  /** 查询工资条列表。 - Finance/CEO：按 cycleId 查询（cycleId 必填） - Employee/Worker：查询当前登录员工的所有工资条 */
  @GetMapping("/slips")
  @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','CEO')")
  public ResponseEntity<?> listSlips(
      @RequestParam(required = false) Long cycleId, Authentication authentication) {

    if (SecurityUtils.hasFinanceAccess(authentication)) {
      if (cycleId == null) {
        return ResponseEntity.ok(payrollSlipService.listAll());
      }
      return ResponseEntity.ok(payrollSlipService.listByCycleId(cycleId));
    }

    Long employeeId = payrollSlipService.resolveEmployeeId(authentication.getName());
    if (employeeId == null) {
      return ResponseEntity.status(403).body(Map.of("message", "无法识别当前用户"));
    }
    return ResponseEntity.ok(payrollSlipService.listByEmployeeId(employeeId));
  }

  /** 查询工资条详情（含明细项）。 */
  @GetMapping("/slips/{id}")
  @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','CEO')")
  public ResponseEntity<?> getSlip(@PathVariable Long id, Authentication authentication) {
    PayrollSlip slip = payrollSlipService.findById(id);
    if (slip == null) {
      return ResponseEntity.notFound().build();
    }

    if (!SecurityUtils.hasFinanceAccess(authentication)) {
      Long employeeId = payrollSlipService.resolveEmployeeId(authentication.getName());
      if (!slip.getEmployeeId().equals(employeeId)) {
        return ResponseEntity.status(403).body(Map.of("message", "无权查看此工资条"));
      }
    }

    return ResponseEntity.ok(
        Map.of("slip", slip, "items", payrollSlipService.listEnrichedItems(id)));
  }

  /** 员工确认工资条（电子签名版）。 */
  @PostMapping("/slips/{id}/confirm")
  @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER')")
  public ResponseEntity<?> confirmSlip(
      @PathVariable Long id,
      @RequestBody ConfirmSlipRequest request,
      Authentication authentication) {
    PayrollSlip slip = payrollSlipService.getOwnSlip(id, authentication);
    if (slip == null) {
      return ResponseEntity.status(403).body(Map.of("message", "无权操作此工资条"));
    }

    Long employeeId = SecurityUtils.getCurrentEmployeeId(authentication);
    if (employeeId == null) {
      return ResponseEntity.status(403).body(Map.of("message", "无法识别当前用户"));
    }

    if (!signatureService.isBound(employeeId)) {
      return ResponseEntity.badRequest().body(Map.of("message", "请先绑定电子签名"));
    }
    if (request == null || request.pin() == null || request.pin().isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("message", "请输入 PIN 码"));
    }

    try {
      Long evidenceId = signatureService.confirmPayrollSlip(employeeId, id, request.pin());
      PayrollSlip confirmed = payrollSlipService.findById(id);
      return ResponseEntity.ok(
          Map.of(
              "message", "已确认",
              "slipId", id,
              "evidenceId", evidenceId,
              "slip", confirmed));
    } catch (IllegalStateException e) {
      throw new BusinessException(400, e.getMessage());
    }
  }

  /** 员工对工资条提出异议。 */
  @PostMapping("/slips/{id}/dispute")
  @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER')")
  public ResponseEntity<?> disputeSlip(
      @PathVariable Long id, @RequestBody DisputeRequest request, Authentication authentication) {

    PayrollSlip slip = payrollSlipService.getOwnSlip(id, authentication);
    if (slip == null) {
      return ResponseEntity.status(403).body(Map.of("message", "无权操作此工资条"));
    }

    PayrollSlip updated = payrollSlipService.dispute(slip);
    if (updated == null) {
      return ResponseEntity.badRequest()
          .body(Map.of("message", "工资条状态为 [" + slip.getStatus() + "]，仅 PUBLISHED 状态可提出异议"));
    }
    return ResponseEntity.ok(Map.of("message", "异议已提交", "slip", updated));
  }

  // ── 薪资更正（Finance 发起 → CEO 审批） ───────────────────────────────────

  /** Finance 发起更正。 */
  @PostMapping("/slips/{id}/correction")
  @PreAuthorize("hasRole('FINANCE')")
  public ResponseEntity<?> createCorrection(
      @PathVariable Long id, @RequestBody CorrectionRequest req, Authentication auth) {
    Long financeId = payrollSlipService.resolveEmployeeId(auth.getName());
    if (financeId == null) {
      return ResponseEntity.status(401).body(Map.of("message", "无法识别当前用户"));
    }
    try {
      List<PayrollCorrectionService.CorrectionItem> items =
          req.corrections() == null
              ? List.of()
              : req.corrections().stream()
                  .map(
                      c ->
                          new PayrollCorrectionService.CorrectionItem(
                              c.itemDefId(), c.amount(), c.remark()))
                  .toList();
      PayrollAdjustment adj =
          correctionService.createCorrection(id, req.reason(), items, financeId);
      return ResponseEntity.ok(adj);
    } catch (IllegalStateException ex) {
      throw new BusinessException(400, ex.getMessage());
    }
  }

  /** 列出更正记录（自动同步 form 状态）。 */
  @GetMapping("/corrections")
  @PreAuthorize("hasAnyRole('FINANCE','CEO')")
  public ResponseEntity<List<PayrollAdjustment>> listCorrections(
      @RequestParam(required = false) Long cycleId,
      @RequestParam(required = false) Long employeeId) {
    return ResponseEntity.ok(correctionService.list(cycleId, employeeId));
  }

  // ── Inner request records ─────────────────────────────────────────────

  /** 创建工资周期请求 */
  public record CreateCycleRequest(String period) {}

  /** 异议请求 */
  public record DisputeRequest(String reason) {}

  /** 确认工资条请求 */
  public record ConfirmSlipRequest(String pin) {}

  /** 更正请求 */
  public record CorrectionRequest(String reason, List<CorrectionItemPayload> corrections) {}

  /** 更正项 */
  public record CorrectionItemPayload(Long itemDefId, java.math.BigDecimal amount, String remark) {}
}
