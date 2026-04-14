/**
 * TC-ROLE-01: Role list displays all built-in roles
 * Purpose: Verify role list shows CEO/HR/Finance/Dept Manager/PM/Employee/Worker
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ROLE-01',
  title: 'Role list displays all built-in roles',
  module: 'role',
  priority: 'P0',
  tags: ['smoke', 'deferred'],
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to role page', action: 'navigate', to: '/role' },
    { id: 6, desc: 'Assert CEO role visible', action: 'assert', check: { type: 'text_visible', value: 'CEO' } },
    { id: 7, desc: 'Assert HR role visible', action: 'assert', check: { type: 'text_visible', value: 'HR' } },
    { id: 8, desc: 'Assert Finance role visible', action: 'assert', check: { type: 'text_visible', value: '财务' } },
    { id: 9, desc: 'Assert Employee role visible', action: 'assert', check: { type: 'text_visible', value: '员工' } },
    { id: 10, desc: 'Assert Worker role visible', action: 'assert', check: { type: 'text_visible', value: '劳工' } },
  ],
  expect: {
    result: 'pass',
    url: '/role',
  },
} satisfies TestCase;
