/**
 * TC-POS-05: Edit level salary amount
 * Purpose: Verify CEO can edit salary grade amount
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-POS-05',
  title: 'Edit level salary amount',
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
    { id: 6, desc: 'Click edit level on first position', action: 'click', locator: { by: 'role', role: 'button', name: '编辑等级' } },
    { id: 7, desc: 'Fill new salary', action: 'fill', locator: { by: 'label', value: '薪资' }, value: '15000' },
    { id: 8, desc: 'Click save button', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 9, desc: 'Assert success toast', action: 'assert', check: { type: 'toast_contains', value: '成功' } },
    { id: 10, desc: 'Assert new salary visible', action: 'assert', check: { type: 'text_visible', value: '15000' } },
  ],
  expect: {
    result: 'pass',
    url: '/positions',
  },
} satisfies TestCase;
