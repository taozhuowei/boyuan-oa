/**
 * TC-LOG-01: CEO views operation logs
 * Purpose: Verify operation logs page loads with pagination and filters
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-LOG-01',
  title: 'CEO views operation logs',
  module: 'operation-logs',
  priority: 'P1',
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Login as CEO', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'ceo.demo' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to operation logs', action: 'navigate', to: '/operation-logs' },
    { id: 6, desc: 'Assert page loaded', action: 'assert', check: { type: 'text_visible', value: '操作日志' } },
    { id: 7, desc: 'Assert table columns', action: 'assert', check: { type: 'text_visible', value: '操作人' } },
    { id: 8, desc: 'Assert action column', action: 'assert', check: { type: 'text_visible', value: '操作类型' } },
    { id: 9, desc: 'Assert target type column', action: 'assert', check: { type: 'text_visible', value: '目标类型' } },
    { id: 10, desc: 'Assert time column', action: 'assert', check: { type: 'text_visible', value: '时间' } },
    { id: 11, desc: 'Assert pagination info', action: 'assert', check: { type: 'text_visible', value: '共' } },
  ],
  expect: {
    result: 'pass',
    url: '/operation-logs',
  },
} satisfies TestCase;
