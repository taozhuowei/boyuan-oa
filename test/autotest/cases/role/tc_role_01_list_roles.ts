/**
 * TC-ROLE-01: Role list shows all system roles
 * Purpose: Verify CEO can see all built-in roles
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ROLE-01',
  title: 'Role list shows all system roles',
  module: 'role',
  priority: 'P0',
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Login as CEO', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'ceo.demo' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to role management', action: 'navigate', to: '/role' },
    { id: 6, desc: 'Assert page loaded', action: 'assert', check: { type: 'text_visible', value: '角色管理' } },
    { id: 7, desc: 'Assert CEO role visible', action: 'assert', check: { type: 'text_visible', value: 'CEO' } },
    { id: 8, desc: 'Assert HR role visible', action: 'assert', check: { type: 'text_visible', value: 'HR' } },
    { id: 9, desc: 'Assert Finance role visible', action: 'assert', check: { type: 'text_visible', value: '财务' } },
    { id: 10, desc: 'Assert PM role visible', action: 'assert', check: { type: 'text_visible', value: '项目经理' } },
    { id: 11, desc: 'Assert Employee role visible', action: 'assert', check: { type: 'text_visible', value: '员工' } },
    { id: 12, desc: 'Assert system tag visible', action: 'assert', check: { type: 'text_visible', value: '系统' } },
  ],
  expect: {
    result: 'pass',
    url: '/role',
  },
} satisfies TestCase;
