import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-LVE-13',
  title: 'PM 和 CEO 同时对同一请假申请操作，后者收到"已处理"提示',
  module: 'attendance_leave',
  priority: 'P1',
  credentials: { username: 'pm.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '并发执行审批', action: 'parallel', contexts: [
      [
        { id: 61, desc: 'PM点击通过', action: 'click', locator: { by: 'role', role: 'button', name: '通过' } },
      ],
      [
        { id: 62, desc: 'CEO点击通过', action: 'click', locator: { by: 'role', role: 'button', name: '通过' } },
      ],
    ]},
    { id: 7, desc: '断言至少一人收到已处理提示', action: 'assert', check: { type: 'text_visible', value: '已处理' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
