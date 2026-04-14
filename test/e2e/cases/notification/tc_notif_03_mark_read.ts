import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-NOTIF-03',
  title: '点击通知标记为已读，红点消失',
  module: 'notification',
  priority: 'P1',
  tags: [],
  credentials: { username: 'employee.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到通知中心', action: 'navigate', to: '/notifications' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '点击第一条未读通知', action: 'click', locator: { by: 'css', value: '.notification-item:first-child' } },
    { id: 4, desc: '等待状态更新', action: 'wait', ms: 800 },
    { id: 5, desc: '断言该通知标记为已读', action: 'assert', check: { type: 'text_visible', value: '已读' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
