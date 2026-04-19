package com.oa.backend.dto;

/** 部门创建/更新请求 DTO */
public record DepartmentRequest(
    String name, // required
    Long parentId, // null = 顶级部门
    Integer sort // default 0
    ) {}
