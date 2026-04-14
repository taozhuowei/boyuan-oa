/**
 * TC-DIR-01: Directory import preview
 * Purpose: Verify finance can paste CSV and see preview with validation
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-DIR-01',
  title: 'Directory import preview',
  module: 'directory',
  priority: 'P0',
  credentials: {
    username: 'finance.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Login as finance', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'finance.demo' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to directory import', action: 'navigate', to: '/directory' },
    { id: 6, desc: 'Assert page loaded', action: 'assert', check: { type: 'text_visible', value: '通讯录导入' } },
    { id: 7, desc: 'Paste CSV data', action: 'fill', locator: { by: 'placeholder', value: '在此粘贴 CSV 数据' }, value: '张三,13800138000,工程部\n李四,13900139000,财务部\n王五,invalid_phone,销售部' },
    { id: 8, desc: 'Click next step', action: 'click', locator: { by: 'role', role: 'button', name: '下一步' } },
    { id: 9, desc: 'Assert preview loaded', action: 'assert', check: { type: 'text_visible', value: '预览确认' } },
    { id: 10, desc: 'Assert statistics visible', action: 'assert', check: { type: 'text_visible', value: '共计' } },
    { id: 11, desc: 'Assert valid count', action: 'assert', check: { type: 'text_visible', value: '有效' } },
    { id: 12, desc: 'Assert invalid visible', action: 'assert', check: { type: 'text_visible', value: '无效' } },
    { id: 13, desc: 'Assert row visible', action: 'assert', check: { type: 'text_visible', value: '张三' } },
  ],
  expect: {
    result: 'pass',
    url: '/directory',
  },
} satisfies TestCase;
