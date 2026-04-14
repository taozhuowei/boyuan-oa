import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-OPLOG-06',
  title: '财务账号访问 /operation-logs',
  module: 'operation_logs',
  priority: 'P0',
  tags: ['deferred'],
  credentials: { username: 'finance.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到操作日志页面', action: 'navigate', to: '/operation-logs' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '断言 403 提示', action: 'assert', check: { type: 'text_visible', value: '403' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
