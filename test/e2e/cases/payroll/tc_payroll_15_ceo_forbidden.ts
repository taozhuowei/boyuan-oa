import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-PAY-15',
  title: 'CEO 直接访问 /payroll/settle（越权）返回 403',
  module: 'payroll',
  priority: 'P1',
  credentials: { username: 'ceo.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到薪资结算页', action: 'navigate', to: '/payroll/settle' },
    { id: 7, desc: '等待页面响应', action: 'wait', ms: 1500 },
    { id: 8, desc: '断言403错误', action: 'assert', check: { type: 'http_status', value: 403 } },
  ],
  expect: { result: 'pass' },
};

export default tc;
