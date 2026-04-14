/**
 * TC-ROLE-04: Edit custom role permissions
 * Purpose: Verify CEO can edit custom role permissions
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ROLE-04',
  title: 'Edit custom role permissions',
  module: 'role',
  priority: 'P1',
  tags: ['deferred'],
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to role page', action: 'navigate', to: '/role' },
    { id: 6, desc: 'Click edit on custom role', action: 'click', locator: { by: 'role', role: 'button', name: '编辑' } },
    { id: 7, desc: 'Check additional permission', action: 'check', locator: { by: 'label', value: '审批' } },
    { id: 8, desc: 'Click save button', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 9, desc: 'Assert success toast', action: 'assert', check: { type: 'toast_contains', value: '成功' } },
  ],
  expect: {
    result: 'pass',
    url: '/role',
  },
} satisfies TestCase;
