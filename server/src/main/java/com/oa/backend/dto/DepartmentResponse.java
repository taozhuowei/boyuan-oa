package com.oa.backend.dto;

import java.util.List;

/** 部门响应 DTO（树形结构） */
public record DepartmentResponse(
    Long id,
    String name,
    Long parentId,
    Integer sort,
    Integer employeeCount, // 该部门直属员工数
    List<DepartmentResponse> children // 子部门（树形结构）
    ) {}
