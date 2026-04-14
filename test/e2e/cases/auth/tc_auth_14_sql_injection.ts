/**
 * TC-AUTH-14: SQL injection attempt fails
 * Purpose: Verify SQL injection in username field is handled safely
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-AUTH-14',
  title: 'SQL injection attempt fails',
  module: 'auth',
  priority: 'P1',
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill SQL injection username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: "' OR 1=1 --" },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Assert login failed', action: 'assert', check: { type: 'text_visible', value: '账号' } },
    { id: 6, desc: 'Assert no 500 error', action: 'assert', check: { type: 'text_absent', value: '500' } },
    { id: 7, desc: 'Assert still on login page', action: 'assert', check: { type: 'url_equals', value: '/login' } },
  ],
  expect: {
    result: 'pass',
    url: '/login',
  },
} satisfies TestCase;
