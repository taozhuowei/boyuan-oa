import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-DIR-01',
  title: '粘贴合法 CSV，预览界面展示字段和行数',
  module: 'directory',
  priority: 'P0',
  tags: ['smoke', 'deferred'],
  credentials: { username: 'hr.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到通讯录导入页面', action: 'navigate', to: '/directory/import' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '粘贴合法 CSV 内容', action: 'fill', locator: { by: 'label', value: 'CSV 内容', exact: false }, value: 'name,phone,department\n张三,13800138001,技术部\n李四,13800138002,销售部' },
    { id: 4, desc: '点击预览按钮', action: 'click', locator: { by: 'text', value: '预览', exact: false } },
    { id: 5, desc: '等待预览加载', action: 'wait', ms: 1000 },
    { id: 6, desc: '断言预览表格可见', action: 'assert', check: { type: 'element_visible', locator: { by: 'css', value: '.csv-preview-table' } } },
    { id: 7, desc: '断言行数展示正确', action: 'assert', check: { type: 'text_visible', value: '2' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
