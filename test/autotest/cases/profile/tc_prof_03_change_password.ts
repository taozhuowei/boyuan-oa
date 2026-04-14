/**
 * TC-PROF-03: Change password and login with new password
 * Purpose: Verify password change works end-to-end
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-PROF-03',
  title: 'Change password and login with new password',
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
    { id: 6, desc: 'Assert page loaded', action: 'assert', check: { type: 'text_visible', value: '修改密码' } },
    { id: 7, desc: 'Fill current password', action: 'fill', locator: { by: 'label', value: '当前密码' }, value: '123456' },
    { id: 8, desc: 'Fill new password', action: 'fill', locator: { by: 'label', value: '新密码' }, value: 'NewPass@2026' },
    { id: 9, desc: 'Fill confirm password', action: 'fill', locator: { by: 'label', value: '确认密码' }, value: 'NewPass@2026' },
    { id: 10, desc: 'Click save', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 11, desc: 'Assert success', action: 'assert', check: { type: 'text_visible', value: '成功' } },
    { id: 12, desc: 'Logout', action: 'navigate', to: '/logout' },
    { id: 13, desc: 'Login with new password', action: 'navigate', to: '/login' },
    { id: 14, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'employee.demo' },
    { id: 15, desc: 'Fill new password', action: 'fill', locator: { by: 'label', value: '密码' }, value: 'NewPass@2026' },
    { id: 16, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 17, desc: 'Assert dashboard loaded', action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
  ],
  expect: {
    result: 'pass',
    url: '/dashboard',
  },
} satisfies TestCase;
