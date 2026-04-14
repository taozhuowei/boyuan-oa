import type { TestCase, TestStep } from '../../../../tools/autotest/runner/types.js';

const hrCreateSteps = (username: string): TestStep[] => [
  { id: 1, desc: `${username} 导航到登录页`, action: 'navigate', to: '/login' },
  { id: 2, desc: `${username} 输入用户名`, action: 'fill', locator: { by: 'label', value: '用户名', exact: false }, value: username },
  { id: 3, desc: `${username} 输入密码`, action: 'fill', locator: { by: 'label', value: '密码', exact: false }, value: '123456' },
  { id: 4, desc: `${username} 点击登录`, action: 'click', locator: { by: 'text', value: '登录', exact: false } },
  { id: 5, desc: `${username} 等待页面加载`, action: 'wait', ms: 1500 },
  { id: 6, desc: `${username} 导航到员工管理`, action: 'navigate', to: '/employees' },
  { id: 7, desc: `${username} 点击新增员工`, action: 'click', locator: { by: 'text', value: '新增员工', exact: false } },
  { id: 8, desc: `${username} 填写姓名`, action: 'fill', locator: { by: 'label', value: '姓名', exact: false }, value: `并发员工${username}` },
  { id: 9, desc: `${username} 填写手机号`, action: 'fill', locator: { by: 'label', value: '手机号', exact: false }, value: '18800009999' },
  { id: 10, desc: `${username} 选择性别`, action: 'select', locator: { by: 'label', value: '性别', exact: false }, value: '男' },
  { id: 11, desc: `${username} 点击保存`, action: 'click', locator: { by: 'text', value: '保存', exact: false } },
  { id: 12, desc: `${username} 等待结果`, action: 'wait', ms: 1500 },
];

export default {
  id: 'TC-SYS-03',
  title: '两名 HR 同时创建相同手机号的员工，系统返回 409 至少一个',
  module: 'system',
  priority: 'P1',
  tags: [],
  steps: [
    {
      id: 1,
      desc: '两名 HR 并发创建员工',
      action: 'parallel',
      contexts: [hrCreateSteps('hr.demo'), hrCreateSteps('hr.demo')],
    },
    { id: 2, desc: '断言至少一个提示手机号已存在', action: 'assert', check: { type: 'text_visible', value: '已存在' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
