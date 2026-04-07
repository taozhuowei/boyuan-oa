import { request } from './http'
import type {
  FormConfig,
  FormRecord,
  FormTypeOption
} from '@shared/types'

export type {
  FormConfig,
  FormField,
  FormAction,
  ApprovalFlow,
  FlowNode,
  FormRecord,
  ApprovalHistory,
  FormTypeOption
} from '@shared/types'

export { getAvailableFormOptions } from '@shared/utils'

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
