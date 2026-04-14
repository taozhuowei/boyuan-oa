/**
 * TC-CFG-02: CEO changes leave unit and reload shows new value
 * Purpose: Verify CEO can modify attendance unit config
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-CFG-02',
  title: 'CEO changes leave unit',
  module: 'config',
  priority: 'P0',
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Login and navigate to config', action: 'navigate', to: '/config' },
    { id: 2, desc: 'Select leave unit', action: 'select', locator: { by: 'label', value: '请假单位' }, value: 'HOUR' },
    { id: 3, desc: 'Select overtime unit', action: 'select', locator: { by: 'label', value: '加班单位' }, value: 'DAY' },
    { id: 4, desc: 'Click save', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 5, desc: 'Assert success', action: 'assert', check: { type: 'text_visible', value: '成功' } },
    { id: 6, desc: 'Reload page', action: 'navigate', to: '/config' },
    { id: 7, desc: 'Assert leave unit persisted', action: 'assert', check: { type: 'text_visible', value: '小时' } },
    { id: 8, desc: 'Assert overtime unit persisted', action: 'assert', check: { type: 'text_visible', value: '天' } },
  ],
  expect: {
    result: 'pass',
    url: '/config',
  },
} satisfies TestCase;
