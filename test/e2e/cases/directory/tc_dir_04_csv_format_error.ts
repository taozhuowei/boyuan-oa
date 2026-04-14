import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-DIR-04',
  title: 'CSV 格式错误（列数不匹配）',
  module: 'directory',
  priority: 'P0',
  tags: ['deferred'],
  credentials: { username: 'hr.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到通讯录导入页面', action: 'navigate', to: '/directory/import' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '粘贴列数不匹配的 CSV', action: 'fill', locator: { by: 'label', value: 'CSV 内容', exact: false }, value: 'name,phone\n张三,13800138001,技术部' },
    { id: 4, desc: '点击预览按钮', action: 'click', locator: { by: 'text', value: '预览', exact: false } },
    { id: 5, desc: '等待错误提示', action: 'wait', ms: 1000 },
    { id: 6, desc: '断言格式错误提示可见', action: 'assert', check: { type: 'text_visible', value: '格式错误' } },
    { id: 7, desc: '断言确认导入按钮不可用', action: 'assert', check: { type: 'element_hidden', locator: { by: 'text', value: '确认导入', exact: false } } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
