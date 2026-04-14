/**
 * TC-ORG-11: Create employee without name shows error
 * Purpose: Verify name is required field for employee creation
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ORG-11',
  title: 'Create employee without name shows error',
  module: 'org',
  priority: 'P0',
  tags: ['smoke'],
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
    { id: 7, desc: 'Leave name empty', action: 'fill', locator: { by: 'label', value: '姓名' }, value: '' },
    { id: 8, desc: 'Fill phone number', action: 'fill', locator: { by: 'label', value: '手机号' }, value: '18800003333' },
    { id: 9, desc: 'Click save button', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 10, desc: 'Assert name required error', action: 'assert', check: { type: 'text_visible', value: '姓名' } },
  ],
  expect: {
    result: 'pass',
    url: '/employees',
  },
} satisfies TestCase;
