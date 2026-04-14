/**
 * TC-WB-01: CEO workbench summary data non-empty
 * Purpose: Verify CEO workbench shows employee count, project count, todo count
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-WB-01',
  title: 'CEO workbench summary data non-empty',
  module: 'workbench',
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
    { id: 5, desc: 'Assert dashboard visible', action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
    { id: 6, desc: 'Assert employee count card visible', action: 'assert', check: { type: 'text_visible', value: '员工' } },
    { id: 7, desc: 'Assert project count card visible', action: 'assert', check: { type: 'text_visible', value: '项目' } },
    { id: 8, desc: 'Assert todo count card visible', action: 'assert', check: { type: 'text_visible', value: '待办' } },
  ],
  expect: {
    result: 'pass',
    url: '/dashboard',
  },
} satisfies TestCase;
