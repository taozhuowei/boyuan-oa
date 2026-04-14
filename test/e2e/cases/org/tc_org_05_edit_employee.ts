/**
 * TC-ORG-05: Edit employee basic info
 * Purpose: Verify HR can edit employee phone and contract type
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ORG-05',
  title: 'Edit employee basic info',
  module: 'org',
  priority: 'P1',
  credentials: {
    username: 'hr.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to employees page', action: 'navigate', to: '/employees' },
    { id: 6, desc: 'Click edit button on first employee', action: 'click', locator: { by: 'role', role: 'button', name: '编辑' } },
    { id: 7, desc: 'Clear and fill new phone', action: 'fill', locator: { by: 'label', value: '手机号' }, value: '19999999999' },
    { id: 8, desc: 'Select contract type', action: 'select', locator: { by: 'label', value: '合同类型' }, value: '正式合同' },
    { id: 9, desc: 'Click save button', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 10, desc: 'Assert success toast', action: 'assert', check: { type: 'toast_contains', value: '成功' } },
  ],
  expect: {
    result: 'pass',
    url: '/employees',
  },
} satisfies TestCase;
