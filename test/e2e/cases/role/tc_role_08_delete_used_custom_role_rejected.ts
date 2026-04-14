/**
 * TC-ROLE-08: Delete custom role still in use is rejected
 * Purpose: Verify custom role assigned to employees cannot be deleted
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ROLE-08',
  title: 'Delete custom role still in use is rejected',
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
    { id: 6, desc: 'Click delete on used custom role', action: 'click', locator: { by: 'role', role: 'button', name: '删除' } },
    { id: 7, desc: 'Assert warning about in-use role', action: 'assert', check: { type: 'text_visible', value: '使用' } },
  ],
  expect: {
    result: 'pass',
    url: '/role',
  },
} satisfies TestCase;
