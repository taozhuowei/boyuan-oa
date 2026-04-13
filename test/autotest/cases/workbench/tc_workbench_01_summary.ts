/**
 * TC-WB-01: Workbench summary cards visible
 * Purpose: Verify workbench shows summary data after CEO login
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-WB-01',
  title: 'Workbench summary cards visible after CEO login',
  module: 'workbench',
  priority: 'P1',
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    {
      action: 'navigate',
      target: '/login',
    },
    {
      action: 'fill',
      target: { by: 'label', value: '用户名' },
      value: 'ceo.demo',
    },
    {
      action: 'fill',
      target: { by: 'label', value: '密码' },
      value: '123456',
    },
    {
      action: 'click',
      target: { by: 'role', value: 'button', name: '登录' },
    },
    {
      action: 'assert',
      target: { by: 'url_contains', value: '/dashboard' },
    },
    {
      action: 'assert',
      target: { by: 'text', value: '工作台' },
    },
    {
      action: 'screenshot',
      target: { by: 'page' },
      value: 'workbench_summary',
    },
  ],
  expect: {
    result: 'pass',
  },
} satisfies TestCase;
