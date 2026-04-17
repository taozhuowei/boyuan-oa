package com.oa.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oa.backend.entity.*;
import com.oa.backend.mapper.*;
import com.oa.backend.security.SecurityUtils;
import com.oa.backend.service.PayrollCorrectionService;
import com.oa.backend.service.PayrollEngine;
import com.oa.backend.service.SignatureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 薪酬系统控制器
 * 职责：工资周期管理（Finance/CEO）、工资条查看与确认/异议（Employee/Worker）。
 *
 * 路由概览：
 * - GET  /payroll/cycles                   查询所有工资周期（Finance/CEO）
 * - POST /payroll/cycles                   创建工资周期（Finance/CEO）
 * - POST /payroll/cycles/{id}/open-window  开放申报窗口（Finance/CEO）
 * - POST /payroll/cycles/{id}/precheck     预结算检查（Finance/CEO）
 * - POST /payroll/cycles/{id}/settle       正式结算（Finance/CEO）
 * - GET  /payroll/slips                    查询工资条（员工看自己，Finance/CEO 按周期查全部）
 * - GET  /payroll/slips/{id}               工资条详情含明细（权限同上）
 * - POST /payroll/slips/{id}/confirm       员工确认工资条（Employee/Worker）
 * - POST /payroll/slips/{id}/dispute       员工提出异议（Employee/Worker）
 */
