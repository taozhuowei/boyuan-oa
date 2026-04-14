/**
 * TC-ROLE-03: Custom role visible in employee creation dropdown
 * Purpose: Verify custom role appears in new employee main role dropdown
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ROLE-03',
  title: 'Custom role visible in employee creation dropdown',
  module: 'role',
  priority: 'P1',
  tags: ['deferred'],
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
    { id: 7, desc: 'Open role dropdown', action: 'click', locator: { by: 'label', value: '主角色' } },
    { id: 8, desc: 'Assert custom role in dropdown', action: 'assert', check: { type: 'text_visible', value: '测试角色' } },
  ],
  expect: {
    result: 'pass',
    url: '/employees',
  },
} satisfies TestCase;
