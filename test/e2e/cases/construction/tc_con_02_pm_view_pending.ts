import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-CON-02',
  title: 'PM 在待审批列表看到施工日志',
  module: 'construction',
  priority: 'P0',
  tags: ['smoke'],
  credentials: { username: 'pm.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到待审批页面', action: 'navigate', to: '/todos' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '断言存在施工日志待审批记录', action: 'assert', check: { type: 'text_visible', value: '施工日志' } },
    { id: 4, desc: '断言记录状态为待审批', action: 'assert', check: { type: 'text_visible', value: '待审批' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
