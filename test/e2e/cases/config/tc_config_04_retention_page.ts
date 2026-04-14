import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-CFG-04',
  title: '数据保留期配置页加载并展示当前值',
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
    { id: 8, desc: '断言页面标题包含保留期', action: 'assert', check: { type: 'text_visible', value: '保留期' } },
    { id: 9, desc: '断言存在数值输入框', action: 'assert', check: { type: 'element_visible', locator: { by: 'role', role: 'spinbutton' } } },
  ],
  expect: { result: 'pass' },
};

export default tc;
