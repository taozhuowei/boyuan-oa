import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-NOTIF-06',
  title: '薪资结算完成后员工收到工资条可查通知',
  module: 'notification',
  priority: 'P1',
  tags: [],
  credentials: { username: 'employee.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到通知中心', action: 'navigate', to: '/notifications' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '断言存在工资条通知', action: 'assert', check: { type: 'text_visible', value: '工资条' } },
    { id: 4, desc: '断言通知包含可查看提示', action: 'assert', check: { type: 'text_visible', value: '查看' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
