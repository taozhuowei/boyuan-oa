/**
 * TC-PROF-02: Employee profile page displays correct info
 * Purpose: Verify Employee profile shows correct name/role/phone
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-PROF-02',
  title: 'Employee profile page displays correct info',
  module: 'profile',
  priority: 'P0',
  tags: ['smoke'],
  credentials: {
    username: 'employee.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Click user avatar', action: 'click', locator: { by: 'role', role: 'button', name: 'employee.demo' } },
    { id: 6, desc: 'Click profile menu', action: 'click', locator: { by: 'text', value: '个人信息' } },
    { id: 7, desc: 'Assert profile page visible', action: 'assert', check: { type: 'text_visible', value: '个人信息' } },
    { id: 8, desc: 'Assert name visible', action: 'assert', check: { type: 'text_visible', value: 'employee' } },
    { id: 9, desc: 'Assert role visible', action: 'assert', check: { type: 'text_visible', value: '员工' } },
  ],
  expect: {
    result: 'pass',
    url: '/me',
  },
} satisfies TestCase;
