import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-INJ-01',
  title: '劳工自主提交工伤申报（含受伤部位/原因/附件）',
  module: 'injury',
  priority: 'P1',
  credentials: { username: 'worker.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到工伤申报页', action: 'navigate', to: '/injury' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击新增工伤', action: 'click', locator: { by: 'role', role: 'button', name: '新增工伤' } },
    { id: 9, desc: '输入受伤部位', action: 'fill', locator: { by: 'placeholder', value: '受伤部位' }, value: '右手手背' },
    { id: 10, desc: '输入受伤原因', action: 'fill', locator: { by: 'placeholder', value: '受伤原因' }, value: '操作机器不当' },
    { id: 11, desc: '上传附件', action: 'click', locator: { by: 'role', role: 'button', name: '上传' } },
    { id: 12, desc: '点击提交按钮', action: 'click', locator: { by: 'role', role: 'button', name: '提交' } },
    { id: 13, desc: '断言提交成功', action: 'assert', check: { type: 'toast_contains', value: '提交成功' } },
    { id: 14, desc: '断言状态为待审批', action: 'assert', check: { type: 'text_visible', value: '待审批' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
