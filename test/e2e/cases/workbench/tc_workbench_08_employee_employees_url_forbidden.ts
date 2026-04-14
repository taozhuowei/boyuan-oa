/**
 * TC-WB-08: Employee direct access to /employees is forbidden
 * Purpose: Verify Employee accessing /employees gets 403 or redirect
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-WB-08',
  title: 'Employee direct access to /employees is forbidden',
  module: 'workbench',
  priority: 'P1',
  credentials: {
    username: 'employee.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to employees page', action: 'navigate', to: '/employees' },
    { id: 6, desc: 'Assert forbidden or redirect', action: 'assert', check: { type: 'text_visible', value: '403' } },
  ],
  expect: {
    result: 'pass',
    url: '/employees',
  },
} satisfies TestCase;
