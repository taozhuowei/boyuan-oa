package com.oa.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 报销明细 DTO
 */
public record ExpenseItemDto(
    Long id,
    String itemType,
    LocalDate expenseDate,
    BigDecimal amount,
    String invoiceNo,
    String description,
    Long attachmentId
) {}
