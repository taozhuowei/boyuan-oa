/**
 * TC-PROF-08: Wrong old password fails
 * Purpose: Verify password change rejects wrong current password
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-PROF-08',
  title: 'Wrong old password fails',
  module: 'profile',
  priority: 'P0',
  credentials: {
    username: 'employee.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Login as employee', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'employee.demo' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to change password', action: 'navigate', to: '/me/password' },
    { id: 6, desc: 'Fill wrong current password', action: 'fill', locator: { by: 'label', value: '当前密码' }, value: 'wrongpass' },
    { id: 7, desc: 'Fill new password', action: 'fill', locator: { by: 'label', value: '新密码' }, value: 'NewPass@2026' },
    { id: 8, desc: 'Fill confirm password', action: 'fill', locator: { by: 'label', value: '确认密码' }, value: 'NewPass@2026' },
    { id: 9, desc: 'Click save', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 10, desc: 'Assert error message', action: 'assert', check: { type: 'text_visible', value: '错误' } },
  ],
  expect: {
    result: 'pass',
  },
} satisfies TestCase;
