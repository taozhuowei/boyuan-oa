/**
 * TC-ORG-07: Disable employee account prevents login
 * Purpose: Verify disabled employee cannot login
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ORG-07',
  title: 'Disable employee account prevents login',
  module: 'org',
  priority: 'P1',
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
    { id: 6, desc: 'Click disable button on test employee', action: 'click', locator: { by: 'role', role: 'button', name: '停用' } },
    { id: 7, desc: 'Confirm disable', action: 'click', locator: { by: 'role', role: 'button', name: '确定' } },
    { id: 8, desc: 'Assert status changed', action: 'assert', check: { type: 'text_visible', value: '已停用' } },
    { id: 9, desc: 'Logout and try disabled login', action: 'navigate', to: '/login' },
    { id: 10, desc: 'Fill disabled username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'test.employee' },
    { id: 11, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 12, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 13, desc: 'Assert disabled message', action: 'assert', check: { type: 'text_visible', value: '停用' } },
  ],
  expect: {
    result: 'pass',
    url: '/login',
  },
} satisfies TestCase;
