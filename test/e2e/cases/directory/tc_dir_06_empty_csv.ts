import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-DIR-06',
  title: 'CSV 内容为空',
  module: 'directory',
  priority: 'P1',
  tags: ['deferred'],
  credentials: { username: 'hr.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到通讯录导入页面', action: 'navigate', to: '/directory/import' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '清空 CSV 内容输入框', action: 'fill', locator: { by: 'label', value: 'CSV 内容', exact: false }, value: '' },
    { id: 4, desc: '点击预览按钮', action: 'click', locator: { by: 'text', value: '预览', exact: false } },
    { id: 5, desc: '等待错误提示', action: 'wait', ms: 1000 },
    { id: 6, desc: '断言内容为空提示', action: 'assert', check: { type: 'text_visible', value: '内容为空' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
