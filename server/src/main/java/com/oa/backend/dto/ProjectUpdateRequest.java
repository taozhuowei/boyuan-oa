package com.oa.backend.dto;

import java.time.LocalDate;

/** 项目更新请求 DTO */
public record ProjectUpdateRequest(
    String name,
    LocalDate startDate,
    LocalDate actualEndDate,
    Integer logCycleDays,
    Integer logReportCycleDays,
    String contractNo,
    Long contractAttachmentId,
    String clientName,
    String projectDescription) {}
