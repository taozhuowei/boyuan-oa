package com.oa.backend.controller;

import com.oa.backend.dto.UserProfileResponse;
import com.oa.backend.dto.WorkbenchConfigResponse;
import com.oa.backend.service.WorkbenchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 工作台控制器。
 * 仅负责 HTTP 请求分发与响应包装，业务逻辑委托给 {@link WorkbenchService}。
 */
@RestController
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class WorkbenchController {

    private final WorkbenchService workbenchService;

    @GetMapping("/me/profile")
    public ResponseEntity<UserProfileResponse> getMyProfile(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(workbenchService.buildUserProfile(authentication));
    }

    @GetMapping("/workbench/config")
    public ResponseEntity<WorkbenchConfigResponse> getWorkbenchConfig(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(workbenchService.buildWorkbenchConfig(authentication));
    }

    @GetMapping("/workbench/summary")
    public ResponseEntity<?> getWorkbenchSummary(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("message", "未登录"));
        }
        WorkbenchService.WorkbenchSummary summary = workbenchService.buildWorkbenchSummary(authentication);
        if (summary == null) {
            return ResponseEntity.status(403).body(Map.of("message", "无法识别当前用户"));
        }
        return ResponseEntity.ok(summary);
    }
}
