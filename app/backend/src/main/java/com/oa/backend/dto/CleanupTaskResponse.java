package com.oa.backend.dto;

import java.time.LocalDateTime;

/**
 * 清理任务响应 DTO
 */
public record CleanupTaskResponse(
    Long id,
    String taskNo,
    String dataCategory,
    String status,
    Integer targetCount,
    Integer deletedCount,
    Integer failedCount,
    Integer retryCount,
    String errorMessage,
    LocalDateTime scheduledTime,
    LocalDateTime startedAt,
    LocalDateTime completedAt
) {
}
