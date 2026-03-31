package com.oa.backend.controller;

import com.oa.backend.dto.*;
import com.oa.backend.service.OaDataService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<List<RetentionPolicyResponse>> listRetentionPolicies() {
        return ResponseEntity.ok(oaDataService.listRetentionPolicies());
    }

    /**
     * 延期数据保留
     * 权限：CEO
     */
    @PostMapping("/policies/extend")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<RetentionPolicyResponse> extendRetentionPolicy(
            @Valid @RequestBody RetentionExtendRequest request) {
        return oaDataService.extendRetentionPolicy(request.policyId(), request.extendDays())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 获取到期提醒列表
     * 权限：CEO
     */
    @GetMapping("/reminders")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<List<RetentionReminderResponse>> listRetentionReminders() {
        return ResponseEntity.ok(oaDataService.listRetentionReminders());
    }
}
