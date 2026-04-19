package com.oa.backend.dto;

import java.math.BigDecimal;

/** 岗位等级响应 DTO */
public record PositionLevelResponse(
    Long id,
    Long positionId,
    String levelName,
    Integer levelOrder,
    BigDecimal baseSalaryOverride,
    BigDecimal positionSalaryOverride,
    BigDecimal performanceBonusOverride,
    Integer annualLeaveOverride) {}
