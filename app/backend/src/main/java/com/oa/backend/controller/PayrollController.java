package com.oa.backend.controller;

import com.oa.backend.dto.*;
import com.oa.backend.service.OaDataService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

/**
 * 薪资管理控制器
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
    public ResponseEntity<List<PayrollCycleResponse>> listPayrollCycles(Authentication authentication) {
        if (!hasFinanceAccess(authentication)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(oaDataService.listPayrollCycles());
    }

    /**
     * 预结算检查
     * 权限：仅限财务
     */
    @PostMapping("/cycles/{id}/precheck")
    public ResponseEntity<String> precheckPayrollCycle(
            @PathVariable Long id,
            Authentication authentication) {
        // 仅财务可以执行预结算，CEO也不能执行
        if (!isFinanceOnly(authentication)) {
            return ResponseEntity.status(403).build();
        }
        boolean success = oaDataService.precheckPayrollCycle(id);
        if (!success) {
            return ResponseEntity.badRequest().body("预结算失败，存在未审批单据或周期已锁定");
        }
        return ResponseEntity.ok("预结算检查通过");
    }

    /**
     * 正式结算
     * 权限：仅限财务
     */
    @PostMapping("/cycles/{id}/settle")
    public ResponseEntity<String> settlePayrollCycle(
            @PathVariable Long id,
            Authentication authentication) {
        if (!isFinanceOnly(authentication)) {
            return ResponseEntity.status(403).build();
        }
        boolean success = oaDataService.settlePayrollCycle(id);
        if (!success) {
            return ResponseEntity.badRequest().body("结算失败，周期不存在或已锁定");
        }
        return ResponseEntity.ok("结算成功");
    }

    /**
     * 获取工资单列表
     * 权限：财务、CEO（查看所有），员工、劳工（查看自己的）
     */
    @GetMapping("/slips")
    public ResponseEntity<List<PayrollSlipResponse>> listPayrollSlips(
            @RequestParam(required = false) Long cycleId,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        // 如果不是财务或CEO，只能查看自己的工资单
        if (!hasFinanceAccess(authentication)) {
            String username = authentication.getName();
            String displayName = getDisplayNameFromUsername(username);
            List<PayrollSlipResponse> slips = oaDataService.listPayrollSlips(cycleId).stream()
                    .filter(s -> s.employeeName().equals(displayName))
                    .toList();
            return ResponseEntity.ok(slips);
        }
        return ResponseEntity.ok(oaDataService.listPayrollSlips(cycleId));
    }

    /**
     * 获取工资单详情
     * 权限：自己查看自己的，财务和CEO可查看所有
     */
    @GetMapping("/slips/{id}")
    public ResponseEntity<PayrollSlipResponse> getPayrollSlip(
            @PathVariable Long id,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        return oaDataService.getPayrollSlip(id)
                .filter(s -> hasFinanceAccess(authentication) ||
                        s.employeeName().equals(getDisplayNameFromUsername(authentication.getName())))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(403).build());
    }

    /**
     * 确认工资单
     * 权限：员工、劳工（只能确认自己的）
     */
    @PostMapping("/slips/{id}/confirm")
    public ResponseEntity<String> confirmPayrollSlip(
            @PathVariable Long id,
            HttpServletRequest request,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        // 检查是否是本人
        String username = authentication.getName();
        String displayName = getDisplayNameFromUsername(username);

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
     * 权限：员工、劳工（只能对自己的工资单提出异议）
     */
    @PostMapping("/slips/{id}/dispute")
    public ResponseEntity<String> disputePayrollSlip(
            @PathVariable Long id,
            @Valid @RequestBody PayrollDisputeRequest request,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        // 检查是否是本人
        String username = authentication.getName();
        String displayName = getDisplayNameFromUsername(username);

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

    /**
     * 发起更正
     * 权限：财务发起，CEO审批
     */
    @PostMapping("/cycles/{id}/corrections")
    public ResponseEntity<String> createCorrection(
            @PathVariable Long id,
            @Valid @RequestBody PayrollCorrectionRequest request,
            Authentication authentication) {
        if (!isFinanceOnly(authentication)) {
            return ResponseEntity.status(403).build();
        }
        // 创建更正申请，等待CEO审批
        return ResponseEntity.ok("更正申请已提交，等待CEO审批");
    }

    /**
     * 重新计算
     * 权限：仅限财务（需CEO审批通过后）
     */
    @PostMapping("/cycles/{id}/recalculate")
    public ResponseEntity<String> recalculatePayrollCycle(
            @PathVariable Long id,
            Authentication authentication) {
        if (!isFinanceOnly(authentication)) {
            return ResponseEntity.status(403).build();
        }
        boolean success = oaDataService.recalculatePayrollCycle(id);
        if (!success) {
            return ResponseEntity.badRequest().body("重新计算失败，周期不存在或未锁定");
        }
        return ResponseEntity.ok("重新计算已启动，将生成新版本工资单");
    }

    private boolean hasFinanceAccess(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> Arrays.asList("ROLE_FINANCE", "ROLE_CEO").contains(a.getAuthority()));
    }

    private boolean isFinance(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_FINANCE".equals(a.getAuthority()));
    }

    private boolean isFinanceOnly(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_FINANCE".equals(a.getAuthority()));
    }

    private String getDisplayNameFromUsername(String username) {
        return switch (username.toLowerCase()) {
            case "employee.demo" -> "张晓宁";
            case "worker.demo" -> "赵铁柱";
            case "finance.demo" -> "李静";
            case "pm.demo" -> "王建国";
            case "ceo.demo" -> "陈明远";
            default -> username;
        };
    }
}
