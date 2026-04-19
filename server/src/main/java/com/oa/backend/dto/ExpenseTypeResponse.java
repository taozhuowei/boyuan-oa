package com.oa.backend.dto;

import java.math.BigDecimal;

/** 费用类型响应 */
public record ExpenseTypeResponse(
    Long id,
    String code,
    String name,
    String description,
    Boolean requireInvoice,
    BigDecimal dailyLimit,
    Integer displayOrder) {}
