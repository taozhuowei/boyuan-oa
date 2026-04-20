/**
 * 破坏性操作注册表
 *
 * 职责：维护应用中所有破坏性操作（删除/禁用）的清单，
 * 确保每个操作在执行前都有确认步骤（popconfirm 或 modal）。
 * 新增破坏性操作必须在本文件注册，否则安全测试会因注册表与实际不符而失败。
 */

export interface DestructiveAction {
  /** 测试描述 */
  name: string
  /** 所在页面路由 */
  pagePath: string
  /** 需要的登录角色 */
  role: 'ceo' | 'hr' | 'finance' | 'pm' | 'employee' | 'worker' | 'dept_manager'
  /** 触发按钮的 data-catch 或 CSS 选择器 */
  triggerSelector: string
  /** 确认弹窗类型 */
  confirmationType: 'popconfirm' | 'modal'
  /** 确认元素选择器（弹窗内的确认按钮） */
  confirmSelector: string
  /** 不应在确认前被调用的 API URL 模式 */
  blockedEndpoint: string
}

export const DESTRUCTIVE_ACTIONS: DestructiveAction[] = [
  {
    name: '禁用员工',
    pagePath: '/employees',
    role: 'ceo',
    triggerSelector: '[data-catch="employee-disable-btn"]',
    confirmationType: 'modal',
    confirmSelector: '[data-catch="disable-confirm-ok"]',
    blockedEndpoint: '**/api/employees/*/disable'
  },
  {
    name: '删除岗位',
    pagePath: '/positions',
    role: 'hr',
    triggerSelector: '[data-catch^="positions-row-delete-btn-"]',
    confirmationType: 'popconfirm',
    confirmSelector: '.ant-popconfirm .ant-btn-dangerous',
    blockedEndpoint: '**/api/positions/**'
  },
  {
    name: '删除角色',
    pagePath: '/role',
    role: 'ceo',
    triggerSelector: '[data-catch^="role-row-delete-btn-"]',
    confirmationType: 'popconfirm',
    confirmSelector: '.ant-popconfirm .ant-btn-dangerous',
    blockedEndpoint: '**/api/roles/**'
  },
  {
    name: '删除假期类型',
    pagePath: '/leave_types',
    role: 'hr',
    triggerSelector: 'text=删除',
    confirmationType: 'popconfirm',
    confirmSelector: '.ant-popconfirm .ant-btn-dangerous',
    blockedEndpoint: '**/api/config/leave-types/**'
  },
  {
    name: '关闭项目',
    pagePath: '/projects',
    role: 'ceo',
    triggerSelector: '[data-catch^="project-row-close-btn-"]',
    confirmationType: 'popconfirm',
    confirmSelector: '.ant-popconfirm .ant-btn-dangerous',
    blockedEndpoint: '**/api/projects/*/close'
  },
  {
    name: '删除补贴/扣款项',
    pagePath: '/allowances',
    role: 'ceo',
    triggerSelector: '[data-catch="allowances-create-btn"]',
    confirmationType: 'popconfirm',
    confirmSelector: '.ant-popconfirm .ant-btn-dangerous',
    blockedEndpoint: '**/api/allowances/**'
  }
]
