import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-CFG-01',
  title: '系统配置页正常加载，显示请假/加班计量单位',
  module: 'config',
  priority: 'P0',
  tags: ['smoke', 'deferred'],
  credentials: { username: 'ceo.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到系统配置页', action: 'navigate', to: '/config' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '断言页面存在请假计量单位', action: 'assert', check: { type: 'text_visible', value: '请假' } },
    { id: 9, desc: '断言页面存在加班计量单位', action: 'assert', check: { type: 'text_visible', value: '加班' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
