/**
 * TC-ORG-06: Employee list supports name search
 * Purpose: Verify employee list search returns matching results
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ORG-06',
  title: 'Employee list supports name search',
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
    { id: 6, desc: 'Fill search box with CEO', action: 'fill', locator: { by: 'placeholder', value: '搜索' }, value: 'CEO' },
    { id: 7, desc: 'Click search button', action: 'click', locator: { by: 'role', role: 'button', name: '搜索' } },
    { id: 8, desc: 'Assert search result contains CEO', action: 'assert', check: { type: 'text_visible', value: 'CEO' } },
  ],
  expect: {
    result: 'pass',
    url: '/employees',
  },
} satisfies TestCase;
