package com.oa.backend.dto;

import java.time.LocalDate;

/**
 * 项目创建请求 DTO
 */
public record ProjectCreateRequest(
    String name,          // required
    LocalDate startDate,  // optional
    Integer logCycleDays  // default 1
) {}
