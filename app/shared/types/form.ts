/**
 * 表单相关类型定义模块
 *
 * 模块职责：
 * - 提供表单配置、字段、审批流等TypeScript类型定义
 * - 纯类型定义文件，无运行时依赖
 */

export interface FormConfig {
  formType: string
  formName: string
  fields: FormField[]
  actions: FormAction[]
  flow: ApprovalFlow
}

export interface FormField {
  fieldCode: string
  fieldName: string
  fieldType: string
  required: boolean
  defaultValue?: string | null
  options?: string[] | null
  placeholder?: string | null
  order: number
}

export interface FormAction {
  actionCode: string
  actionName: string
  style: string
  requiredRoles: string[]
}

export interface ApprovalFlow {
  type: string
  nodes: FlowNode[]
}

export interface FlowNode {
  nodeCode: string
  nodeName: string
  handlerRole: string
  order: number
}

export interface FormRecord {
  id: number
  formNo: string
  formType: string
  formTypeName: string
  submitter: string
  department: string
  submitTime: string
  status: string
  currentNode: string
  formData: Record<string, unknown>
  history: ApprovalHistory[]
  remark?: string | null
}

export interface ApprovalHistory {
  nodeName: string
  approver: string
  action: string
  comment?: string | null
  time: string
}

export interface FormTypeOption {
  code: string
  name: string
  description: string
  icon?: string
}
