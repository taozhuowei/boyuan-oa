import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-FORM-01',
  title: 'PM 进入表单中心，看到自己历史提交的所有表单',
  module: 'forms',
  priority: 'P0',
  tags: ['smoke', 'deferred'],
  credentials: { username: 'pm.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到表单中心页面', action: 'navigate', to: '/forms' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '断言页面标题可见', action: 'assert', check: { type: 'text_visible', value: '表单中心' } },
    { id: 4, desc: '断言列表有数据', action: 'assert', check: { type: 'element_visible', locator: { by: 'css', value: '.ant-table-row' } } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
