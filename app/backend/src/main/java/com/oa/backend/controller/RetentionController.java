package com.oa.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 数据保留控制器
 * 当前状态：M10 数据生命周期模块未实现，返回 501 占位
 */
@RestController
@RequestMapping("/retention")
public class RetentionController {

    /**
     * 获取数据保留策略列表
     * TODO M10: 实现数据生命周期模块后替换此占位实现
     */
    @GetMapping("/policies")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<List<?>> listRetentionPolicies() {
        return ResponseEntity.status(501).build();
    }

    /**
     * 延期数据保留
     * TODO M10: 实现数据生命周期模块后替换此占位实现
     */
    @PostMapping("/policies/extend")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<?> extendRetentionPolicy() {
        return ResponseEntity.status(501).build();
    }

    /**
     * 获取到期提醒列表
     * TODO M10: 实现数据生命周期模块后替换此占位实现
     */
    @GetMapping("/reminders")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<List<?>> listRetentionReminders() {
        return ResponseEntity.status(501).build();
    }
}