@Slf4j
@RestController
@RequestMapping("/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollEngine payrollEngine;
    private final PayrollCycleMapper cycleMapper;
    private final PayrollSlipMapper slipMapper;
    private final PayrollSlipItemMapper slipItemMapper;
    private final PayrollItemDefMapper itemDefMapper;
    private final EmployeeMapper employeeMapper;
    private final SignatureService signatureService;
    private final PayrollCorrectionService correctionService;
    private final com.oa.backend.service.NotificationService notificationService;

    // ── 周期管理（Finance/CEO） ──────────────────────────────────────────────

    /**
     * 查询所有工资周期，按 period 降序返回。
     */
    @GetMapping("/cycles")
    @PreAuthorize("hasAnyRole('FINANCE','CEO')")
    public ResponseEntity<List<PayrollCycle>> listCycles() {
        List<PayrollCycle> cycles = cycleMapper.selectList(
                new LambdaQueryWrapper<PayrollCycle>()
                        .eq(PayrollCycle::getDeleted, 0)
                        .orderByDesc(PayrollCycle::getPeriod)
        );
        return ResponseEntity.ok(cycles);
    }

    /**
     * 创建工资周期。
     * 请求体：{ "period": "2026-04" }
     */
    @PostMapping("/cycles")
    @PreAuthorize("hasAnyRole('FINANCE','CEO')")
    public ResponseEntity<?> createCycle(@RequestBody CreateCycleRequest request) {
        if (request.period() == null || request.period().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "period 不能为空（格式：yyyy-MM）"));
        }
        try {
            PayrollCycle cycle = payrollEngine.createCycle(request.period());
            return ResponseEntity.ok(cycle);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 开放申报窗口，进入 WINDOW_OPEN 状态。
     * 窗口到期后由 Scheduler 自动关闭，无手动关闭接口。
     */
    @PostMapping("/cycles/{id}/open-window")
    @PreAuthorize("hasAnyRole('FINANCE','CEO')")
    public ResponseEntity<?> openWindow(@PathVariable Long id) {
        try {
            PayrollCycle cycle = payrollEngine.openWindow(id);
            return ResponseEntity.ok(cycle);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 预结算检查：返回检查项列表，前端展示并让用户决定是否继续结算。
     */
    @PostMapping("/cycles/{id}/precheck")
    @PreAuthorize("hasAnyRole('FINANCE','CEO')")
    public ResponseEntity<?> precheck(@PathVariable Long id) {
        try {
            List<PayrollEngine.PrecheckItem> items = payrollEngine.precheck(id);
            boolean allPass = items.stream().allMatch(PayrollEngine.PrecheckItem::pass);
            return ResponseEntity.ok(Map.of("pass", allPass, "items", items));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 正式结算：生成 PayrollSlip + PayrollSlipItem，并将周期置为 SETTLED。
     */
    @PostMapping("/cycles/{id}/settle")
    @PreAuthorize("hasAnyRole('FINANCE','CEO')")
    public ResponseEntity<?> settle(@PathVariable Long id) {
        try {
            PayrollCycle cycle = payrollEngine.settle(id);
            return ResponseEntity.ok(cycle);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * CEO 解锁已结算周期（设计 §6.6）：仅 CEO，无需审批；操作日志自动记录；通知财务。
     * 解锁后周期回到 WINDOW_CLOSED，财务可重新结算或更正。
     */
    @PostMapping("/cycles/{id}/unlock")
    @PreAuthorize("hasRole('CEO')")
    @com.oa.backend.annotation.OperationLogRecord(action = "PAYROLL_CYCLE_UNLOCK", targetType = "PAYROLL_CYCLE")
    public ResponseEntity<?> unlock(@PathVariable Long id, Authentication auth) {
        PayrollCycle cycle = cycleMapper.selectById(id);
        if (cycle == null || (cycle.getDeleted() != null && cycle.getDeleted() == 1)) {
            return ResponseEntity.notFound().build();
        }
        if (!"SETTLED".equals(cycle.getStatus()) && !"LOCKED".equals(cycle.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "周期当前状态 [" + cycle.getStatus() + "] 不需要解锁"));
        }
        cycle.setStatus("WINDOW_CLOSED");
        cycle.setLockedAt(null);
        cycle.setUpdatedAt(LocalDateTime.now());
        cycleMapper.updateById(cycle);

        // 通知所有 finance 角色
        try {
            List<com.oa.backend.entity.Employee> finances = employeeMapper.selectList(
                    new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.oa.backend.entity.Employee>()
                            .eq(com.oa.backend.entity.Employee::getRoleCode, "finance")
                            .eq(com.oa.backend.entity.Employee::getDeleted, 0));
            for (com.oa.backend.entity.Employee f : finances) {
                notificationService.send(f.getId(), "薪资周期已被 CEO 解锁",
                        "周期 " + cycle.getPeriod() + " 已解锁，请重新核对并结算。",
                        "PAYROLL", "PAYROLL_CYCLE", id);
            }
        } catch (Exception e) {
            log.error("解锁薪资周期后通知财务失败 cycleId={}", id, e);
        }
        return ResponseEntity.ok(cycle);
    }

    // ── 工资条（分角色权限） ────────────────────────────────────────────────

    /**
     * 查询工资条列表。
     * - Finance/CEO：按 cycleId 查询（cycleId 必填）
     * - Employee/Worker：查询当前登录员工的所有工资条
     */
    @GetMapping("/slips")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','CEO')")
    public ResponseEntity<?> listSlips(
            @RequestParam(required = false) Long cycleId,
            Authentication authentication) {

        if (SecurityUtils.hasFinanceAccess(authentication)) {
            if (cycleId == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Finance/CEO 查询工资条时 cycleId 为必填"));
            }
            List<PayrollSlip> slips = slipMapper.findByCycleId(cycleId);
            return ResponseEntity.ok(slips);
        }

        // Employee/Worker 只能查自己的
        Long employeeId = SecurityUtils.getEmployeeIdFromUsername(authentication.getName(), employeeMapper);
        if (employeeId == null) {
            return ResponseEntity.status(403).body(Map.of("message", "无法识别当前用户"));
        }
        List<PayrollSlip> slips = slipMapper.findByEmployeeId(employeeId);
        return ResponseEntity.ok(slips);
    }

    /**
     * 查询工资条详情（含明细项）。
     * - Employee/Worker 只能查看自己的工资条
     * - Finance/CEO 可查看任意工资条
     */
    @GetMapping("/slips/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','CEO')")
    public ResponseEntity<?> getSlip(@PathVariable Long id, Authentication authentication) {
        PayrollSlip slip = slipMapper.selectById(id);
        if (slip == null || slip.getDeleted() == 1) {
            return ResponseEntity.notFound().build();
        }

        // 员工只能看自己的
        if (!SecurityUtils.hasFinanceAccess(authentication)) {
            Long employeeId = SecurityUtils.getEmployeeIdFromUsername(authentication.getName(), employeeMapper);
            if (!slip.getEmployeeId().equals(employeeId)) {
                return ResponseEntity.status(403).body(Map.of("message", "无权查看此工资条"));
            }
        }

        // 查询明细
        List<PayrollSlipItem> items = slipItemMapper.findBySlipId(id);
        // 为明细补充定义名称（type、name）
        List<Map<String, Object>> enrichedItems = items.stream().map(item -> {
            PayrollItemDef def = itemDefMapper.selectById(item.getItemDefId());
            return Map.<String, Object>of(
                    "id", item.getId(),
                    "itemDefId", item.getItemDefId(),
                    "name", def != null ? def.getName() : "未知",
                    "type", def != null ? def.getType() : "",
                    "amount", item.getAmount(),
                    "remark", item.getRemark() != null ? item.getRemark() : ""
            );
        }).toList();

        return ResponseEntity.ok(Map.of("slip", slip, "items", enrichedItems));
    }

    /**
     * 员工确认工资条（电子签名版）。
     * 需要验证 PIN 码，成功后生成存证链记录。
     * 仅 PUBLISHED 状态的工资条可被确认。
     *
     * @param id             工资条 ID
     * @param request        确认请求 { "pin": "123456" }
     * @param authentication 当前用户认证信息
     * @return 确认结果，包含存证链 ID
     */
    @PostMapping("/slips/{id}/confirm")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER')")
    public ResponseEntity<?> confirmSlip(@PathVariable Long id,
                                          @RequestBody ConfirmSlipRequest request,
                                          Authentication authentication) {
        PayrollSlip slip = getOwnSlip(id, authentication);
        if (slip == null) {
            return ResponseEntity.status(403).body(Map.of("message", "无权操作此工资条"));
        }

        Long employeeId = SecurityUtils.getCurrentEmployeeId(authentication);
        if (employeeId == null) {
            return ResponseEntity.status(403).body(Map.of("message", "无法识别当前用户"));
        }

        // 验证是否已绑定签名
        if (!signatureService.isBound(employeeId)) {
            return ResponseEntity.badRequest().body(Map.of("message", "请先绑定电子签名"));
        }

        // 验证 PIN 码
        if (request == null || request.pin() == null || request.pin().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "请输入 PIN 码"));
        }

        try {
            Long evidenceId = signatureService.confirmPayrollSlip(employeeId, id, request.pin());
            PayrollSlip confirmed = slipMapper.selectById(id);
            return ResponseEntity.ok(Map.of(
                    "message", "已确认",
                    "slipId", id,
                    "evidenceId", evidenceId,
                    "slip", confirmed
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 员工对工资条提出异议。
     * 请求体：{ "reason": "基本工资金额有误" }
     * 仅 PUBLISHED 状态的工资条可提出异议。
     */
    @PostMapping("/slips/{id}/dispute")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER')")
    public ResponseEntity<?> disputeSlip(
            @PathVariable Long id,
            @RequestBody DisputeRequest request,
            Authentication authentication) {

        PayrollSlip slip = getOwnSlip(id, authentication);
        if (slip == null) {
            return ResponseEntity.status(403).body(Map.of("message", "无权操作此工资条"));
        }
        if (!"PUBLISHED".equals(slip.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "工资条状态为 [" + slip.getStatus() + "]，仅 PUBLISHED 状态可提出异议"));
        }

        slip.setStatus("DISPUTED");
        slip.setUpdatedAt(LocalDateTime.now());
        slipMapper.updateById(slip);
        return ResponseEntity.ok(Map.of("message", "异议已提交", "slip", slip));
    }

    // ── Private helpers ───────────────────────────────────────────────────

    /**
     * 获取属于当前员工的工资条，不属于则返回 null。
     */
    private PayrollSlip getOwnSlip(Long slipId, Authentication authentication) {
        PayrollSlip slip = slipMapper.selectById(slipId);
        if (slip == null || slip.getDeleted() == 1) return null;

        Long employeeId = SecurityUtils.getEmployeeIdFromUsername(authentication.getName(), employeeMapper);
        if (employeeId == null || !slip.getEmployeeId().equals(employeeId)) return null;

        return slip;
    }

    // ── Inner request records ─────────────────────────────────────────────

    /** 创建工资周期请求 */
    public record CreateCycleRequest(String period) {}

    /** 异议请求 */
    public record DisputeRequest(String reason) {}

    /** 确认工资条请求 */
    public record ConfirmSlipRequest(String pin) {}

    // ── 薪资更正（Finance 发起 → CEO 审批） ───────────────────────────────────

    /**
     * Finance 发起更正：填写 reason + 更正项（部分或全部 item_def_id 的新金额）。
     * 创建 form_record（PAYROLL_CORRECTION）+ payroll_adjustment（PENDING）。
     * CEO 在 /todo 通过审批后，下次访问 /payroll/corrections 会自动应用。
     */
    @PostMapping("/slips/{id}/correction")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<?> createCorrection(@PathVariable Long id,
                                              @RequestBody CorrectionRequest req,
                                              Authentication auth) {
        Long financeId = SecurityUtils.getEmployeeIdFromUsername(auth.getName(), employeeMapper);
        if (financeId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "无法识别当前用户"));
        }
        try {
            List<PayrollCorrectionService.CorrectionItem> items = req.corrections() == null
                    ? List.of()
                    : req.corrections().stream()
                            .map(c -> new PayrollCorrectionService.CorrectionItem(c.itemDefId(), c.amount(), c.remark()))
                            .toList();
            PayrollAdjustment adj = correctionService.createCorrection(id, req.reason(), items, financeId);
            return ResponseEntity.ok(adj);
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    /**
     * 列出更正记录（自动同步 form 状态：APPROVED 的会就地应用、REJECTED 的更新 status）。
     */
    @GetMapping("/corrections")
    @PreAuthorize("hasAnyRole('FINANCE','CEO')")
    public ResponseEntity<List<PayrollAdjustment>> listCorrections(
            @RequestParam(required = false) Long cycleId,
            @RequestParam(required = false) Long employeeId) {
        return ResponseEntity.ok(correctionService.list(cycleId, employeeId));
    }

    public record CorrectionRequest(String reason, List<CorrectionItemPayload> corrections) {}
    public record CorrectionItemPayload(Long itemDefId, java.math.BigDecimal amount, String remark) {}
}
