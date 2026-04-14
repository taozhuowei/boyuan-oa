/**
 * TC-AUTH-16: Special characters in password handled
 * Purpose: Verify special characters in password are handled correctly
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-AUTH-16',
  title: 'Special characters in password handled',
  module: 'auth',
  priority: 'P2',
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'ceo.demo' },
    { id: 3, desc: 'Fill special char password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '!@#$%^&*()' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Assert no crash', action: 'assert', check: { type: 'element_visible', locator: { by: 'role', role: 'button', name: '登录' } } },
  ],
  expect: {
    result: 'pass',
    url: '/login',
  },
} satisfies TestCase;
