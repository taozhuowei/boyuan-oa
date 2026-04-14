/**
 * TC-PROF-07: Banner disappears after password change
 * Purpose: Verify warning banner disappears after password change
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-PROF-07',
  title: 'Banner disappears after password change',
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
    { id: 5, desc: 'Assert warning banner visible', action: 'assert', check: { type: 'text_visible', value: '密码' } },
    { id: 6, desc: 'Click user avatar', action: 'click', locator: { by: 'role', role: 'button', name: 'employee.demo' } },
    { id: 7, desc: 'Click change password menu', action: 'click', locator: { by: 'text', value: '修改密码' } },
    { id: 8, desc: 'Fill current password', action: 'fill', locator: { by: 'label', value: '当前密码' }, value: '123456' },
    { id: 9, desc: 'Fill new password', action: 'fill', locator: { by: 'label', value: '新密码' }, value: 'NewPass@2026' },
    { id: 10, desc: 'Confirm new password', action: 'fill', locator: { by: 'label', value: '确认新密码' }, value: 'NewPass@2026' },
    { id: 11, desc: 'Click save button', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 12, desc: 'Assert success toast', action: 'assert', check: { type: 'toast_contains', value: '成功' } },
    { id: 13, desc: 'Navigate to dashboard', action: 'navigate', to: '/dashboard' },
    { id: 14, desc: 'Assert warning banner absent', action: 'assert', check: { type: 'text_absent', value: '修改' } },
  ],
  expect: {
    result: 'pass',
    url: '/dashboard',
  },
} satisfies TestCase;
