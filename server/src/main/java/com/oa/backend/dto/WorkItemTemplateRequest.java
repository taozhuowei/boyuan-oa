package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

/**
 * 工作项模板创建/更新请求 DTO
 */
public record WorkItemTemplateRequest(
        @NotBlank String name,
        Long projectId,
        List<ItemDef> items
) {
    /** 单个工作项定义 */
    public record ItemDef(
            @NotBlank String name,
            String defaultUnit
    ) {}
}
