import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-OPLOG-07',
  title: '搜索时间范围结束早于开始',
  module: 'operation_logs',
  priority: 'P1',
  tags: ['deferred'],
  credentials: { username: 'ceo.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到操作日志页面', action: 'navigate', to: '/operation-logs' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '填写开始时间', action: 'fill', locator: { by: 'label', value: '开始时间', exact: false }, value: '2026-04-13' },
    { id: 4, desc: '填写结束时间（早于开始）', action: 'fill', locator: { by: 'label', value: '结束时间', exact: false }, value: '2026-04-01' },
    { id: 5, desc: '点击查询按钮', action: 'click', locator: { by: 'text', value: '查询', exact: false } },
    { id: 6, desc: '等待校验提示', action: 'wait', ms: 800 },
    { id: 7, desc: '断言时间范围校验提示', action: 'assert', check: { type: 'text_visible', value: '结束时间' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
