/**
 * TC-AUTH-10: Nonexistent user login fails
 * Purpose: Verify login fails with nonexistent username
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-AUTH-10',
  title: 'Nonexistent user login fails',
  module: 'auth',
  priority: 'P0',
  tags: ['smoke'],
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill nonexistent username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'nonexistent.user' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Assert error message visible', action: 'assert', check: { type: 'text_visible', value: '账号' } },
    { id: 6, desc: 'Assert still on login page', action: 'assert', check: { type: 'url_equals', value: '/login' } },
  ],
  expect: {
    result: 'pass',
    url: '/login',
  },
} satisfies TestCase;
