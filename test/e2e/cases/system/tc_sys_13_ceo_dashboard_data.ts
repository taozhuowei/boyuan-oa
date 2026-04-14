import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-SYS-13',
  title: 'CEO 工作台摘要数据全部非零（有种子数据时）',
  module: 'system',
  priority: 'P0',
  tags: ['smoke'],
  credentials: { username: 'ceo.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'label', value: '用户名', exact: false }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'label', value: '密码', exact: false }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录', action: 'click', locator: { by: 'text', value: '登录', exact: false } },
    { id: 5, desc: '等待工作台加载', action: 'wait', ms: 2000 },
    { id: 6, desc: '断言员工数大于0', action: 'assert', check: { type: 'text_visible', value: '员工' } },
    { id: 7, desc: '断言项目数大于0', action: 'assert', check: { type: 'text_visible', value: '项目' } },
    { id: 8, desc: '断言待办数非空', action: 'assert', check: { type: 'element_visible', locator: { by: 'css', value: '.todo-count' } } },
    { id: 9, desc: '截图保存', action: 'screenshot', label: 'ceo_dashboard' },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
