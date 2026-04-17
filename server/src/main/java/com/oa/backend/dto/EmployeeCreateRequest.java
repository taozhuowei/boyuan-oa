package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

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
    @NotNull LocalDate entryDate,
    Integer socialSeniority,
    String contractType,
    BigDecimal dailySubsidy,
    BigDecimal expenseLimit,
    BigDecimal performanceRatio,
    List<EmergencyContactRequest> emergencyContacts,
    String gender,
    String idCardNo,
    java.time.LocalDate birthDate
) {
    public record EmergencyContactRequest(String name, String phone, String address) {}
}
