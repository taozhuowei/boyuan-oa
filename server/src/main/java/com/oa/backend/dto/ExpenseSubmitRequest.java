package com.oa.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 报销申请提交请求
 */
public record ExpenseSubmitRequest(

    @NotBlank(message = "报销类型不能为空")
    String expenseType,

    LocalDate tripStartDate,

    LocalDate tripEndDate,

    String tripDestination,

    String tripPurpose,

    @NotNull(message = "总金额不能为空")
    @Positive(message = "总金额必须大于0")
    BigDecimal totalAmount,

    String invoicesJson,

    Long projectId,

    String remark,

    @NotEmpty(message = "报销明细不能为空")
    @Valid
    List<ExpenseItemDto> items
) {}
