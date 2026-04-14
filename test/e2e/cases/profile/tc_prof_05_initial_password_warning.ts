/**
 * TC-PROF-05: Initial password login shows warning banner
 * Purpose: Verify initial password warning banner appears on workbench
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-PROF-05',
  title: 'Initial password login shows warning banner',
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
    { id: 6, desc: 'Assert change password button visible', action: 'assert', check: { type: 'text_visible', value: '修改' } },
  ],
  expect: {
    result: 'pass',
    url: '/dashboard',
  },
} satisfies TestCase;
