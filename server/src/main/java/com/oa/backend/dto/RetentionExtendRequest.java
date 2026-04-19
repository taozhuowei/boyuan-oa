package com.oa.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** 数据保留延期请求 DTO */
public record RetentionExtendRequest(
    @NotNull(message = "策略ID不能为空") Long policyId,
    @Min(value = 1, message = "延期天数至少1天") @Max(value = 365, message = "延期天数最多365天")
        Integer extendDays,
    String reason) {}
