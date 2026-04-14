import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-PAY-03',
  title: '预检通过（无 PENDING_REVIEW 单，无 CALCULATING 状态）',
  module: 'payroll',
  priority: 'P0',
  tags: ['smoke'],
  credentials: { username: 'finance.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到薪资管理页', action: 'navigate', to: '/payroll' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击预检按钮', action: 'click', locator: { by: 'role', role: 'button', name: '预检' } },
    { id: 9, desc: '断言预检通过提示', action: 'assert', check: { type: 'toast_contains', value: '预检通过' } },
    { id: 10, desc: '断言结算按钮可点击', action: 'assert', check: { type: 'element_visible', locator: { by: 'role', role: 'button', name: '结算' } } },
  ],
  expect: { result: 'pass' },
};

export default tc;
