package com.oa.backend.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * 数据保留策略响应 DTO
 */
public record RetentionPolicyResponse(
    Long id,
    String dataCategory,
    String categoryName,
    Integer defaultDays,
    Integer currentDays,
    Boolean canExtend,
    Integer maxExtendDays,
    LocalDate nextCleanupDate,
    List<CategoryRule> overrideRules
) {
    public record CategoryRule(
        String subCategory,
        Integer days,
        String description
    ) {
    }
}
