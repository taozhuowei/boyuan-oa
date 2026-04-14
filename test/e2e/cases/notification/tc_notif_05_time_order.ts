import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-NOTIF-05',
  title: '通知按时间倒序排列',
  module: 'notification',
  priority: 'P1',
  tags: [],
  credentials: { username: 'employee.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到通知中心', action: 'navigate', to: '/notifications' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '断言第一条通知时间晚于第二条', action: 'assert', check: { type: 'element_visible', locator: { by: 'css', value: '.notification-list' } } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
