/**
 * TC-WB-02: Click active project card navigates to projects
 * Purpose: Verify clicking active project count card navigates to /projects
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-WB-02',
  title: 'Click active project card navigates to projects',
  module: 'workbench',
  priority: 'P1',
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Click active project card', action: 'click', locator: { by: 'text', value: '活跃项目' } },
    { id: 6, desc: 'Assert navigated to projects page', action: 'assert', check: { type: 'url_contains', value: '/projects' } },
  ],
  expect: {
    result: 'pass',
    url: '/projects',
  },
} satisfies TestCase;
