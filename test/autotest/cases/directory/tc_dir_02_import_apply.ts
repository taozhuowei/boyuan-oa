/**
 * TC-DIR-02: Directory import apply
 * Purpose: Verify finance can confirm import and see success result
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-DIR-02',
  title: 'Directory import apply',
  module: 'directory',
  priority: 'P0',
  credentials: {
    username: 'finance.demo',
    password: '123456',
  },
  setup: 'Preview step completed with at least one valid record',
  steps: [
    { id: 1, desc: 'Login as finance and navigate to directory', action: 'navigate', to: '/directory' },
    { id: 2, desc: 'Paste CSV data', action: 'fill', locator: { by: 'placeholder', value: '在此粘贴 CSV 数据' }, value: '赵六,13700137000,技术部' },
    { id: 3, desc: 'Click next step', action: 'click', locator: { by: 'role', role: 'button', name: '下一步' } },
    { id: 4, desc: 'Assert preview loaded', action: 'assert', check: { type: 'text_visible', value: '有效' } },
    { id: 5, desc: 'Click confirm import', action: 'click', locator: { by: 'role', role: 'button', name: '确认导入' } },
    { id: 6, desc: 'Assert success result', action: 'assert', check: { type: 'text_visible', value: '导入成功' } },
    { id: 7, desc: 'Assert import count shown', action: 'assert', check: { type: 'text_visible', value: '共导入' } },
  ],
  expect: {
    result: 'pass',
    url: '/directory',
  },
} satisfies TestCase;
