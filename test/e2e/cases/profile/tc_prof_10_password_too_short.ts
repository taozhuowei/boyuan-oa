/**
 * TC-PROF-10: Short password shows validation error
 * Purpose: Verify password must be at least 8 characters
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-PROF-10',
  title: 'Short password shows validation error',
  module: 'profile',
  priority: 'P1',
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Click user avatar', action: 'click', locator: { by: 'role', role: 'button', name: 'ceo.demo' } },
    { id: 6, desc: 'Click change password menu', action: 'click', locator: { by: 'text', value: '修改密码' } },
    { id: 7, desc: 'Fill current password', action: 'fill', locator: { by: 'label', value: '当前密码' }, value: '123456' },
    { id: 8, desc: 'Fill short new password', action: 'fill', locator: { by: 'label', value: '新密码' }, value: '123' },
    { id: 9, desc: 'Confirm short password', action: 'fill', locator: { by: 'label', value: '确认新密码' }, value: '123' },
    { id: 10, desc: 'Click save button', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 11, desc: 'Assert length error', action: 'assert', check: { type: 'text_visible', value: '8' } },
  ],
  expect: {
    result: 'pass',
    url: '/me/password',
  },
} satisfies TestCase;
