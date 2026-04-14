import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-PAY-17',
  title: '两个财务账号同时尝试对同一周期发起结算',
  module: 'payroll',
  priority: 'P1',
  credentials: { username: 'finance.demo', password: '123456' },
  steps: [
    { id: 1, desc: '财务A登录', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名A', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码A', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录A', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到薪资页', action: 'navigate', to: '/payroll' },
    { id: 7, desc: '并发点击结算', action: 'parallel', contexts: [
      [
        { id: 71, desc: '点击结算按钮A', action: 'click', locator: { by: 'role', role: 'button', name: '结算' } },
      ],
      [
        { id: 72, desc: '快速重复点击结算B', action: 'rapid', repeat: 3, interval: 100, step: { id: 721, desc: '点击结算', action: 'click', locator: { by: 'role', role: 'button', name: '结算' } } },
      ],
    ]},
    { id: 8, desc: '断言只有一个成功', action: 'assert', check: { type: 'text_visible', value: '结算中' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
