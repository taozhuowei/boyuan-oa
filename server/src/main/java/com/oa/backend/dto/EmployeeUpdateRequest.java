package com.oa.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

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
    LocalDate leaveDate,
    Integer socialSeniority,
    String contractType,
    BigDecimal dailySubsidy,
    BigDecimal expenseLimit,
    BigDecimal performanceRatio,
    List<EmergencyContactRequest> emergencyContacts
) {
    public record EmergencyContactRequest(String name, String phone, String address) {}
}
