package com.oa.backend.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 表单审批请求 DTO
 */
public record FormApprovalRequest(
    @NotBlank(message = "审批动作不能为空")
    String action,

    String comment
) {
}
