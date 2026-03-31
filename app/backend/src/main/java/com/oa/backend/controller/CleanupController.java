package com.oa.backend.controller;

import com.oa.backend.dto.CleanupTaskResponse;
import com.oa.backend.service.OaDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 清理任务控制器
 */
@RestController
@RequestMapping("/cleanup")
@RequiredArgsConstructor
public class CleanupController {

    private final OaDataService oaDataService;

    /**
     * 获取清理任务列表
     * 权限：CEO
     */
    @GetMapping("/tasks")
    public ResponseEntity<List<CleanupTaskResponse>> listCleanupTasks(Authentication authentication) {
        if (!isCEO(authentication)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(oaDataService.listCleanupTasks());
    }

    /**
     * 创建清理任务
     * 权限：CEO
     */
    @PostMapping("/tasks")
    public ResponseEntity<CleanupTaskResponse> createCleanupTask(
            @RequestParam String dataCategory,
            Authentication authentication) {
        if (!isCEO(authentication)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(oaDataService.createCleanupTask(dataCategory));
    }

    /**
     * 重试清理任务
     * 权限：CEO
     */
    @PostMapping("/tasks/{id}/retry")
    public ResponseEntity<String> retryCleanupTask(
            @PathVariable Long id,
            Authentication authentication) {
        if (!isCEO(authentication)) {
            return ResponseEntity.status(403).build();
        }
        boolean success = oaDataService.retryCleanupTask(id);
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
