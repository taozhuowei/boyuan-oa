package com.oa.backend.controller;

import com.oa.backend.dto.NotificationResponse;
import com.oa.backend.service.OaDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 通知控制器
 */
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final OaDataService oaDataService;

    /**
     * 获取通知列表
     * 权限：所有登录用户
     */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> listNotifications(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(oaDataService.listNotifications());
    }
}
