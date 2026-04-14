/**
 * TC-POS-01: CEO creates new position
 * Purpose: Verify CEO can create new position with name
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-POS-01',
  title: 'CEO creates new position',
  module: 'position',
  priority: 'P0',
  tags: ['smoke', 'deferred'],
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
    { id: 7, desc: 'Fill position name', action: 'fill', locator: { by: 'label', value: '岗位名称' }, value: '测试岗位' },
    { id: 8, desc: 'Click save button', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 9, desc: 'Assert success toast', action: 'assert', check: { type: 'toast_contains', value: '成功' } },
    { id: 10, desc: 'Assert position in list', action: 'assert', check: { type: 'text_visible', value: '测试岗位' } },
  ],
  expect: {
    result: 'pass',
    url: '/positions',
  },
} satisfies TestCase;
