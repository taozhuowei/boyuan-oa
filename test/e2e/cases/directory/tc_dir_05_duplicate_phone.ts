import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-DIR-05',
  title: 'CSV 含重复手机号',
  module: 'directory',
  priority: 'P1',
  tags: ['deferred'],
  credentials: { username: 'hr.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到通讯录导入页面', action: 'navigate', to: '/directory/import' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '粘贴含重复手机号的 CSV', action: 'fill', locator: { by: 'label', value: 'CSV 内容', exact: false }, value: 'name,phone,department\n张三,13800138001,技术部\n李四,13800138001,销售部' },
    { id: 4, desc: '点击预览按钮', action: 'click', locator: { by: 'text', value: '预览', exact: false } },
    { id: 5, desc: '等待预览加载', action: 'wait', ms: 1000 },
    { id: 6, desc: '点击确认导入按钮', action: 'click', locator: { by: 'text', value: '确认导入', exact: false } },
    { id: 7, desc: '等待导入结果', action: 'wait', ms: 1500 },
    { id: 8, desc: '断言导入结果报告标注重复行', action: 'assert', check: { type: 'text_visible', value: '重复' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
