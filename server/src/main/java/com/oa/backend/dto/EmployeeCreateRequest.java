package com.oa.backend.dto;

import java.time.LocalDate;

/**
 * 员工创建请求 DTO
 */
public record EmployeeCreateRequest(
    String name,
    String phone,
    String email,
    String roleCode,
    String employeeType,
    Long departmentId,
    Long positionId,
    Long levelId,
    Long directSupervisorId,
    LocalDate entryDate
) {}
