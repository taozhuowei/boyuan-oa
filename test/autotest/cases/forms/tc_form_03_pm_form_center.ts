/**
 * TC-FORM-03: PM can access form center
 * Purpose: Verify PM role has form center menu and access
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-FORM-03',
  title: 'PM can access form center',
  module: 'forms',
  priority: 'P1',
  credentials: {
    username: 'pm.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Login as PM', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'pm.demo' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to forms', action: 'navigate', to: '/forms' },
    { id: 6, desc: 'Assert page loaded', action: 'assert', check: { type: 'text_visible', value: '表单中心' } },
    { id: 7, desc: 'Assert submissions visible', action: 'assert', check: { type: 'text_visible', value: '我的提交' } },
  ],
  expect: {
    result: 'pass',
    url: '/forms',
  },
} satisfies TestCase;
