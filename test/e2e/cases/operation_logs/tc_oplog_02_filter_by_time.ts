import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-OPLOG-02',
  title: '按时间范围筛选（今天/本周/自定义区间）',
  module: 'operation_logs',
  priority: 'P1',
  tags: ['deferred'],
  credentials: { username: 'ceo.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到操作日志页面', action: 'navigate', to: '/operation-logs' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '选择今天筛选', action: 'click', locator: { by: 'text', value: '今天', exact: false } },
    { id: 4, desc: '等待筛选结果加载', action: 'wait', ms: 1000 },
    { id: 5, desc: '断言列表有数据', action: 'assert', check: { type: 'element_visible', locator: { by: 'css', value: '.ant-table-row' } } },
    { id: 6, desc: '选择本周筛选', action: 'click', locator: { by: 'text', value: '本周', exact: false } },
    { id: 7, desc: '等待筛选结果加载', action: 'wait', ms: 1000 },
    { id: 8, desc: '断言列表有数据', action: 'assert', check: { type: 'element_visible', locator: { by: 'css', value: '.ant-table-row' } } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
