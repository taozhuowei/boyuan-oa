package com.oa.backend.controller;

import com.oa.backend.entity.ExportBackupTask;
import com.oa.backend.mapper.ExportBackupTaskMapper;
import com.oa.backend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
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

    private final ExportBackupTaskMapper exportTaskMapper;

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

        List<ExportBackupTask> tasks = exportTaskMapper.findByInitiatorId(initiatorId);
        return ResponseEntity.ok(tasks);
    }
}
