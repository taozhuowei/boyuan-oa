package com.oa.backend.dto;

/** 项目成员添加请求 DTO */
public record ProjectMemberRequest(
    Long employeeId, // required
    String role // "PM" | "MEMBER", default "MEMBER"
    ) {}
