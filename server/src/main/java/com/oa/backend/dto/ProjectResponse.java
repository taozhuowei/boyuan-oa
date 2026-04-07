package com.oa.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 项目响应 DTO
 */
public record ProjectResponse(
    Long id,
    String name,
    String status,         // "ACTIVE" | "CLOSED"
    LocalDate startDate,
    LocalDate actualEndDate,
    Integer logCycleDays,
    Integer logReportCycleDays,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    int memberCount,
    List<ProjectMemberInfo> members
) {
    /**
     * 项目成员信息
     */
    public record ProjectMemberInfo(
        Long employeeId,
        String employeeNo,
        String name,
        String role   // "PM" | "MEMBER"
    ) {}
}
