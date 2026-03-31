package com.oa.backend.controller;

import com.oa.backend.dto.BackupTaskCreateRequest;
import com.oa.backend.dto.BackupTaskResponse;
import com.oa.backend.service.OaDataService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 备份任务控制器
 */
@RestController
@RequestMapping("/backup")
@RequiredArgsConstructor
public class BackupController {

    private final OaDataService oaDataService;

    /**
     * 获取备份任务列表
     * 权限：CEO
     */
    @GetMapping("/tasks")
    public ResponseEntity<List<BackupTaskResponse>> listBackupTasks(Authentication authentication) {
        if (!isCEO(authentication)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(oaDataService.listBackupTasks());
    }

    /**
     * 创建备份任务
     * 权限：CEO
     */
    @PostMapping("/tasks")
    public ResponseEntity<BackupTaskResponse> createBackupTask(
            @Valid @RequestBody BackupTaskCreateRequest request,
            Authentication authentication) {
        if (!isCEO(authentication)) {
            return ResponseEntity.status(403).build();
        }
        BackupTaskResponse response = oaDataService.createBackupTask(
                request.dataScope(), request.scopeId(), request.taskName(),
                request.dataTypes(), request.compress());
        return ResponseEntity.ok(response);
    }

    /**
     * 重试备份任务
     * 权限：CEO
     */
    @PostMapping("/tasks/{id}/retry")
    public ResponseEntity<String> retryBackupTask(
            @PathVariable Long id,
            Authentication authentication) {
        if (!isCEO(authentication)) {
            return ResponseEntity.status(403).build();
        }
        boolean success = oaDataService.retryBackupTask(id);
        if (!success) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok("重试已启动");
    }

    private boolean isCEO(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_CEO".equals(a.getAuthority()));
    }
}
