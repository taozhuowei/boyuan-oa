package com.oa.backend.dto;

import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;

/** 报销明细 DTO — C+-F-09 amount 加正数校验 */
public record ExpenseItemDto(
    Long id,
    String itemType,
    LocalDate expenseDate,
    @Positive(message = "明细金额必须大于0") BigDecimal amount,
    String invoiceNo,
    String description,
    Long attachmentId) {}
