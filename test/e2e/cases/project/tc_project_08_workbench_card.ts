import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-PROJ-08',
  title: '工作台活跃项目数字卡片点击跳转项目列表',
  module: 'project',
  priority: 'P1',
  credentials: { username: 'ceo.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到工作台', action: 'navigate', to: '/dashboard' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击活跃项目卡片', action: 'click', locator: { by: 'text', value: '活跃项目' } },
    { id: 9, desc: '等待页面跳转', action: 'wait', ms: 1500 },
    { id: 10, desc: '断言URL包含projects', action: 'assert', check: { type: 'url_contains', value: '/projects' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
