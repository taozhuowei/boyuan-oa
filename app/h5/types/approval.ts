/**
 * approval.ts — 审批相关共享类型定义
 */

/** 审批历史步骤 */
export interface ApprovalStep {
  /** 操作人姓名 — 后端返回字段名为 approver */
  approver?: string
  /** 兼容字段（部分旧代码使用 operator） */
  operator?: string
  /** 节点名称 */
  nodeName?: string
  /** 操作类型：后端返回 APPROVE / REJECT / SKIP / RECALL */
  action: string
  /** 操作时间 ISO 字符串或 yyyy-MM-dd HH:mm:ss */
  time: string
  /** 审批意见（可选） */
  comment?: string
}
