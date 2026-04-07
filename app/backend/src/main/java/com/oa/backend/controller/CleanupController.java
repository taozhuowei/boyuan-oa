package com.oa.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 清理任务控制器
 * 当前状态：M10 数据生命周期模块未实现，返回 501 占位
 */
@RestController
@RequestMapping("/cleanup")
public class CleanupController {

    /**
     * 获取清理任务列表
     * TODO M10: 实现数据生命周期模块后替换此占位实现
     */
    @GetMapping("/tasks")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<List<?>> listCleanupTasks() {
        return ResponseEntity.status(501).build();
    }

    /**
     * 创建清理任务
     * TODO M10: 实现数据生命周期模块后替换此占位实现
     */
    @PostMapping("/tasks")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<?> createCleanupTask(@RequestParam String dataCategory) {
        return ResponseEntity.status(501).build();
    }

    /**
     * 重试清理任务
     * TODO M10: 实现数据生命周期模块后替换此占位实现
     */
    @PostMapping("/tasks/{id}/retry")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<?> retryCleanupTask(@PathVariable Long id) {
        return ResponseEntity.status(501).build();
    }
}
