package com.oa.backend.dto;

import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** 员工更新请求 DTO — C+-F-08 phone 加手机号格式校验；C+-F-16 移除 employeeType 字段 */
public record EmployeeUpdateRequest(
    String name,
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确") String phone,
    String email,
    String roleCode,
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
    List<EmergencyContactRequest> emergencyContacts,
    String gender,
    String idCardNo,
    java.time.LocalDate birthDate) {
  public record EmergencyContactRequest(String name, String phone, String address) {}
}
