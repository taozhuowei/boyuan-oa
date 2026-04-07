package com.oa.backend.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * 岗位响应 DTO
 */
public record PositionResponse(
    Long id,
    String positionCode,
    String positionName,
    String employeeCategory,
    String defaultRoleCode,
    BigDecimal baseSalary,
    BigDecimal overtimeRateWeekday,
    BigDecimal overtimeRateWeekend,
    BigDecimal overtimeRateHoliday,
    BigDecimal defaultPerformanceBonus,
    Integer annualLeave,
    String leaveDeductBaseType,
    String socialInsuranceMode,
    Boolean requiresConstructionLog,
    Boolean hasPerformanceBonus,
    List<PositionLevelResponse> levels,
    List<SocialInsuranceItemResponse> socialInsuranceItems
) {}
