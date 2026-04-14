/**
 * TC-AUTH-13: Empty username and password shows validation errors
 * Purpose: Verify form validation for both fields empty
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-AUTH-13',
  title: 'Empty username and password shows validation errors',
  module: 'auth',
  priority: 'P1',
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 3, desc: 'Assert validation error for username', action: 'assert', check: { type: 'text_visible', value: '用户名' } },
    { id: 4, desc: 'Assert validation error for password', action: 'assert', check: { type: 'text_visible', value: '密码' } },
    { id: 5, desc: 'Assert still on login page', action: 'assert', check: { type: 'url_equals', value: '/login' } },
  ],
  expect: {
    result: 'pass',
    url: '/login',
  },
} satisfies TestCase;
