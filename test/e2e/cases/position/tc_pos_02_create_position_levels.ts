/**
 * TC-POS-02: Create junior/mid/senior levels for position
 * Purpose: Verify CEO can create salary grades for a position
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-POS-02',
  title: 'Create junior mid senior levels for position',
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
    { id: 6, desc: 'Click on test position', action: 'click', locator: { by: 'text', value: '测试岗位' } },
    { id: 7, desc: 'Click add level', action: 'click', locator: { by: 'role', role: 'button', name: '新增等级' } },
    { id: 8, desc: 'Fill junior level', action: 'fill', locator: { by: 'label', value: '等级名称' }, value: '初级' },
    { id: 9, desc: 'Fill junior salary', action: 'fill', locator: { by: 'label', value: '薪资' }, value: '5000' },
    { id: 10, desc: 'Click save', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 11, desc: 'Add mid level', action: 'click', locator: { by: 'role', role: 'button', name: '新增等级' } },
    { id: 12, desc: 'Fill mid level', action: 'fill', locator: { by: 'label', value: '等级名称' }, value: '中级' },
    { id: 13, desc: 'Fill mid salary', action: 'fill', locator: { by: 'label', value: '薪资' }, value: '8000' },
    { id: 14, desc: 'Click save', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 15, desc: 'Add senior level', action: 'click', locator: { by: 'role', role: 'button', name: '新增等级' } },
    { id: 16, desc: 'Fill senior level', action: 'fill', locator: { by: 'label', value: '等级名称' }, value: '高级' },
    { id: 17, desc: 'Fill senior salary', action: 'fill', locator: { by: 'label', value: '薪资' }, value: '12000' },
    { id: 18, desc: 'Click save', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 19, desc: 'Assert all levels visible', action: 'assert', check: { type: 'text_visible', value: '初级' } },
  ],
  expect: {
    result: 'pass',
    url: '/positions',
  },
} satisfies TestCase;
