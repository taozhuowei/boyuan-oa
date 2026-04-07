package com.oa.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 施工日志系统控制器
 * 当前状态：M3 剩余任务（迁移到 FormService）未完成，返回 501 占位
 * TODO M3: 迁移到 FormService + ApprovalFlowService，参照 AttendanceController 实现
 */
@RestController
@RequestMapping("/logs")
public class WorkLogController {

    /**
     * 获取施工日志表单配置
     * TODO M3: 从 FormService 获取表单配置
     */
    @GetMapping("/config")
    @PreAuthorize("hasRole('WORKER')")
    public ResponseEntity<?> getLogConfig() {
        return ResponseEntity.status(501).build();
    }

    /**
     * 提交施工日志
     * TODO M3: 调用 FormService.submitForm("LOG", ...)
     */
    @PostMapping
    @PreAuthorize("hasRole('WORKER')")
    public ResponseEntity<?> submitLog(@RequestBody Object request, Authentication authentication) {
        return ResponseEntity.status(501).build();
    }

    /**
     * 获取工伤申报表单配置
     * TODO M3: 从 FormService 获取表单配置
     */
    @GetMapping("/injury/config")
    @PreAuthorize("hasRole('WORKER')")
    public ResponseEntity<?> getInjuryConfig() {
        return ResponseEntity.status(501).build();
    }

    /**
     * 提交工伤申报
     * TODO M3: 调用 FormService.submitForm("INJURY", ...)
     */
    @PostMapping("/injury")
    @PreAuthorize("hasRole('WORKER')")
    public ResponseEntity<?> submitInjury(@RequestBody Object request, Authentication authentication) {
        return ResponseEntity.status(501).build();
    }

    /**
     * 获取日志记录列表
     * TODO M3: 通过 FormService 按角色范围查询
     */
    @GetMapping("/records")
    @PreAuthorize("hasAnyRole('WORKER','PROJECT_MANAGER')")
    public ResponseEntity<List<?>> getRecords(Authentication authentication) {
        return ResponseEntity.status(501).build();
    }

    /**
     * 获取待审批列表
     * TODO M3: 通过 ApprovalFlowService 查询待办
     */
    @GetMapping("/todo")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<List<?>> getTodoList() {
        return ResponseEntity.status(501).build();
    }

    /**
     * 审批通过
     * TODO M3: 调用 ApprovalFlowService.approve(...)
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<?> approve(@PathVariable Long id, @RequestBody Object request, Authentication authentication) {
        return ResponseEntity.status(501).build();
    }

    /**
     * 审批驳回
     * TODO M3: 调用 ApprovalFlowService.reject(...)
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody Object request, Authentication authentication) {
        return ResponseEntity.status(501).build();
    }
}
