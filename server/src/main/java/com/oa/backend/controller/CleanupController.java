package com.oa.backend.controller;

import com.oa.backend.entity.CleanupTask;
import com.oa.backend.service.CleanupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 清理任务控制器，处理数据清理任务的查询。
 * <p>
 * 仅限 CEO 角色访问，用于查看系统数据清理历史记录。
 *
 * @author OA Backend Team
 * @since 1.0
 */
@RestController
@RequestMapping("/cleanup-tasks")
@RequiredArgsConstructor
public class CleanupController {

    private final CleanupService cleanupService;

    /**
     * 获取所有清理任务列表。
     * <p>
     * 返回系统中所有的数据清理任务记录，包括任务状态、删除记录数等信息。
     * 按创建时间降序排列。
     *
     * @return 清理任务列表
     */
    @GetMapping
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<List<CleanupTask>> listCleanupTasks() {
        return ResponseEntity.ok(cleanupService.listAllCleanupTasks());
    }
}
