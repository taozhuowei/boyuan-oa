/**
 * TC-POS-03: New position appears in employee creation dropdown
 * Purpose: Verify newly created position is selectable when creating employee
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-POS-03',
  title: 'New position appears in employee creation dropdown',
  module: 'position',
  priority: 'P0',
  tags: ['smoke', 'deferred'],
  credentials: {
    username: 'hr.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to employees page', action: 'navigate', to: '/employees' },
    { id: 6, desc: 'Click add employee button', action: 'click', locator: { by: 'role', role: 'button', name: '新增' } },
    { id: 7, desc: 'Open position dropdown', action: 'click', locator: { by: 'label', value: '岗位' } },
    { id: 8, desc: 'Assert new position in dropdown', action: 'assert', check: { type: 'text_visible', value: '测试岗位' } },
  ],
  expect: {
    result: 'pass',
    url: '/employees',
  },
} satisfies TestCase;
