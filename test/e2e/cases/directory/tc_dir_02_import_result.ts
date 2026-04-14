import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-DIR-02',
  title: '确认导入后展示导入结果（成功条数）',
  module: 'directory',
  priority: 'P0',
  tags: ['smoke', 'deferred'],
  credentials: { username: 'hr.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到通讯录导入页面', action: 'navigate', to: '/directory/import' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '粘贴合法 CSV 内容', action: 'fill', locator: { by: 'label', value: 'CSV 内容', exact: false }, value: 'name,phone,department\n王五,13800138003,技术部' },
    { id: 4, desc: '点击预览按钮', action: 'click', locator: { by: 'text', value: '预览', exact: false } },
    { id: 5, desc: '等待预览加载', action: 'wait', ms: 1000 },
    { id: 6, desc: '点击确认导入按钮', action: 'click', locator: { by: 'text', value: '确认导入', exact: false } },
    { id: 7, desc: '等待导入结果', action: 'wait', ms: 1500 },
    { id: 8, desc: '断言导入成功提示', action: 'assert', check: { type: 'toast_contains', value: '导入成功' } },
    { id: 9, desc: '断言成功条数为 1', action: 'assert', check: { type: 'text_visible', value: '1' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
