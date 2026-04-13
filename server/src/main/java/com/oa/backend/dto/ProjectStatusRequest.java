package com.oa.backend.dto;

/**
 * 项目状态更新请求 DTO
 */
public record ProjectStatusRequest(
    String status  // "ACTIVE" | "CLOSED"
) {}
