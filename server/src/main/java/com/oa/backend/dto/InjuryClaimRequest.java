package com.oa.backend.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 工伤理赔录入请求 DTO（财务专用）
 * 注意：理赔金额由财务录入，不由申请人填写
 */
public record InjuryClaimRequest(
        @NotNull Long formRecordId,
        Long employeeId,
        @NotNull LocalDate injuryDate,
        String injuryDescription,
        @NotNull BigDecimal compensationAmount,
        String financeNote
) {}
