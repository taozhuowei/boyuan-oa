package com.oa.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 员工响应 DTO
 */
public record EmployeeResponse(
    Long id,
    String employeeNo,
    String name,
    String phone,
    String email,
    String roleCode,
    String roleName,
    String employeeType,
    Long departmentId,
    String departmentName,
    Long positionId,
    Long levelId,
    Long directSupervisorId,
    String accountStatus,
    LocalDate entryDate,
    LocalDate leaveDate,
    Boolean isDefaultPassword,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
