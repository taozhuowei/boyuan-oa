package com.oa.backend.controller;

import com.oa.backend.entity.PayrollBonus;
import com.oa.backend.mapper.EmployeeMapper;
import com.oa.backend.security.SecurityUtils;
import com.oa.backend.service.PayrollBonusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 周期临时补贴/奖金 Controller。
 * 财务在薪资周期窗口期内录入；结算后锁定。
 *
 * Routes:
 *   GET    /payroll/cycles/{cycleId}/bonuses              列出周期全部临时补贴（财务/CEO）
 *   POST   /payroll/cycles/{cycleId}/bonuses              创建（财务）
 *   DELETE /payroll/bonuses/{id}                          软删除（财务，仅未结算可删）
 *   GET    /payroll/bonus-approval-config                 获取审批开关（认证用户）
 *   PUT    /payroll/bonus-approval-config                 设置审批开关（CEO）
 */
@RestController
@RequiredArgsConstructor
public class PayrollBonusController {

    private final PayrollBonusService bonusService;
    private final EmployeeMapper employeeMapper;

    @GetMapping("/payroll/cycles/{cycleId}/bonuses")
    @PreAuthorize("hasAnyRole('FINANCE','CEO')")
    public ResponseEntity<List<PayrollBonus>> list(@PathVariable Long cycleId) {
        return ResponseEntity.ok(bonusService.listByCycle(cycleId));
    }

    @PostMapping("/payroll/cycles/{cycleId}/bonuses")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<?> create(@PathVariable Long cycleId,
                                    @RequestBody CreateBonusRequest req,
                                    Authentication auth) {
        Long creatorId = SecurityUtils.getEmployeeIdFromUsername(auth.getName(), employeeMapper);
        if (creatorId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "无法识别当前用户"));
        }
        if (req.employeeId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "employeeId 不能为空"));
        }
        if (req.name() == null || req.name().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "name 不能为空"));
        }
        try {
            PayrollBonus bonus = bonusService.create(cycleId, req.employeeId(), req.name(),
                    req.amount(), req.type(), req.remark(), creatorId);
            return ResponseEntity.ok(bonus);
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @DeleteMapping("/payroll/bonuses/{id}")
    @PreAuthorize("hasAnyRole('FINANCE','CEO')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            bonusService.delete(id);
            return ResponseEntity.ok(Map.of("message", "已删除", "id", id));
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @GetMapping("/payroll/bonus-approval-config")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> getApprovalConfig() {
        return ResponseEntity.ok(Map.of("approvalRequired", bonusService.isApprovalRequired()));
    }

    @PutMapping("/payroll/bonus-approval-config")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<Map<String, Boolean>> setApprovalConfig(@RequestBody SetApprovalRequest req) {
        bonusService.setApprovalRequired(Boolean.TRUE.equals(req.approvalRequired()));
        return ResponseEntity.ok(Map.of("approvalRequired", bonusService.isApprovalRequired()));
    }

    // ── Request records ───────────────────────────────────────────────

    public record CreateBonusRequest(Long employeeId, String name, BigDecimal amount,
                                     String type, String remark) {}

    public record SetApprovalRequest(Boolean approvalRequired) {}
}
