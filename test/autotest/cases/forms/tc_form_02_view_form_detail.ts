/**
 * TC-FORM-02: View form detail with approval history
 * Purpose: Verify form detail drawer shows data and timeline
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-FORM-02',
  title: 'View form detail with approval history',
  module: 'forms',
  priority: 'P1',
  credentials: {
    username: 'employee.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Login and navigate to forms', action: 'navigate', to: '/forms' },
    { id: 2, desc: 'Assert page loaded', action: 'assert', check: { type: 'text_visible', value: '表单中心' } },
    { id: 3, desc: 'Click view on first form row', action: 'click', locator: { by: 'role', role: 'button', name: '查看' } },
    { id: 4, desc: 'Assert detail drawer visible', action: 'assert', check: { type: 'text_visible', value: '表单详情' } },
    { id: 5, desc: 'Assert form data section', action: 'assert', check: { type: 'text_visible', value: '表单数据' } },
    { id: 6, desc: 'Assert approval history section', action: 'assert', check: { type: 'text_visible', value: '审批历史' } },
  ],
  expect: {
    result: 'pass',
    url: '/forms',
  },
} satisfies TestCase;
