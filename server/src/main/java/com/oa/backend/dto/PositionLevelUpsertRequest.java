package com.oa.backend.dto;

import java.math.BigDecimal;

/** 岗位等级创建/更新请求 DTO */
public record PositionLevelUpsertRequest(
    String levelName,
    Integer levelOrder,
    BigDecimal baseSalaryOverride,
    BigDecimal positionSalaryOverride,
    BigDecimal performanceBonusOverride,
    Integer annualLeaveOverride) {}
