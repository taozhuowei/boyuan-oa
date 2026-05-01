/**
 * 表单字段标签映射工具
 *
 * 模块职责：
 * - 提供表单字段英文名到中文标签的映射
 * - 提供枚举值（如请假类型、加班类型）到中文描述的映射
 * - 统一处理表单数据显示，避免暴露英文字段名
 */

/** 表单字段名到中文标签的映射（通用字段） */
export const FIELD_LABELS: Record<string, string> = {
  startDate: '开始日期',
  endDate: '结束日期',
  startTime: '开始时间',
  endTime: '结束时间',
  date: '日期',
  days: '天数',
  hours: '小时数',
  reason: '原因',
  content: '内容',
  remark: '备注',
  submitTime: '提交时间',
  status: '状态',
  employeeId: '员工ID',
  departmentId: '部门ID',
  department: '部门',
  applicant: '申请人',
  submitter: '提交人',
  approver: '审批人',
}

/**
 * 获取字段的中文标签
 * @param fieldCode 字段英文名（如 startDate）
 * @returns 中文标签（如 "开始日期"），未找到时返回原值
 */
export function getFieldLabel(fieldCode: string): string {
  return FIELD_LABELS[fieldCode] || fieldCode
}
