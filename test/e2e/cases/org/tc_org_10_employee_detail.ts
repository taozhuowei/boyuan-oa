/**
 * TC-ORG-10: View employee detail page with complete fields
 * Purpose: Verify employee detail page shows all fields correctly
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ORG-10',
  title: 'View employee detail page with complete fields',
  module: 'org',
  priority: 'P1',
  credentials: {
    username: 'hr.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to employees page', action: 'navigate', to: '/employees' },
    { id: 6, desc: 'Click view detail on first employee', action: 'click', locator: { by: 'role', role: 'button', name: '详情' } },
    { id: 7, desc: 'Assert detail page visible', action: 'assert', check: { type: 'text_visible', value: '员工详情' } },
    { id: 8, desc: 'Assert employee name visible', action: 'assert', check: { type: 'text_visible', value: '姓名' } },
    { id: 9, desc: 'Assert employee ID visible', action: 'assert', check: { type: 'text_visible', value: '员工编号' } },
    { id: 10, desc: 'Assert department info visible', action: 'assert', check: { type: 'text_visible', value: '部门' } },
  ],
  expect: {
    result: 'pass',
    url: '/employees',
  },
} satisfies TestCase;
