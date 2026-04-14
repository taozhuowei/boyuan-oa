import type { TestCase, TestStep } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-CON-04',
  title: 'PM 驳回施工日志，劳工收到通知',
  module: 'construction',
  priority: 'P1',
  tags: [],
  steps: [
    {
      id: 1,
      desc: 'PM 和 Worker 并行操作',
      action: 'parallel',
      contexts: [
        [
          { id: 101, desc: 'PM 导航到登录页', action: 'navigate', to: '/login' },
          { id: 102, desc: 'PM 输入用户名', action: 'fill', locator: { by: 'label', value: '用户名', exact: false }, value: 'pm.demo' },
          { id: 103, desc: 'PM 输入密码', action: 'fill', locator: { by: 'label', value: '密码', exact: false }, value: '123456' },
          { id: 104, desc: 'PM 点击登录', action: 'click', locator: { by: 'text', value: '登录', exact: false } },
          { id: 105, desc: 'PM 等待页面加载', action: 'wait', ms: 1500 },
          { id: 106, desc: 'PM 导航到待审批', action: 'navigate', to: '/todos' },
          { id: 107, desc: 'PM 点击施工日志记录', action: 'click', locator: { by: 'css', value: '[data-testid="todo-row-construction"]' } },
          { id: 108, desc: 'PM 填写驳回意见', action: 'fill', locator: { by: 'label', value: '审批意见', exact: false }, value: '工时填写有误，请修正' },
          { id: 109, desc: 'PM 点击驳回按钮', action: 'click', locator: { by: 'text', value: '驳回', exact: false } },
          { id: 110, desc: 'PM 断言审批成功', action: 'assert', check: { type: 'toast_contains', value: '审批成功' } },
        ],
        [
          { id: 201, desc: 'Worker 导航到登录页', action: 'navigate', to: '/login' },
          { id: 202, desc: 'Worker 输入用户名', action: 'fill', locator: { by: 'label', value: '用户名', exact: false }, value: 'worker.demo' },
          { id: 203, desc: 'Worker 输入密码', action: 'fill', locator: { by: 'label', value: '密码', exact: false }, value: '123456' },
          { id: 204, desc: 'Worker 点击登录', action: 'click', locator: { by: 'text', value: '登录', exact: false } },
          { id: 205, desc: 'Worker 等待页面加载', action: 'wait', ms: 1500 },
          { id: 206, desc: 'Worker 打开通知中心', action: 'click', locator: { by: 'testid', value: 'notification-bell' } },
          { id: 207, desc: 'Worker 等待通知加载', action: 'wait', ms: 2000 },
          { id: 208, desc: 'Worker 断言收到驳回通知', action: 'assert', check: { type: 'text_visible', value: '驳回' } },
        ],
      ],
    },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
