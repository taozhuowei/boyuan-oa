import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-NOTIF-02',
  title: '通知中心未读消息有红点徽章',
  module: 'notification',
  priority: 'P1',
  tags: [],
  credentials: { username: 'employee.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到工作台', action: 'navigate', to: '/dashboard' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '断言通知铃铛有未读红点', action: 'assert', check: { type: 'element_visible', locator: { by: 'css', value: '[data-testid="notification-badge"]' } } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
