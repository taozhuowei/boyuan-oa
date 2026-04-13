package com.oa.backend.dto;

/**
 * 表单审批请求 DTO
 * action 字段保留但不校验 — 各控制器根据路径硬编码 APPROVE/REJECT，不依赖客户端传入
 */
public record FormApprovalRequest(
    String action,
    String comment
) {
}
