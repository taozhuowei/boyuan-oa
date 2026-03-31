package com.oa.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 备份任务响应 DTO
 */
public record BackupTaskResponse(
    Long id,
    String taskNo,
    String taskName,
    String dataScope,
    String status,
    Integer totalPackages,
    Integer completedPackages,
    Boolean compressed,
    Long fileSize,
    String downloadUrl,
    LocalDateTime expireTime,
    Integer retryCount,
    String errorMessage,
    LocalDateTime createdAt,
    LocalDateTime completedAt
) {
}
