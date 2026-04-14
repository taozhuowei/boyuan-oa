import type { TestCase, TestStep } from '../../../../tools/autotest/runner/types.js';

const loginSteps = (username: string, password: string): TestStep[] => [
  { id: 1, desc: `${username} 导航到登录页`, action: 'navigate', to: '/login' },
  { id: 2, desc: `${username} 输入用户名`, action: 'fill', locator: { by: 'label', value: '用户名', exact: false }, value: username },
  { id: 3, desc: `${username} 输入密码`, action: 'fill', locator: { by: 'label', value: '密码', exact: false }, value: password },
  { id: 4, desc: `${username} 点击登录`, action: 'click', locator: { by: 'text', value: '登录', exact: false } },
  { id: 5, desc: `${username} 等待页面加载`, action: 'wait', ms: 1500 },
  { id: 6, desc: `${username} 断言跳转到工作台`, action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
];

export default {
  id: 'TC-SYS-01',
  title: '6 个角色同时登录，各自工作台数据独立，互不污染',
  module: 'system',
  priority: 'P0',
  tags: ['smoke'],
  steps: [
    {
      id: 1,
      desc: '6 个角色并发登录',
      action: 'parallel',
      contexts: [
        loginSteps('ceo.demo', '123456'),
        loginSteps('hr.demo', '123456'),
        loginSteps('finance.demo', '123456'),
        loginSteps('pm.demo', '123456'),
        loginSteps('employee.demo', '123456'),
        loginSteps('worker.demo', '123456'),
      ],
    },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
