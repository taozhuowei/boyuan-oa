/**
 * TC-POS-09: HR account cannot delete position
 * Purpose: Verify HR role has no delete permission
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-POS-09',
  title: 'HR cannot delete position',
  module: 'position',
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
    { id: 5, desc: 'Navigate to positions', action: 'navigate', to: '/positions' },
    { id: 6, desc: 'Assert page loaded', action: 'assert', check: { type: 'text_visible', value: '岗位管理' } },
    { id: 7, desc: 'Assert no delete button visible', action: 'assert', check: { type: 'element_not_visible', selector: '删除' } },
    { id: 8, desc: 'Assert no add button visible', action: 'assert', check: { type: 'element_not_visible', selector: '新增岗位' } },
  ],
  expect: {
    result: 'pass',
    url: '/positions',
  },
} satisfies TestCase;
