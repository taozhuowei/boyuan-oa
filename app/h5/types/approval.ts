/**
 * approval.ts — 审批相关共享类型定义
 */

/** 审批历史步骤 */
export interface ApprovalStep {
  /** 操作人姓名 */
  operator: string
  /** 操作类型：提交 / 通过 / 驳回 / 修改 */
  action: string
  /** 操作时间 ISO 字符串或 yyyy-MM-dd HH:mm:ss */
  time: string
  /** 审批意见（可选） */
  comment?: string
}
