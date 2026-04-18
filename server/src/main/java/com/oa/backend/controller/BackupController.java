package com.oa.backend.controller;

import com.oa.backend.dto.ExportTaskCreateRequest;
import com.oa.backend.entity.ExportBackupTask;
import com.oa.backend.security.SecurityUtils;
import com.oa.backend.service.BackupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 备份任务控制器，处理导出备份任务的查询。
 * <p>
 * 用户只能查看自己发起的导出任务。
 *
 * @author OA Backend Team
 * @since 1.0
 */
@RestController
@RequestMapping("/export-tasks")
@RequiredArgsConstructor
public class BackupController {

    private final BackupService backupService;

    /**
     * 获取当前用户的导出任务列表。
     * <p>
     * 返回当前登录用户发起的所有导出备份任务，按创建时间降序排列。
     *
     * @param authentication 当前用户认证信息
     * @return 导出任务列表
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> listExportTasks(Authentication authentication) {
        Long initiatorId = SecurityUtils.getCurrentEmployeeId(authentication);
        if (initiatorId == null) {
            return ResponseEntity.status(403).body(Map.of("message", "无法识别当前用户"));
        }

        List<ExportBackupTask> tasks = backupService.listExportTasksByInitiator(initiatorId);
        return ResponseEntity.ok(tasks);
    }

    /**
     * 创建新的数据导出任务（仅 CEO 可操作）。
     * <p>
     * 接受起止日期参数（startDate/endDate），创建状态为 PENDING 的导出任务。
     * 日期参数不落库，任务具体执行由后台进程负责。
     *
     * @param req            包含 startDate / endDate 的创建请求
     * @param authentication 当前用户认证信息
     * @return 201 + 已创建的任务实体；403 若无法识别用户
     */
    @PostMapping
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<?> createExportTask(
            @RequestBody ExportTaskCreateRequest req,
            Authentication authentication) {
        Long initiatorId = SecurityUtils.getCurrentEmployeeId(authentication);
        if (initiatorId == null) {
            return ResponseEntity.status(403).body(Map.of("message", "无法识别当前用户"));
        }
        ExportBackupTask task = backupService.createExportTask(initiatorId, req);
        return ResponseEntity.status(201).body(task);
    }
}
