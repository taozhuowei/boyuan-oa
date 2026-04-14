import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-OPLOG-05',
  title: '执行员工信息修改后日志出现对应记录',
  module: 'operation_logs',
  priority: 'P1',
  tags: ['deferred'],
  credentials: { username: 'ceo.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到操作日志页面', action: 'navigate', to: '/operation-logs' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '搜索员工编辑关键词', action: 'fill', locator: { by: 'label', value: '搜索', exact: false }, value: '编辑员工' },
    { id: 4, desc: '点击查询按钮', action: 'click', locator: { by: 'text', value: '查询', exact: false } },
    { id: 5, desc: '等待结果加载', action: 'wait', ms: 1000 },
    { id: 6, desc: '断言存在员工编辑日志记录', action: 'assert', check: { type: 'text_visible', value: '编辑' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
