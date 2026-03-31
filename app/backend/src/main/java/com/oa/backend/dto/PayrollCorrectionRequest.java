package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 薪资更正请求 DTO
 */
public record PayrollCorrectionRequest(
    @NotNull(message = "工资周期ID不能为空")
    Long cycleId,

    @NotBlank(message = "更正原因不能为空")
    String reason,

    String scope,

    String adjustmentType
) {
}
