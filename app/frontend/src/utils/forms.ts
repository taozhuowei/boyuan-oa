import type { SessionUser } from './access'

const apiBaseUrl = 'http://localhost:8080/api'

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

function getUniInstance() {
  return typeof uni === 'undefined' ? null : uni
}

function request<T>(options: {
  url: string
  method?: 'GET' | 'POST'
  data?: unknown
  token?: string
}): Promise<T> {
  const uniInstance = getUniInstance()

  if (!uniInstance) {
    return Promise.reject(new Error('当前环境不可调用接口'))
  }

  return new Promise((resolve, reject) => {
    uniInstance.request({
      url: options.url,
      method: options.method ?? 'GET',
      data: options.data as string | Record<string, unknown> | ArrayBuffer | undefined,
      header: options.token ? { Authorization: `Bearer ${options.token}` } : undefined,
      success: (response) => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data as T)
          return
        }

        reject(new Error('表单接口请求失败'))
      },
      fail: () => reject(new Error('表单接口请求失败'))
    })
  })
}

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

export async function fetchFormConfig(formType: string, token?: string): Promise<FormConfig> {
  return request<FormConfig>({
    url: `${apiBaseUrl}/forms/config?formType=${encodeURIComponent(formType)}`,
    method: 'GET',
    token
  })
}

export async function fetchTodoForms(token?: string): Promise<FormRecord[]> {
  return request<FormRecord[]>({
    url: `${apiBaseUrl}/forms/todo`,
    method: 'GET',
    token
  })
}

export async function fetchFormHistory(token?: string): Promise<FormRecord[]> {
  return request<FormRecord[]>({
    url: `${apiBaseUrl}/forms/history`,
    method: 'GET',
    token
  })
}

export async function fetchFormDetail(id: number, token?: string): Promise<FormRecord> {
  return request<FormRecord>({
    url: `${apiBaseUrl}/forms/${id}`,
    method: 'GET',
    token
  })
}

export async function submitForm(
  formType: string,
  formData: Record<string, unknown>,
  remark: string,
  token?: string
): Promise<FormRecord> {
  return request<FormRecord>({
    url: `${apiBaseUrl}/forms/${resolveSubmitPath(formType)}`,
    method: 'POST',
    data: {
      formType,
      formData,
      remark
    },
    token
  })
}

export async function approveFormRecord(id: number, comment: string, token?: string): Promise<FormRecord> {
  return request<FormRecord>({
    url: `${apiBaseUrl}/forms/${id}/approve`,
    method: 'POST',
    data: {
      action: 'APPROVE',
      comment
    },
    token
  })
}

export async function rejectFormRecord(id: number, comment: string, token?: string): Promise<FormRecord> {
  return request<FormRecord>({
    url: `${apiBaseUrl}/forms/${id}/reject`,
    method: 'POST',
    data: {
      action: 'REJECT',
      comment
    },
    token
  })
}
