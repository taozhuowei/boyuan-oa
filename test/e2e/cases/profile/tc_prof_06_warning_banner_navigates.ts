/**
 * TC-PROF-06: Warning banner navigates to password change
 * Purpose: Verify clicking banner button navigates to password change page
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-PROF-06',
  title: 'Warning banner navigates to password change',
  module: 'profile',
  priority: 'P1',
  credentials: {
    username: 'employee.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Click change password button on banner', action: 'click', locator: { by: 'text', value: '修改' } },
    { id: 6, desc: 'Assert on password change page', action: 'assert', check: { type: 'url_contains', value: '/me/password' } },
  ],
  expect: {
    result: 'pass',
    url: '/me/password',
  },
} satisfies TestCase;
