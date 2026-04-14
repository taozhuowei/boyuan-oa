import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-OT-02',
  title: '员工提交加班补申报（需领导审批），PM 在待办看到',
  module: 'attendance_overtime',
  priority: 'P1',
  credentials: { username: 'employee.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到加班补申页', action: 'navigate', to: '/attendance/overtime/resubmit' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击新增补申', action: 'click', locator: { by: 'role', role: 'button', name: '新增补申' } },
    { id: 9, desc: '选择加班类型', action: 'click', locator: { by: 'label', value: '加班类型' } },
    { id: 10, desc: '选择节假日加班', action: 'click', locator: { by: 'text', value: '节假日加班' } },
    { id: 11, desc: '输入开始时间', action: 'fill', locator: { by: 'placeholder', value: '开始时间' }, value: '2026-04-12 09:00' },
    { id: 12, desc: '输入结束时间', action: 'fill', locator: { by: 'placeholder', value: '结束时间' }, value: '2026-04-12 18:00' },
    { id: 13, desc: '点击提交按钮', action: 'click', locator: { by: 'role', role: 'button', name: '提交' } },
    { id: 14, desc: '断言提交成功', action: 'assert', check: { type: 'toast_contains', value: '提交成功' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
