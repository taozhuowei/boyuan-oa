/**
 * TC-DIR-03: Employee cannot access directory import
 * Purpose: Verify non-finance roles cannot access directory import
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-DIR-03',
  title: 'Employee cannot access directory import',
  module: 'directory',
  priority: 'P1',
  credentials: {
    username: 'employee.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Login as employee', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'employee.demo' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to directory', action: 'navigate', to: '/directory' },
    { id: 6, desc: 'Assert 403 or redirect', action: 'assert', check: { type: 'text_visible', value: '403' } },
  ],
  expect: {
    result: 'pass',
  },
} satisfies TestCase;
