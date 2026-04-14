import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-NOTIF-01',
  title: 'PM 审批通过请假后，员工收到通知',
  module: 'notification',
  priority: 'P0',
  tags: ['smoke'],
  credentials: { username: 'employee.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到通知中心', action: 'navigate', to: '/notifications' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '断言存在请假审批通过通知', action: 'assert', check: { type: 'text_visible', value: '请假' } },
    { id: 4, desc: '断言通知内容包含已通过', action: 'assert', check: { type: 'text_visible', value: '已通过' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
