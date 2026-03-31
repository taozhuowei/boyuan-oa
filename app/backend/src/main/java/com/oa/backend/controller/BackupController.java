package com.oa.backend.controller;

import com.oa.backend.dto.BackupTaskCreateRequest;
import com.oa.backend.dto.BackupTaskResponse;
import com.oa.backend.service.OaDataService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<List<BackupTaskResponse>> listBackupTasks() {
        return ResponseEntity.ok(oaDataService.listBackupTasks());
    }

    /**
     * 创建备份任务
     * 权限：CEO
     */
    @PostMapping("/tasks")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<BackupTaskResponse> createBackupTask(
            @Valid @RequestBody BackupTaskCreateRequest request) {
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
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<String> retryBackupTask(@PathVariable Long id) {
        boolean success = oaDataService.retryBackupTask(id);
        if (!success) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok("重试已启动");
    }
}
