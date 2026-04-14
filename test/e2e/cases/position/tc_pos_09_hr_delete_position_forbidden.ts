/**
 * TC-POS-09: HR deleting position is forbidden
 * Purpose: Verify HR cannot delete positions (403 or no button)
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-POS-09',
  title: 'HR deleting position is forbidden',
  module: 'position',
  priority: 'P1',
  tags: ['deferred'],
  credentials: {
    username: 'hr.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to positions page', action: 'navigate', to: '/positions' },
    { id: 6, desc: 'Assert no delete button or 403', action: 'assert', check: { type: 'text_visible', value: '403' } },
  ],
  expect: {
    result: 'pass',
    url: '/positions',
  },
} satisfies TestCase;
