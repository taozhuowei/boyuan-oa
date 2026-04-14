import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-OPLOG-03',
  title: '列表分页，翻页正常',
  module: 'operation_logs',
  priority: 'P1',
  tags: ['deferred'],
  credentials: { username: 'ceo.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到操作日志页面', action: 'navigate', to: '/operation-logs' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '断言分页组件可见', action: 'assert', check: { type: 'element_visible', locator: { by: 'css', value: '.ant-pagination' } } },
    { id: 4, desc: '点击下一页', action: 'click', locator: { by: 'css', value: '.ant-pagination-next' } },
    { id: 5, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 6, desc: '断言当前页码为 2', action: 'assert', check: { type: 'element_visible', locator: { by: 'css', value: '.ant-pagination-item-active[title="2"]' } } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
