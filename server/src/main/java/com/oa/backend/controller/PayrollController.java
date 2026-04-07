package com.oa.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 薪酬系统控制器
 * 当前状态：M5 薪资模块未实现，返回 501 占位
 */
@RestController
@RequestMapping("/payroll")
public class PayrollController {

    /**
     * 获取工资周期列表
     * TODO M5: 实现薪资模块后替换此占位实现
     */
    @GetMapping("/cycles")
    @PreAuthorize("hasAnyRole('FINANCE','CEO')")
    public ResponseEntity<List<?>> listCycles() {
        return ResponseEntity.status(501).build();
    }

    /**
     * 预结算检查
     * TODO M5: 实现薪资模块后替换此占位实现
     */
    @PostMapping("/cycles/{id}/precheck")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<?> precheckCycle(@PathVariable Long id) {
        return ResponseEntity.status(501).build();
    }

    /**
     * 正式结算
     * TODO M5: 实现薪资模块后替换此占位实现
     */
    @PostMapping("/cycles/{id}/settle")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<?> settleCycle(@PathVariable Long id) {
        return ResponseEntity.status(501).build();
    }

    /**
     * 获取工资单列表
     * TODO M5: 实现薪资模块后替换此占位实现
     */
    @GetMapping("/slips")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','CEO')")
    public ResponseEntity<List<?>> listSlips(
            @RequestParam(required = false) Long cycleId,
            Authentication authentication) {
        return ResponseEntity.status(501).build();
    }

    /**
     * 获取工资单详情
     * TODO M5: 实现薪资模块后替换此占位实现
     */
    @GetMapping("/slips/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER','FINANCE','CEO')")
    public ResponseEntity<?> getSlip(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.status(501).build();
    }

    /**
     * 确认工资单
     * TODO M5: 实现薪资模块后替换此占位实现
     */
    @PostMapping("/slips/{id}/confirm")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER')")
    public ResponseEntity<?> confirmSlip(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.status(501).build();
    }

    /**
     * 工资异议
     * TODO M5: 实现薪资模块后替换此占位实现
     */
    @PostMapping("/slips/{id}/dispute")
    @PreAuthorize("hasAnyRole('EMPLOYEE','WORKER')")
    public ResponseEntity<?> disputeSlip(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.status(501).build();
    }
}
