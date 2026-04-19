package com.oa.backend.dto;

/**
 * 工作台摘要响应 DTO。 聚合当前登录用户与其角色相关的首页卡片数据： - pendingApprovalCount：待我审批/我发起的待办数量（按角色语义不同） -
 * payrollStatus：最新薪资周期状态，仅对具备财务访问权限的用户填充 - activeProjectCount：当前进行中的项目数量，仅对 ceo / project_manager
 * 填充 - retentionAlertCount：待处理的留存提醒数量，仅对 ceo 填充 - unreadNotificationCount：当前用户未读通知数
 * 对不具备查看权限的角色，相应字段返回 null，前端据此隐藏卡片。
 */
public record WorkbenchSummaryResponse(
    Integer pendingApprovalCount,
    String payrollStatus,
    Integer activeProjectCount,
    Integer retentionAlertCount,
    Integer unreadNotificationCount) {}
