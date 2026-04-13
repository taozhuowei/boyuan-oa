package com.oa.backend.dto;

import java.math.BigDecimal;

/**
 * 岗位创建/更新请求 DTO
 */
public record PositionUpsertRequest(
    String positionName,
    String employeeCategory,
    String defaultRoleCode,
    BigDecimal baseSalary,
    String overtimeBaseType,
    BigDecimal overtimeBaseAmount,
    BigDecimal overtimeRateWeekday,
    BigDecimal overtimeRateWeekend,
    BigDecimal overtimeRateHoliday,
    BigDecimal defaultPerformanceBonus,
    Integer annualLeave,
    String leaveDeductBaseType,
    String socialInsuranceMode,
    Boolean requiresConstructionLog,
    Boolean hasPerformanceBonus
) {}
