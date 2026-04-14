import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-CON-09',
  title: '员工（非劳工/工长）尝试提交施工日志',
  module: 'construction',
  priority: 'P1',
  tags: [],
  credentials: { username: 'employee.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到施工日志页面', action: 'navigate', to: '/construction/logs' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '断言无新增日志按钮或403提示', action: 'assert', check: { type: 'text_visible', value: '403' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
