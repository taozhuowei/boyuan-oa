import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-CFG-07',
  title: '保留期设为 0 或负数时表单校验报错',
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
    { id: 8, desc: '输入0', action: 'fill', locator: { by: 'css', value: 'input[type="number"]' }, value: '0' },
    { id: 9, desc: '点击保存按钮', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 10, desc: '断言校验错误提示', action: 'assert', check: { type: 'text_visible', value: '大于' } },
    { id: 11, desc: '输入负数', action: 'fill', locator: { by: 'css', value: 'input[type="number"]' }, value: '-1' },
    { id: 12, desc: '点击保存按钮', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 13, desc: '断言校验错误提示', action: 'assert', check: { type: 'text_visible', value: '大于' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
