import { request } from './http'
import type { SessionUser } from './access'

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

const officeFormOptions: FormTypeOption[] = [
  { code: 'LEAVE', name: '请假申请', description: '处理年假、事假、病假等请休假单据。', icon: 'schedule' },
  { code: 'OVERTIME', name: '加班申请', description: '登记项目赶工、临时支援和加班补贴依据。', icon: 'work' }
]

const laborExtraFormOptions: FormTypeOption[] = [
  { code: 'INJURY', name: '工伤补偿', description: '记录工伤情况并提交补偿审批。', icon: 'warning' },
  { code: 'LOG', name: '施工日志', description: '沉淀现场进度、天气、问题与施工内容。', icon: 'assignment' }
]

function resolveSubmitPath(formType: string) {
  switch (formType) {
    case 'LEAVE':
      return 'leave'
    case 'OVERTIME':
      return 'overtime'
    case 'INJURY':
      return 'injury'
    case 'LOG':
      return 'log'
    default:
      return 'leave'
  }
}

export function getAvailableFormOptions(user: SessionUser | null): FormTypeOption[] {
  if (!user) {
    return officeFormOptions
  }

  const isWorker =
    user.role === 'worker' ||
    user.employeeType === 'LABOR' ||
    user.employeeType === '劳工'

  return isWorker ? [...officeFormOptions, ...laborExtraFormOptions] : officeFormOptions
}

export async function fetchFormConfig(formType: string): Promise<FormConfig> {
  return request<FormConfig>({
    url: `/forms/config?formType=${encodeURIComponent(formType)}`,
    method: 'GET'
  })
}

export async function fetchTodoForms(): Promise<FormRecord[]> {
  return request<FormRecord[]>({
    url: '/forms/todo',
    method: 'GET'
  })
}

export async function fetchFormHistory(): Promise<FormRecord[]> {
  return request<FormRecord[]>({
    url: '/forms/history',
    method: 'GET'
  })
}

export async function fetchFormDetail(id: number): Promise<FormRecord> {
  return request<FormRecord>({
    url: `/forms/${id}`,
    method: 'GET'
  })
}

export async function submitForm(
  formType: string,
  formData: Record<string, unknown>,
  remark: string
): Promise<FormRecord> {
  return request<FormRecord>({
    url: `/forms/${resolveSubmitPath(formType)}`,
    method: 'POST',
    data: {
      formType,
      formData,
      remark
    }
  })
}

export async function approveFormRecord(id: number, comment: string): Promise<FormRecord> {
  return request<FormRecord>({
    url: `/forms/${id}/approve`,
    method: 'POST',
    data: {
      action: 'APPROVE',
      comment
    }
  })
}

export async function rejectFormRecord(id: number, comment: string): Promise<FormRecord> {
  return request<FormRecord>({
    url: `/forms/${id}/reject`,
    method: 'POST',
    data: {
      action: 'REJECT',
      comment
    }
  })
}
