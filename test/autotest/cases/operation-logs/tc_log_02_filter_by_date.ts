/**
 * TC-LOG-02: Filter operation logs by date range
 * Purpose: Verify date range filter works on operation logs
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-LOG-02',
  title: 'Filter operation logs by date range',
  module: 'operation-logs',
  priority: 'P1',
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Login as CEO and navigate to logs', action: 'navigate', to: '/operation-logs' },
    { id: 2, desc: 'Select date range', action: 'fill', locator: { by: 'placeholder', value: '开始日期' }, value: '2026-01-01' },
    { id: 3, desc: 'Select end date', action: 'fill', locator: { by: 'placeholder', value: '结束日期' }, value: '2026-12-31' },
    { id: 4, desc: 'Click search', action: 'click', locator: { by: 'role', role: 'button', name: '搜索' } },
    { id: 5, desc: 'Assert table loaded', action: 'assert', check: { type: 'text_visible', value: '操作人' } },
  ],
  expect: {
    result: 'pass',
    url: '/operation-logs',
  },
} satisfies TestCase;
