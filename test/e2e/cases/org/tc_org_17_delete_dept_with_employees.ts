/**
 * TC-ORG-17: Delete department with employees shows warning
 * Purpose: Verify department with employees cannot be deleted
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ORG-17',
  title: 'Delete department with employees shows warning',
  module: 'org',
  priority: 'P2',
  credentials: {
    username: 'hr.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to departments page', action: 'navigate', to: '/departments' },
    { id: 6, desc: 'Click delete on department with employees', action: 'click', locator: { by: 'role', role: 'button', name: '删除' } },
    { id: 7, desc: 'Assert warning about related data', action: 'assert', check: { type: 'text_visible', value: '员工' } },
  ],
  expect: {
    result: 'pass',
    url: '/departments',
  },
} satisfies TestCase;
