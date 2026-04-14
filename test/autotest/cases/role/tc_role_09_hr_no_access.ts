/**
 * TC-ROLE-09: HR cannot access role management
 * Purpose: Verify HR has no role management menu/access
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ROLE-09',
  title: 'HR cannot access role management',
  module: 'role',
  priority: 'P1',
  credentials: {
    username: 'hr.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Login as HR', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'hr.demo' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Direct access to role page', action: 'navigate', to: '/role' },
    { id: 6, desc: 'Assert 403 or redirect', action: 'assert', check: { type: 'text_visible', value: '403' } },
  ],
  expect: {
    result: 'pass',
  },
} satisfies TestCase;
