/**
 * TC-AUTH-09: Wrong password shows error
 * Purpose: Verify login fails with wrong password and shows error message
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-AUTH-09',
  title: 'Wrong password shows error',
  module: 'auth',
  priority: 'P0',
  tags: ['smoke'],
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'ceo.demo' },
    { id: 3, desc: 'Fill wrong password', action: 'fill', locator: { by: 'label', value: '密码' }, value: 'wrongpassword' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Assert error message visible', action: 'assert', check: { type: 'text_visible', value: '密码' } },
    { id: 6, desc: 'Assert still on login page', action: 'assert', check: { type: 'url_equals', value: '/login' } },
  ],
  expect: {
    result: 'pass',
    url: '/login',
  },
} satisfies TestCase;
