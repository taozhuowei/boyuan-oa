/**
 * TC-AUTH-15: Long username handled gracefully
 * Purpose: Verify very long username is handled without crash
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-AUTH-15',
  title: 'Long username handled gracefully',
  module: 'auth',
  priority: 'P2',
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill very long username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'a'.repeat(500) },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Assert error message shown', action: 'assert', check: { type: 'text_visible', value: '账号' } },
    { id: 6, desc: 'Assert page did not crash', action: 'assert', check: { type: 'element_visible', locator: { by: 'role', role: 'button', name: '登录' } } },
  ],
  expect: {
    result: 'pass',
    url: '/login',
  },
} satisfies TestCase;
