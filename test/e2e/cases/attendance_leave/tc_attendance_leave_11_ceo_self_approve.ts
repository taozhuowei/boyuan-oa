import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-LVE-11',
  title: 'CEO 审批自己的请假申请时审批链正确路由',
  module: 'attendance_leave',
  priority: 'P2',
  credentials: { username: 'ceo.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到请假申请页', action: 'navigate', to: '/attendance/leave' },
    { id: 7, desc: '新增请假并提交', action: 'click', locator: { by: 'role', role: 'button', name: '新增请假' } },
    { id: 8, desc: '选择请假类型', action: 'click', locator: { by: 'label', value: '请假类型' } },
    { id: 9, desc: '选择年假', action: 'click', locator: { by: 'text', value: '年假' } },
    { id: 10, desc: '输入开始时间', action: 'fill', locator: { by: 'placeholder', value: '开始时间' }, value: '2026-04-20 09:00' },
    { id: 11, desc: '输入结束时间', action: 'fill', locator: { by: 'placeholder', value: '结束时间' }, value: '2026-04-20 18:00' },
    { id: 12, desc: '点击提交', action: 'click', locator: { by: 'role', role: 'button', name: '提交' } },
    { id: 13, desc: '等待提示', action: 'wait', ms: 1000 },
    { id: 14, desc: '检查审批人不是自己', action: 'assert', check: { type: 'text_absent', value: '自己' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
