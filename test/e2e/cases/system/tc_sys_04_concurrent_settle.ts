import type { TestCase, TestStep } from '../../../../tools/autotest/runner/types.js';

const settleSteps = (cycleLabel: string): TestStep[] => [
  { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
  { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'label', value: '用户名', exact: false }, value: 'finance.demo' },
  { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'label', value: '密码', exact: false }, value: '123456' },
  { id: 4, desc: '点击登录', action: 'click', locator: { by: 'text', value: '登录', exact: false } },
  { id: 5, desc: '等待页面加载', action: 'wait', ms: 1500 },
  { id: 6, desc: '导航到薪资管理', action: 'navigate', to: '/payroll' },
  { id: 7, desc: '等待页面加载', action: 'wait', ms: 1000 },
  { id: 8, desc: `点击${cycleLabel}周期的结算按钮`, action: 'click', locator: { by: 'text', value: '结算', exact: false } },
  { id: 9, desc: '等待结算完成', action: 'wait', ms: 2000 },
  { id: 10, desc: '断言结算成功', action: 'assert', check: { type: 'toast_contains', value: '结算' } },
];

export default {
  id: 'TC-SYS-04',
  title: '财务同时对两个薪资周期发起结算（不同周期），互不干扰',
  module: 'system',
  priority: 'P2',
  tags: [],
  steps: [
    {
      id: 1,
      desc: '财务并发结算两个周期',
      action: 'parallel',
      contexts: [settleSteps('第一个'), settleSteps('第二个')],
    },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
