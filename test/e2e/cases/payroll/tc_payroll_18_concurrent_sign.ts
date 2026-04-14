import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-PAY-18',
  title: '员工和财务同时操作同一工资条（员工确认，财务撤回）',
  module: 'payroll',
  priority: 'P2',
  credentials: { username: 'employee.demo', password: '123456' },
  steps: [
    { id: 1, desc: '员工登录', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到工资条页', action: 'navigate', to: '/payroll/slip' },
    { id: 7, desc: '点击查看', action: 'click', locator: { by: 'text', value: '查看' } },
    { id: 8, desc: '输入PIN', action: 'fill', locator: { by: 'placeholder', value: 'PIN' }, value: '123456' },
    { id: 9, desc: '并发操作', action: 'parallel', contexts: [
      [
        { id: 91, desc: '员工点击确认', action: 'click', locator: { by: 'role', role: 'button', name: '确认' } },
      ],
      [
        { id: 92, desc: '财务点击撤回', action: 'click', locator: { by: 'role', role: 'button', name: '撤回' } },
      ],
    ]},
    { id: 10, desc: '断言至少一人收到冲突提示', action: 'assert', check: { type: 'text_visible', value: '已处理' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
