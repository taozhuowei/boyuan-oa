package com.oa.backend.dto;

import java.time.LocalDate;

/**
 * 员工更新请求 DTO
 */
public record EmployeeUpdateRequest(
    String name,
    String phone,
    String email,
    String roleCode,
    String employeeType,
    Long departmentId,
    Long positionId,
    Long levelId,
    Long directSupervisorId,
    String accountStatus,
    LocalDate leaveDate
) {}
