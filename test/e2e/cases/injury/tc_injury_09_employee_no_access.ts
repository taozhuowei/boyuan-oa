import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-INJ-09',
  title: '员工（非劳工）尝试提交工伤申报无该入口或 403',
  module: 'injury',
  priority: 'P1',
  credentials: { username: 'employee.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到工伤页', action: 'navigate', to: '/injury' },
    { id: 7, desc: '等待页面响应', action: 'wait', ms: 1500 },
    { id: 8, desc: '断言403或无权限', action: 'assert', check: { type: 'text_visible', value: '403' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
