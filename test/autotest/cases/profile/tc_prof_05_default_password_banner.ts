/**
 * TC-PROF-05: Default password warning banner on workbench
 * Purpose: Verify employee with default password sees warning banner
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-PROF-05',
  title: 'Default password warning banner',
  module: 'profile',
  priority: 'P1',
  credentials: {
    username: 'employee.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Login as employee', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'employee.demo' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Assert dashboard loaded', action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
    { id: 6, desc: 'Assert warning banner visible', action: 'assert', check: { type: 'text_visible', value: '请立即修改' } },
    { id: 7, desc: 'Assert banner has change password button', action: 'assert', check: { type: 'text_visible', value: '立即修改' } },
  ],
  expect: {
    result: 'pass',
    url: '/dashboard',
  },
} satisfies TestCase;
