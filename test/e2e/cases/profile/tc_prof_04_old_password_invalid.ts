/**
 * TC-PROF-04: Old password invalid after change
 * Purpose: Verify old password cannot be used after password change
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-PROF-04',
  title: 'Old password invalid after change',
  module: 'profile',
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
    { id: 5, desc: 'Click user avatar', action: 'click', locator: { by: 'role', role: 'button', name: 'employee.demo' } },
    { id: 6, desc: 'Click change password menu', action: 'click', locator: { by: 'text', value: '修改密码' } },
    { id: 7, desc: 'Fill current password', action: 'fill', locator: { by: 'label', value: '当前密码' }, value: '123456' },
    { id: 8, desc: 'Fill new password', action: 'fill', locator: { by: 'label', value: '新密码' }, value: 'NewPass@2026' },
    { id: 9, desc: 'Confirm new password', action: 'fill', locator: { by: 'label', value: '确认新密码' }, value: 'NewPass@2026' },
    { id: 10, desc: 'Click save button', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 11, desc: 'Assert success toast', action: 'assert', check: { type: 'toast_contains', value: '成功' } },
    { id: 12, desc: 'Click logout', action: 'click', locator: { by: 'text', value: '退出登录' } },
    { id: 13, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'employee.demo' },
    { id: 14, desc: 'Fill old password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 15, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 16, desc: 'Assert login fails', action: 'assert', check: { type: 'text_visible', value: '密码' } },
  ],
  expect: {
    result: 'pass',
    url: '/login',
  },
} satisfies TestCase;
