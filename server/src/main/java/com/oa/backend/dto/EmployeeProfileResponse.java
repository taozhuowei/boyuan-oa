package com.oa.backend.dto;

import java.time.LocalDate;

/** 员工档案响应 DTO */
public record EmployeeProfileResponse(
    Long id,
    String employeeNo,
    String name,
    String department,
    String project,
    String employeeType,
    LocalDate hireDate,
    String status,
    String phone,
    String email) {}
