package com.oa.backend.dto;

import java.math.BigDecimal;

public record SalaryOverrideRequest(
    BigDecimal baseSalaryOverride,
    BigDecimal performanceBaseOverride,
    String note
) {}
