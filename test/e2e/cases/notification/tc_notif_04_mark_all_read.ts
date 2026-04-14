import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-NOTIF-04',
  title: '全部标记已读功能',
  module: 'notification',
  priority: 'P1',
  tags: [],
  credentials: { username: 'employee.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到通知中心', action: 'navigate', to: '/notifications' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '点击全部已读按钮', action: 'click', locator: { by: 'text', value: '全部已读', exact: false } },
    { id: 4, desc: '等待状态更新', action: 'wait', ms: 1000 },
    { id: 5, desc: '断言页面显示无未读通知', action: 'assert', check: { type: 'text_visible', value: '暂无未读通知' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
