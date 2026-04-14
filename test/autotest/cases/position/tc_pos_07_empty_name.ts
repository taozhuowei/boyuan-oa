/**
 * TC-POS-07: Create position with empty name - validation error
 * Purpose: Verify form validation rejects empty position name
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-POS-07',
  title: 'Position name empty validation',
  module: 'position',
  priority: 'P1',
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Login and navigate to positions', action: 'navigate', to: '/positions' },
    { id: 2, desc: 'Click add position button', action: 'click', locator: { by: 'role', role: 'button', name: '新增岗位' } },
    { id: 3, desc: 'Leave name empty, fill other fields', action: 'fill', locator: { by: 'label', value: '基本工资' }, value: '5000' },
    { id: 4, desc: 'Click save button', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 5, desc: 'Assert validation error visible', action: 'assert', check: { type: 'text_visible', value: '必填' } },
  ],
  expect: {
    result: 'pass',
  },
} satisfies TestCase;
