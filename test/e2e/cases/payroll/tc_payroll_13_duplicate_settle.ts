import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-PAY-13',
  title: '窗口未关闭时重复结算被拒绝',
  module: 'payroll',
  priority: 'P1',
  credentials: { username: 'finance.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到薪资管理页', action: 'navigate', to: '/payroll' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击结算按钮', action: 'click', locator: { by: 'role', role: 'button', name: '结算' } },
    { id: 9, desc: '点击结算按钮第二次', action: 'click', locator: { by: 'role', role: 'button', name: '结算' } },
    { id: 10, desc: '断言重复结算提示', action: 'assert', check: { type: 'toast_contains', value: '结算中' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
