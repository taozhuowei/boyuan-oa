/**
 * TC-AUTH-06: Refresh page keeps session
 * Purpose: Verify login state persists after page refresh
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-AUTH-06',
  title: 'Refresh page keeps session',
  module: 'auth',
  priority: 'P1',
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Assert URL contains dashboard', action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
    { id: 6, desc: 'Refresh page', action: 'navigate', to: '/dashboard' },
    { id: 7, desc: 'Assert still on dashboard', action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
    { id: 8, desc: 'Assert username still visible', action: 'assert', check: { type: 'text_visible', value: 'ceo.demo' } },
  ],
  expect: {
    result: 'pass',
    url: '/dashboard',
  },
} satisfies TestCase;
