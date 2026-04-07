package com.oa.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 到期提醒响应 DTO
 */
public record RetentionReminderResponse(
    Long id,
    String objectType,
    String objectName,
    Long objectId,
    LocalDate expireDate,
    Integer daysRemaining,
    String urgency,
    String suggestedAction,
    Boolean actionTaken,
    String actionType,
    LocalDateTime reminderTime
) {
}
