package com.oa.backend.controller;

import com.oa.backend.dto.*;
import com.oa.backend.security.SecurityUtils;
import com.oa.backend.service.OaDataService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 薪酬系统控制器
 * 职责：工资条查看、确认与薪资管理
 */
@RestController
@RequestMapping("/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final OaDataService oaDataService;

    /**
     * 获取工资周期列表
     * 权限：财务、CEO
     */
    @GetMapping("/cycles")
    @PreAuthorize("hasAnyRole('FINANCE','CEO')")
    public ResponseEntity<List<PayrollCycleResponse>> listCycles() {
        return ResponseEntity.ok(oaDataService.listPayrollCycles());
    }

    /**
     * 预结算检查
     * 权限：财务
     */
    @PostMapping("/cycles/{id}/precheck")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<String> precheckCycle(@PathVariable Long id) {
        boolean success = oaDataService.precheckPayrollCycle(id);
        if (!success) {
            return ResponseEntity.badRequest().body("预结算失败");
        }
        return ResponseEntity.ok("预结算检查通过");
    }

    /**
     * 正式结算
     * 权限：财务
     */
    @PostMapping("/cycles/{id}/settle")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<String> settleCycle(@PathVariable Long id) {
        boolean success = oaDataService.settlePayrollCycle(id);
        if (!success) {
            return ResponseEntity.badRequest().body("结算失败");
        }
        return ResponseEntity.ok("结算成功");
    }

    /**
     * 获取工资单列表
     * 权限：员工/劳工查看自己的，财务/CEO查看全部
     */
    @GetMapping("/slips")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','CEO')")
    public ResponseEntity<List<PayrollSlipResponse>> listSlips(
            @RequestParam(required = false) Long cycleId,
            Authentication authentication) {
        // 如果不是财务或CEO，只能查看自己的工资单
        if (!SecurityUtils.hasFinanceAccess(authentication) && !SecurityUtils.isCEO(authentication)) {
            String displayName = SecurityUtils.getDisplayNameFromUsername(authentication.getName());
            List<PayrollSlipResponse> slips = oaDataService.listPayrollSlips(cycleId).stream()
                    .filter(s -> s.employeeName().equals(displayName))
                    .toList();
            return ResponseEntity.ok(slips);
        }
        return ResponseEntity.ok(oaDataService.listPayrollSlips(cycleId));
    }

    /**
     * 获取工资单详情
     */
    @GetMapping("/slips/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','CEO')")
    public ResponseEntity<PayrollSlipResponse> getSlip(
            @PathVariable Long id,
            Authentication authentication) {
        return oaDataService.getPayrollSlip(id)
                .filter(s -> SecurityUtils.hasFinanceAccess(authentication) || 
                        SecurityUtils.isCEO(authentication) ||
                        s.employeeName().equals(SecurityUtils.getDisplayNameFromUsername(authentication.getName())))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(403).build());
    }

    /**
     * 确认工资单
     * 权限：员工/劳工只能确认自己的
     */
    @PostMapping("/slips/{id}/confirm")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER')")
    public ResponseEntity<String> confirmSlip(
            @PathVariable Long id,
            HttpServletRequest request,
            Authentication authentication) {
        String displayName = SecurityUtils.getDisplayNameFromUsername(authentication.getName());
        
        var slipOpt = oaDataService.getPayrollSlip(id);
        if (slipOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!slipOpt.get().employeeName().equals(displayName)) {
            return ResponseEntity.status(403).body("只能确认自己的工资单");
        }

        String ip = request.getRemoteAddr();
        boolean success = oaDataService.confirmPayrollSlip(id, ip);
        if (!success) {
            return ResponseEntity.badRequest().body("确认失败");
        }
        return ResponseEntity.ok("确认成功");
    }

    /**
     * 工资异议
     * 权限：员工/劳工只能对自己的工资单提出异议
     */
    @PostMapping("/slips/{id}/dispute")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER')")
    public ResponseEntity<String> disputeSlip(
            @PathVariable Long id,
            @Valid @RequestBody PayrollDisputeRequest request,
            Authentication authentication) {
        String displayName = SecurityUtils.getDisplayNameFromUsername(authentication.getName());
        
        var slipOpt = oaDataService.getPayrollSlip(id);
        if (slipOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!slipOpt.get().employeeName().equals(displayName)) {
            return ResponseEntity.status(403).body("只能对自己的工资单提出异议");
        }

        boolean success = oaDataService.disputePayrollSlip(id, request.reason());
        if (!success) {
            return ResponseEntity.badRequest().body("提交异议失败");
        }
        return ResponseEntity.ok("异议提交成功");
    }
}
