/**
 * TC-CFG-01: System config page loads attendance units
 * Purpose: Verify config page shows leave/overtime units
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-CFG-01',
  title: 'System config page loads attendance units',
  module: 'config',
  priority: 'P0',
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Login as CEO', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'ceo.demo' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to config', action: 'navigate', to: '/config' },
    { id: 6, desc: 'Assert page loaded', action: 'assert', check: { type: 'text_visible', value: '系统配置' } },
    { id: 7, desc: 'Assert attendance units section', action: 'assert', check: { type: 'text_visible', value: '考勤计量单位' } },
    { id: 8, desc: 'Assert leave unit label', action: 'assert', check: { type: 'text_visible', value: '请假单位' } },
    { id: 9, desc: 'Assert overtime unit label', action: 'assert', check: { type: 'text_visible', value: '加班单位' } },
    { id: 10, desc: 'Assert approval flow section', action: 'assert', check: { type: 'text_visible', value: '审批流配置' } },
  ],
  expect: {
    result: 'pass',
    url: '/config',
  },
} satisfies TestCase;
