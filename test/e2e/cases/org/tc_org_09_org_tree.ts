/**
 * TC-ORG-09: Organization tree visualization loads correctly
 * Purpose: Verify org tree displays reporting relationships
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ORG-09',
  title: 'Organization tree visualization loads correctly',
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
    { id: 5, desc: 'Navigate to org tree page', action: 'navigate', to: '/org/tree' },
    { id: 6, desc: 'Assert org tree visible', action: 'assert', check: { type: 'text_visible', value: '组织架构' } },
    { id: 7, desc: 'Assert departments visible in tree', action: 'assert', check: { type: 'text_visible', value: '部门' } },
  ],
  expect: {
    result: 'pass',
    url: '/org/tree',
  },
} satisfies TestCase;
