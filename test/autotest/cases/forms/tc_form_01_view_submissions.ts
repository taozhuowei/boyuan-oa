/**
 * TC-FORM-01: Form center shows user submissions
 * Purpose: Verify forms page lists user submitted forms
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-FORM-01',
  title: 'Form center shows user submissions',
  module: 'forms',
  priority: 'P0',
  credentials: {
    username: 'employee.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Login as employee', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'employee.demo' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to forms', action: 'navigate', to: '/forms' },
    { id: 6, desc: 'Assert page loaded', action: 'assert', check: { type: 'text_visible', value: '表单中心' } },
    { id: 7, desc: 'Assert my submissions tab', action: 'assert', check: { type: 'text_visible', value: '我的提交' } },
    { id: 8, desc: 'Assert approval history tab', action: 'assert', check: { type: 'text_visible', value: '审批历史' } },
  ],
  expect: {
    result: 'pass',
    url: '/forms',
  },
} satisfies TestCase;
