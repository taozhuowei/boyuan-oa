package com.oa.backend.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * 项目响应 DTO
 */
public record ProjectResponse(
    Long id,
    String projectNo,
    String name,
    String description,
    String department,
    String manager,
    LocalDate startDate,
    LocalDate endDate,
    String status,
    List<String> members,
    Double progress
) {
}
