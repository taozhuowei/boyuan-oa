package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * 员工创建请求 DTO
 */
public record EmployeeCreateRequest(
    @NotBlank String name,
    String phone,
    String email,
    @NotBlank String roleCode,
    @NotBlank String employeeType,
    @NotNull Long departmentId,
    Long positionId,
    Long levelId,
    Long directSupervisorId,
    @NotNull LocalDate entryDate
) {}
