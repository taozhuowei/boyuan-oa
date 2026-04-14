import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-OT-06',
  title: '加班类型未选择时校验报错',
  module: 'attendance_overtime',
  priority: 'P1',
  credentials: { username: 'employee.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到加班申报页', action: 'navigate', to: '/attendance/overtime' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击新增加班', action: 'click', locator: { by: 'role', role: 'button', name: '新增加班' } },
    { id: 9, desc: '输入开始时间', action: 'fill', locator: { by: 'placeholder', value: '开始时间' }, value: '2026-04-15 18:00' },
    { id: 10, desc: '输入结束时间', action: 'fill', locator: { by: 'placeholder', value: '结束时间' }, value: '2026-04-15 21:00' },
    { id: 11, desc: '点击提交按钮', action: 'click', locator: { by: 'role', role: 'button', name: '提交' } },
    { id: 12, desc: '断言类型校验错误', action: 'assert', check: { type: 'text_visible', value: '必填' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
