/**
 * TC-POS-06: Delete unused position
 * Purpose: Verify CEO can delete position with no employees
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-POS-06',
  title: 'Delete unused position',
  module: 'position',
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
    { id: 5, desc: 'Navigate to positions page', action: 'navigate', to: '/positions' },
    { id: 6, desc: 'Click delete on unused position', action: 'click', locator: { by: 'role', role: 'button', name: '删除' } },
    { id: 7, desc: 'Confirm delete', action: 'click', locator: { by: 'role', role: 'button', name: '确定' } },
    { id: 8, desc: 'Assert success toast', action: 'assert', check: { type: 'toast_contains', value: '成功' } },
  ],
  expect: {
    result: 'pass',
    url: '/positions',
  },
} satisfies TestCase;
