package com.oa.backend.controller;

import com.oa.backend.dto.*;
import com.oa.backend.service.OaDataService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 数据保留控制器
 */
@RestController
@RequestMapping("/retention")
@RequiredArgsConstructor
public class RetentionController {

    private final OaDataService oaDataService;

    /**
     * 获取数据保留策略列表
     * 权限：CEO
     */
    @GetMapping("/policies")
    public ResponseEntity<List<RetentionPolicyResponse>> listRetentionPolicies(Authentication authentication) {
        if (!isCEO(authentication)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(oaDataService.listRetentionPolicies());
    }

    /**
     * 延期数据保留
     * 权限：CEO
     */
    @PostMapping("/policies/extend")
    public ResponseEntity<RetentionPolicyResponse> extendRetentionPolicy(
            @Valid @RequestBody RetentionExtendRequest request,
            Authentication authentication) {
        if (!isCEO(authentication)) {
            return ResponseEntity.status(403).build();
        }
        return oaDataService.extendRetentionPolicy(request.policyId(), request.extendDays())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 获取到期提醒列表
     * 权限：CEO
     */
    @GetMapping("/reminders")
    public ResponseEntity<List<RetentionReminderResponse>> listRetentionReminders(Authentication authentication) {
        if (!isCEO(authentication)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(oaDataService.listRetentionReminders());
    }

    private boolean isCEO(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_CEO".equals(a.getAuthority()));
    }
}
