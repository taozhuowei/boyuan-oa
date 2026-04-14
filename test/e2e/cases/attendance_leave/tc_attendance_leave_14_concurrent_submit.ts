import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-LVE-14',
  title: '两名员工同时提交请假，互不影响，各自出现在列表中',
  module: 'attendance_leave',
  priority: 'P2',
  credentials: { username: 'employee.demo', password: '123456' },
  steps: [
    { id: 1, desc: '员工A登录并提交请假', action: 'parallel', contexts: [
      [
        { id: 11, desc: '导航到登录页', action: 'navigate', to: '/login' },
        { id: 12, desc: '输入用户名A', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: 'employee.demo' },
        { id: 13, desc: '输入密码A', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '123456' },
        { id: 14, desc: '登录', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
        { id: 15, desc: '等待', action: 'wait', ms: 1500 },
        { id: 16, desc: '进入请假页', action: 'navigate', to: '/attendance/leave' },
        { id: 17, desc: '新增请假', action: 'click', locator: { by: 'role', role: 'button', name: '新增请假' } },
        { id: 18, desc: '提交', action: 'click', locator: { by: 'role', role: 'button', name: '提交' } },
      ],
      [
        { id: 21, desc: '导航到登录页', action: 'navigate', to: '/login' },
        { id: 22, desc: '输入用户名B', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: 'employee.demo' },
        { id: 23, desc: '输入密码B', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '123456' },
        { id: 24, desc: '登录', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
        { id: 25, desc: '等待', action: 'wait', ms: 1500 },
        { id: 26, desc: '进入请假页', action: 'navigate', to: '/attendance/leave' },
        { id: 27, desc: '新增请假', action: 'click', locator: { by: 'role', role: 'button', name: '新增请假' } },
        { id: 28, desc: '提交', action: 'click', locator: { by: 'role', role: 'button', name: '提交' } },
      ],
    ]},
    { id: 2, desc: '断言两条记录都存在', action: 'assert', check: { type: 'text_visible', value: '待审批' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
