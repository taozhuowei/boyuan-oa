import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-INJ-06',
  title: '审批通过后 HR 可录入工伤理赔信息',
  module: 'injury',
  priority: 'P2',
  credentials: { username: 'hr.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到工伤理赔页', action: 'navigate', to: '/injury/claims' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击录入理赔', action: 'click', locator: { by: 'role', role: 'button', name: '录入理赔' } },
    { id: 9, desc: '输入理赔金额', action: 'fill', locator: { by: 'placeholder', value: '理赔金额' }, value: '5000' },
    { id: 10, desc: '点击保存', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 11, desc: '断言保存成功', action: 'assert', check: { type: 'toast_contains', value: '保存成功' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
