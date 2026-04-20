package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** 员工创建请求 DTO — C+-F-08 phone 加手机号格式校验 */
public record EmployeeCreateRequest(
    @NotBlank(message = "姓名不能为空") String name,
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确") String phone,
    String email,
    @NotBlank(message = "角色不能为空") String roleCode,
    @NotBlank(message = "员工类型不能为空") String employeeType,
    @NotNull(message = "部门不能为空") Long departmentId,
    Long positionId,
    Long levelId,
    Long directSupervisorId,
    @NotNull(message = "入职日期不能为空") LocalDate entryDate,
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
