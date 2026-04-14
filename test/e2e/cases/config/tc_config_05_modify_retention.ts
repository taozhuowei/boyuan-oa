import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-CFG-05',
  title: 'CEO 修改某模块数据保留期，保存成功',
  module: 'config',
  priority: 'P1',
  credentials: { username: 'ceo.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到数据保留期配置页', action: 'navigate', to: '/config/retention' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '清空保留期输入框', action: 'click', locator: { by: 'css', value: 'input[type="number"]' } },
    { id: 9, desc: '输入新保留期值', action: 'fill', locator: { by: 'css', value: 'input[type="number"]' }, value: '24' },
    { id: 10, desc: '点击保存按钮', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 11, desc: '断言保存成功提示', action: 'assert', check: { type: 'toast_contains', value: '保存成功' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
