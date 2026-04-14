/**
 * TC-WB-09: Worker direct access to /operation-logs is forbidden
 * Purpose: Verify Worker accessing /operation-logs gets 403 or redirect
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-WB-09',
  title: 'Worker direct access to /operation-logs is forbidden',
  module: 'workbench',
  priority: 'P1',
  credentials: {
    username: 'worker.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to operation logs page', action: 'navigate', to: '/operation-logs' },
    { id: 6, desc: 'Assert forbidden or redirect', action: 'assert', check: { type: 'text_visible', value: '403' } },
  ],
  expect: {
    result: 'pass',
    url: '/operation-logs',
  },
} satisfies TestCase;
