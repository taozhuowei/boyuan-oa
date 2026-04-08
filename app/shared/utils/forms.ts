/**
 * 表单工具函数模块（纯函数，无平台依赖）
 *
 * 模块职责：
 * - 提供表单相关的纯工具函数
 * - 零平台依赖，可在任何环境中使用
 */

import type { SessionUser } from '../types'
import type { FormTypeOption } from '../types'

export const officeFormOptions: FormTypeOption[] = [
  { code: 'LEAVE', name: '请假申请', description: '处理年假、事假、病假等请休假单据。', icon: 'schedule' },
  { code: 'OVERTIME', name: '加班申请', description: '登记项目赶工、临时支援和加班补贴依据。', icon: 'work' }
]

export const laborExtraFormOptions: FormTypeOption[] = [
  { code: 'INJURY', name: '工伤补偿', description: '记录工伤情况并提交补偿审批。', icon: 'warning' },
  { code: 'LOG', name: '施工日志', description: '沉淀现场进度、天气、问题与施工内容。', icon: 'assignment' }
]

/**
 * 获取用户可用的表单选项列表
 * @param user - 当前会话用户信息
 * @returns 根据用户角色返回对应的表单选项列表
 */
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
