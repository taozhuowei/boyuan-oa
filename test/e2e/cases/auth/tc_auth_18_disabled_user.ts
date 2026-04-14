/**
 * TC-AUTH-18: Disabled user cannot login
 * Purpose: Verify disabled account cannot login
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-AUTH-18',
  title: 'Disabled user cannot login',
  module: 'auth',
  priority: 'P1',
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill disabled username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'disabled.user' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Assert disabled account message', action: 'assert', check: { type: 'text_visible', value: '停用' } },
    { id: 6, desc: 'Assert still on login page', action: 'assert', check: { type: 'url_equals', value: '/login' } },
  ],
  expect: {
    result: 'pass',
    url: '/login',
  },
} satisfies TestCase;
