import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-OPLOG-01',
  title: 'CEO 进入操作日志页，列表加载，显示操作人/类型/时间',
  module: 'operation_logs',
  priority: 'P0',
  tags: ['smoke', 'deferred'],
  credentials: { username: 'ceo.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到操作日志页面', action: 'navigate', to: '/operation-logs' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '断言页面标题可见', action: 'assert', check: { type: 'text_visible', value: '操作日志' } },
    { id: 4, desc: '断言列表加载', action: 'assert', check: { type: 'element_visible', locator: { by: 'css', value: '.ant-table-row' } } },
    { id: 5, desc: '断言列表显示操作人', action: 'assert', check: { type: 'text_visible', value: '操作人' } },
    { id: 6, desc: '断言列表显示操作类型', action: 'assert', check: { type: 'text_visible', value: '操作类型' } },
    { id: 7, desc: '断言列表显示时间', action: 'assert', check: { type: 'text_visible', value: '时间' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
