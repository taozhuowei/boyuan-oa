package com.oa.backend.dto;

import java.math.BigDecimal;

/**
 * 社保项目响应 DTO
 */
public record SocialInsuranceItemResponse(
    Long id,
    Long positionId,
    String name,
    BigDecimal employeeRate,
    BigDecimal companyRate,
    Boolean isEnabled,
    Integer displayOrder
) {}
