/**
 * TC-LOG-03: Finance cannot access operation logs
 * Purpose: Verify non-CEO roles cannot access operation logs
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-LOG-03',
  title: 'Finance cannot access operation logs',
  module: 'operation-logs',
  priority: 'P1',
  credentials: {
    username: 'finance.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Login as finance', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'finance.demo' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to operation logs', action: 'navigate', to: '/operation-logs' },
    { id: 6, desc: 'Assert 403 or redirect', action: 'assert', check: { type: 'text_visible', value: '403' } },
  ],
  expect: {
    result: 'pass',
  },
} satisfies TestCase;
