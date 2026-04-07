package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 工资异议请求 DTO
 */
public record PayrollDisputeRequest(
    @NotNull(message = "工资单ID不能为空")
    Long slipId,

    @NotBlank(message = "异议原因不能为空")
    String reason,

    String description
) {
}
