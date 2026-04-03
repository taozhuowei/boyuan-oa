package com.oa.backend.dto;

/**
 * 部门响应 DTO
 */
public record DepartmentResponse(
    Long id,
    String name,
    Long parentId,
    Integer sort
) {}
