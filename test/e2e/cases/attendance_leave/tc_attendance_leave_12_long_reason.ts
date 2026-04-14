import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-LVE-12',
  title: '请假原因超长（> 500 字符）时截断或校验提示',
  module: 'attendance_leave',
  priority: 'P2',
  credentials: { username: 'employee.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到请假申请页', action: 'navigate', to: '/attendance/leave' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击新增请假按钮', action: 'click', locator: { by: 'role', role: 'button', name: '新增请假' } },
    { id: 9, desc: '输入超长原因', action: 'fill', locator: { by: 'placeholder', value: '请输入原因' }, value: 'a'.repeat(501) },
    { id: 10, desc: '点击提交按钮', action: 'click', locator: { by: 'role', role: 'button', name: '提交' } },
    { id: 11, desc: '断言校验或截断提示', action: 'assert', check: { type: 'text_visible', value: '超出' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
