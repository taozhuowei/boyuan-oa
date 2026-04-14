import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-PAY-06',
  title: '员工输入 PIN 码确认工资条，状态变 SIGNED',
  module: 'payroll',
  priority: 'P0',
  tags: ['smoke'],
  credentials: { username: 'employee.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到工资条页', action: 'navigate', to: '/payroll/slip' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '断言列表有待确认工资条', action: 'assert', check: { type: 'text_visible', value: '待确认' } },
    { id: 9, desc: '点击查看工资条', action: 'click', locator: { by: 'text', value: '查看' } },
    { id: 10, desc: '等待详情页加载', action: 'wait', ms: 1500 },
    { id: 11, desc: '断言显示薪资明细', action: 'assert', check: { type: 'text_visible', value: '应发工资' } },
    { id: 12, desc: '输入 PIN 码', action: 'fill', locator: { by: 'placeholder', value: 'PIN' }, value: '123456' },
    { id: 13, desc: '点击确认按钮', action: 'click', locator: { by: 'role', role: 'button', name: '确认' } },
    { id: 14, desc: '断言确认成功提示', action: 'assert', check: { type: 'toast_contains', value: '确认成功' } },
    { id: 15, desc: '断言状态变为已确认', action: 'assert', check: { type: 'text_visible', value: '已确认' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
