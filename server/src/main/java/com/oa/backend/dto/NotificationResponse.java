package com.oa.backend.dto;

import java.time.LocalDateTime;

/**
 * 通知响应 DTO
 */
public record NotificationResponse(
    Long id,
    String type,
    String title,
    String content,
    String sender,
    LocalDateTime sendTime,
    Boolean read,
    LocalDateTime readTime,
    String actionType,
    String actionTarget,
    String priority
) {
}
