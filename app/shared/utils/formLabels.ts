/**
 * 表单字段标签映射工具
 *
 * 模块职责：
 * - 提供表单字段英文名到中文标签的映射
 * - 提供枚举值（如请假类型、加班类型）到中文描述的映射
 * - 统一处理表单数据显示，避免暴露英文字段名
 */

/** 表单字段名到中文标签的映射 */
export const FIELD_LABELS: Record<string, string> = {
  // 通用字段
  leaveType: '请假类型',
  overtimeType: '加班类型',
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
  // 报销相关
  expenseType: '报销类型',
  tripStartDate: '出差开始日期',
  tripEndDate: '出差结束日期',
  tripDestination: '出差目的地',
  tripPurpose: '出差事由',
  totalAmount: '报销总金额',
  invoicesJson: '发票信息',
  // 工伤相关
  injuryDate: '受伤日期',
  injuryLocation: '受伤地点',
  injuryDescription: '受伤描述',
  // 项目相关
  projectId: '项目ID',
  projectName: '项目名称',
  // 加班通知相关
  overtimeDate: '加班日期',
  // 薪资相关
  baseSalary: '基本工资',
  performanceBonus: '绩效奖金',
  socialInsurance: '社保',
  // 其他
  employeeId: '员工ID',
  departmentId: '部门ID',
  department: '部门',
  applicant: '申请人',
  submitter: '提交人',
  approver: '审批人',
}

/** 请假类型枚举值到中文的映射 */
export const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: '年假',
  annual: '年假',
  PERSONAL: '事假',
  personal: '事假',
  SICK: '病假',
  sick: '病假',
  MARRIAGE: '婚假',
  marriage: '婚假',
  MATERNITY: '产假',
  maternity: '产假',
  事假: '事假',
  病假: '病假',
  年假: '年假',
  婚假: '婚假',
  产假: '产假',
}

/** 加班类型枚举值到中文的映射 */
export const OVERTIME_TYPE_LABELS: Record<string, string> = {
  WEEKDAY: '工作日加班',
  weekday: '工作日加班',
  WEEKEND: '周末加班',
  weekend: '周末加班',
  HOLIDAY: '节假日加班',
  holiday: '节假日加班',
  工作日加班: '工作日加班',
  周末加班: '周末加班',
  节假日加班: '节假日加班',
}

/**
 * 获取字段的中文标签
 * @param fieldCode 字段英文名（如 leaveType）
 * @returns 中文标签（如 "请假类型"），未找到时返回原值
 */
export function getFieldLabel(fieldCode: string): string {
  return FIELD_LABELS[fieldCode] || fieldCode
}

/**
 * 获取请假类型的中文描述
 * @param value 请假类型值（如 ANNUAL）
 * @returns 中文描述（如 "年假"），未找到时返回原值
 */
export function getLeaveTypeLabel(value: string | undefined | null): string {
  if (!value) return ''
  return LEAVE_TYPE_LABELS[value] || value
}

/**
 * 获取加班类型的中文描述
 * @param value 加班类型值（如 WEEKDAY）
 * @returns 中文描述（如 "工作日加班"），未找到时返回原值
 */
export function getOvertimeTypeLabel(value: string | undefined | null): string {
  if (!value) return ''
  return OVERTIME_TYPE_LABELS[value] || value
}

/**
 * 格式化表单数据摘要（用于列表显示）
 * @param formType 表单类型（LEAVE, OVERTIME 等）
 * @param formData 表单数据对象
 * @returns 格式化的摘要字符串
 */
export function formatFormSummary(
  formType: string,
  formData: Record<string, unknown> | undefined
): string {
  const d = formData ?? {}

  if (formType === 'LEAVE') {
    const typeLabel = getLeaveTypeLabel(String(d.leaveType || ''))
    const days = d.days ?? ''
    if (!typeLabel && !days) return ''
    return `${typeLabel} ${days}天`.trim()
  }

  if (formType === 'OVERTIME') {
    const typeLabel = getOvertimeTypeLabel(String(d.overtimeType || ''))
    const hours = d.hours ?? ''
    const startTime = d.startTime ?? ''
    const endTime = d.endTime ?? ''
    if (!typeLabel && !hours && !startTime && !endTime) return ''
    if (hours) {
      return `${typeLabel} ${hours}小时`.trim()
    }
    if (startTime && endTime) {
      return `${typeLabel} ${startTime}~${endTime}`.trim()
    }
    return typeLabel
  }

  if (formType === 'EXPENSE') {
    const typeLabel = EXPENSE_TYPE_LABELS[String(d.expenseType || '')] || String(d.expenseType || '')
    const amount = d.totalAmount ?? ''
    if (!typeLabel && !amount) return ''
    return `${typeLabel} ¥${amount}`.trim()
  }

  return ''
}

/** 报销类型枚举值到中文的映射 */
export const EXPENSE_TYPE_LABELS: Record<string, string> = {
  TRAVEL: '差旅费',
  travel: '差旅费',
  MEAL: '餐饮费',
  meal: '餐饮费',
  ACCOMMODATION: '住宿费',
  accommodation: '住宿费',
  TRANSPORT: '交通费',
  transport: '交通费',
  OFFICE: '办公用品',
  office: '办公用品',
  OTHER: '其他',
  other: '其他',
}

/**
 * 获取报销类型的中文描述
 * @param value 报销类型值（如 TRAVEL）
 * @returns 中文描述（如 "差旅费"），未找到时返回原值
 */
export function getExpenseTypeLabel(value: string | undefined | null): string {
  if (!value) return ''
  return EXPENSE_TYPE_LABELS[value] || value
}
