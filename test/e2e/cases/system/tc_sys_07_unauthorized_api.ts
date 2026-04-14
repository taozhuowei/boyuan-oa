import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-SYS-07',
  title: '员工 Token 访问 /api/payroll/cycles（仅财务权限）返回 403',
  module: 'system',
  priority: 'P0',
  tags: ['smoke'],
  credentials: { username: 'employee.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'label', value: '用户名', exact: false }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'label', value: '密码', exact: false }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录', action: 'click', locator: { by: 'text', value: '登录', exact: false } },
    { id: 5, desc: '等待登录完成', action: 'wait', ms: 1500 },
    { id: 6, desc: '调用薪资周期 API', action: 'api_call', method: 'GET', endpoint: '/api/payroll/cycles', body: {} },
    { id: 7, desc: '断言返回 403', action: 'assert', check: { type: 'http_status', value: 403 } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
