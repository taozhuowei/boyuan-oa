/**
 * TC-POS-01: CEO creates a new position
 * Purpose: Verify CEO can create a new position successfully
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-POS-01',
  title: 'CEO creates a new position',
  module: 'position',
  priority: 'P0',
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'ceo.demo' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Assert dashboard loaded', action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
    { id: 6, desc: 'Navigate to position management', action: 'navigate', to: '/positions' },
    { id: 7, desc: 'Assert position page loaded', action: 'assert', check: { type: 'text_visible', value: '岗位管理' } },
    { id: 8, desc: 'Click add position button', action: 'click', locator: { by: 'role', role: 'button', name: '新增岗位' } },
    { id: 9, desc: 'Fill position name', action: 'fill', locator: { by: 'label', value: '岗位名称' }, value: '测试岗位-自动化' },
    { id: 10, desc: 'Select employee category', action: 'select', locator: { by: 'label', value: '员工类型' }, value: 'OFFICE' },
    { id: 11, desc: 'Fill default role code', action: 'fill', locator: { by: 'label', value: '默认角色' }, value: 'employee' },
    { id: 12, desc: 'Fill base salary', action: 'fill', locator: { by: 'label', value: '基本工资' }, value: '5000' },
    { id: 13, desc: 'Select social insurance mode', action: 'select', locator: { by: 'label', value: '社保模式' }, value: 'COMPANY_PAID' },
    { id: 14, desc: 'Fill annual leave', action: 'fill', locator: { by: 'label', value: '年假天数' }, value: '10' },
    { id: 15, desc: 'Click save button', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 16, desc: 'Assert success toast', action: 'assert', check: { type: 'text_visible', value: '成功' } },
    { id: 17, desc: 'Assert new position in list', action: 'assert', check: { type: 'text_visible', value: '测试岗位-自动化' } },
  ],
  expect: {
    result: 'pass',
    url: '/positions',
  },
} satisfies TestCase;
