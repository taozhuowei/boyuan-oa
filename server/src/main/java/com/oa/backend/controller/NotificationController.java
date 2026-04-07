package com.oa.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 通知控制器
 * 当前状态：M7 通知模块未实现，返回 501 占位
 */
@RestController
@RequestMapping("/notifications")
public class NotificationController {

    /**
     * 获取通知列表
     * TODO M7: 实现通知模块后替换此占位实现
     */
    @GetMapping
    public ResponseEntity<List<?>> listNotifications(Authentication authentication) {
        return ResponseEntity.status(501).build();
    }
}
