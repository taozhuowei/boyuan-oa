/**
 * TC-POS-02: Create position levels (Junior/Mid/Senior)
 * Purpose: Verify can create multiple levels for a position
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-POS-02',
  title: 'Create position levels',
  module: 'position',
  priority: 'P0',
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  setup: 'Position "测试岗位-自动化" exists from TC-POS-01',
  steps: [
    { id: 1, desc: 'Login and navigate to positions', action: 'navigate', to: '/positions' },
    { id: 2, desc: 'Click expand row for test position', action: 'click', locator: { by: 'text', value: '测试岗位-自动化' } },
    { id: 3, desc: 'Click add level button', action: 'click', locator: { by: 'role', role: 'button', name: '新增等级' } },
    { id: 4, desc: 'Fill level name - Junior', action: 'fill', locator: { by: 'label', value: '等级名称' }, value: '初级' },
    { id: 5, desc: 'Fill level order', action: 'fill', locator: { by: 'label', value: '顺序' }, value: '1' },
    { id: 6, desc: 'Click save', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 7, desc: 'Click add level button again', action: 'click', locator: { by: 'role', role: 'button', name: '新增等级' } },
    { id: 8, desc: 'Fill level name - Mid', action: 'fill', locator: { by: 'label', value: '等级名称' }, value: '中级' },
    { id: 9, desc: 'Fill level order', action: 'fill', locator: { by: 'label', value: '顺序' }, value: '2' },
    { id: 10, desc: 'Click save', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 11, desc: 'Click add level button again', action: 'click', locator: { by: 'role', role: 'button', name: '新增等级' } },
    { id: 12, desc: 'Fill level name - Senior', action: 'fill', locator: { by: 'label', value: '等级名称' }, value: '高级' },
    { id: 13, desc: 'Fill level order', action: 'fill', locator: { by: 'label', value: '顺序' }, value: '3' },
    { id: 14, desc: 'Click save', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 15, desc: 'Assert all levels visible', action: 'assert', check: { type: 'text_visible', value: '初级' } },
    { id: 16, desc: 'Assert all levels visible', action: 'assert', check: { type: 'text_visible', value: '中级' } },
    { id: 17, desc: 'Assert all levels visible', action: 'assert', check: { type: 'text_visible', value: '高级' } },
  ],
  expect: {
    result: 'pass',
    url: '/positions',
  },
} satisfies TestCase;
