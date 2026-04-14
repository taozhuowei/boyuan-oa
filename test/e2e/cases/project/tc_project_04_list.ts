import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-PROJ-04',
  title: '项目列表展示所有项目，CEO 可查看全部',
  module: 'project',
  priority: 'P0',
  tags: ['smoke'],
  credentials: { username: 'ceo.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到项目列表页', action: 'navigate', to: '/projects' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '断言列表有数据', action: 'assert', check: { type: 'element_visible', locator: { by: 'css', value: 'table tbody tr' } } },
    { id: 9, desc: '断言显示项目名称', action: 'assert', check: { type: 'text_visible', value: '测试项目' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
