import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-INJ-05',
  title: '工长代录工伤申报（第二角色）',
  module: 'injury',
  priority: 'P2',
  credentials: { username: 'worker.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到工伤页', action: 'navigate', to: '/injury' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击代录工伤', action: 'click', locator: { by: 'role', role: 'button', name: '代录工伤' } },
    { id: 9, desc: '选择劳工', action: 'click', locator: { by: 'label', value: '劳工' } },
    { id: 10, desc: '输入受伤部位', action: 'fill', locator: { by: 'placeholder', value: '受伤部位' }, value: '右腿' },
    { id: 11, desc: '点击提交', action: 'click', locator: { by: 'role', role: 'button', name: '提交' } },
    { id: 12, desc: '断言提交成功', action: 'assert', check: { type: 'toast_contains', value: '提交成功' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
