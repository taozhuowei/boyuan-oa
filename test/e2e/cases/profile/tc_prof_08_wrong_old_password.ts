/**
 * TC-PROF-08: Wrong old password shows error
 * Purpose: Verify password change fails with wrong old password
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-PROF-08',
  title: 'Wrong old password shows error',
  module: 'profile',
  priority: 'P0',
  tags: ['smoke'],
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
    { id: 7, desc: 'Fill wrong current password', action: 'fill', locator: { by: 'label', value: '当前密码' }, value: 'wrongpassword' },
    { id: 8, desc: 'Fill new password', action: 'fill', locator: { by: 'label', value: '新密码' }, value: 'NewPass@2026' },
    { id: 9, desc: 'Confirm new password', action: 'fill', locator: { by: 'label', value: '确认新密码' }, value: 'NewPass@2026' },
    { id: 10, desc: 'Click save button', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 11, desc: 'Assert error message', action: 'assert', check: { type: 'text_visible', value: '错误' } },
  ],
  expect: {
    result: 'pass',
    url: '/me/password',
  },
} satisfies TestCase;
