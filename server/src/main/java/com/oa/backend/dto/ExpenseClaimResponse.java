package com.oa.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** 报销详情响应 */
public record ExpenseClaimResponse(
    Long id,
    Long formId,
    Long employeeId,
    String employeeName,
    String expenseType,
    String expenseTypeName,
    LocalDate tripStartDate,
    LocalDate tripEndDate,
    String tripDestination,
    String tripPurpose,
    BigDecimal totalAmount,
    String invoicesJson,
    Long projectId,
    String projectName,
    Boolean includedInPayroll,
    String remark,
    LocalDateTime createdAt,
    List<ExpenseItemDto> items) {}
