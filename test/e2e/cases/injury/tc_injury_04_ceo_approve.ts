import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-INJ-04',
  title: 'CEO 审批通过工伤申报，状态变 APPROVED',
  module: 'injury',
  priority: 'P1',
  credentials: { username: 'ceo.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到待办页', action: 'navigate', to: '/todos' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击工伤审批项', action: 'click', locator: { by: 'text', value: '工伤' } },
    { id: 9, desc: '点击通过按钮', action: 'click', locator: { by: 'role', role: 'button', name: '通过' } },
    { id: 10, desc: '断言审批成功', action: 'assert', check: { type: 'toast_contains', value: '审批成功' } },
    { id: 11, desc: '断言状态变为已通过', action: 'assert', check: { type: 'text_visible', value: '已通过' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
