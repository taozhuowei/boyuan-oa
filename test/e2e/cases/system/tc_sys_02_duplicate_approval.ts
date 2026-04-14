import type { TestCase, TestStep } from '../../../../tools/autotest/runner/types.js';

const approverSteps = (username: string): TestStep[] => [
  { id: 1, desc: `${username} 导航到登录页`, action: 'navigate', to: '/login' },
  { id: 2, desc: `${username} 输入用户名`, action: 'fill', locator: { by: 'label', value: '用户名', exact: false }, value: username },
  { id: 3, desc: `${username} 输入密码`, action: 'fill', locator: { by: 'label', value: '密码', exact: false }, value: '123456' },
  { id: 4, desc: `${username} 点击登录`, action: 'click', locator: { by: 'text', value: '登录', exact: false } },
  { id: 5, desc: `${username} 等待页面加载`, action: 'wait', ms: 1500 },
  { id: 6, desc: `${username} 导航到待审批`, action: 'navigate', to: '/todos' },
  { id: 7, desc: `${username} 点击第一条待审批记录`, action: 'click', locator: { by: 'css', value: '.ant-table-row:first-child' } },
  { id: 8, desc: `${username} 等待详情加载`, action: 'wait', ms: 800 },
  { id: 9, desc: `${username} 点击通过按钮`, action: 'click', locator: { by: 'text', value: '通过', exact: false } },
  { id: 10, desc: `${username} 等待结果`, action: 'wait', ms: 1000 },
];

export default {
  id: 'TC-SYS-02',
  title: 'CEO + PM 同时审批同一待办事项，后者收到"已处理"提示',
  module: 'system',
  priority: 'P1',
  tags: [],
  steps: [
    {
      id: 1,
      desc: 'CEO 和 PM 并发审批同一待办',
      action: 'parallel',
      contexts: [approverSteps('ceo.demo'), approverSteps('pm.demo')],
    },
    { id: 2, desc: '断言至少一个上下文出现已处理提示', action: 'assert', check: { type: 'text_visible', value: '已处理' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
