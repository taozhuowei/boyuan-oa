/**
 * TC-POS-07: Empty position name shows error
 * Purpose: Verify position name is required
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-POS-07',
  title: 'Empty position name shows error',
  module: 'position',
  priority: 'P1',
  tags: ['deferred'],
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to positions page', action: 'navigate', to: '/positions' },
    { id: 6, desc: 'Click add position button', action: 'click', locator: { by: 'role', role: 'button', name: '新增' } },
    { id: 7, desc: 'Leave name empty', action: 'fill', locator: { by: 'label', value: '岗位名称' }, value: '' },
    { id: 8, desc: 'Click save button', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 9, desc: 'Assert validation error', action: 'assert', check: { type: 'text_visible', value: '岗位名称' } },
  ],
  expect: {
    result: 'pass',
    url: '/positions',
  },
} satisfies TestCase;
