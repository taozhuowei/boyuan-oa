/**
 * TC-AUTH-04: PM correct login
 * Purpose: Verify Project Manager can login successfully with valid credentials
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-AUTH-04',
  title: 'PM correct login',
  module: 'auth',
  priority: 'P0',
  tags: ['smoke'],
  credentials: {
    username: 'pm.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Assert URL contains dashboard', action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
    { id: 6, desc: 'Assert username visible', action: 'assert', check: { type: 'text_visible', value: 'pm.demo' } },
  ],
  expect: {
    result: 'pass',
    url: '/dashboard',
  },
} satisfies TestCase;
