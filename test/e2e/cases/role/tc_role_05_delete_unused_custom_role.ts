/**
 * TC-ROLE-05: Delete unused custom role
 * Purpose: Verify CEO can delete custom role not assigned to any employee
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ROLE-05',
  title: 'Delete unused custom role',
  module: 'role',
  priority: 'P2',
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
    { id: 6, desc: 'Click delete on unused custom role', action: 'click', locator: { by: 'role', role: 'button', name: '删除' } },
    { id: 7, desc: 'Confirm delete', action: 'click', locator: { by: 'role', role: 'button', name: '确定' } },
    { id: 8, desc: 'Assert success toast', action: 'assert', check: { type: 'toast_contains', value: '成功' } },
  ],
  expect: {
    result: 'pass',
    url: '/role',
  },
} satisfies TestCase;
