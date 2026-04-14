import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-PROJ-13',
  title: 'COMPLETED 状态项目尝试变回 ACTIVE 被操作拒绝或提示',
  module: 'project',
  priority: 'P1',
  credentials: { username: 'pm.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到已完成项目详情页', action: 'navigate', to: '/projects/1' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击更改状态', action: 'click', locator: { by: 'role', role: 'button', name: '更改状态' } },
    { id: 9, desc: '尝试选择进行中', action: 'click', locator: { by: 'text', value: '进行中' } },
    { id: 10, desc: '断言操作被拒绝', action: 'assert', check: { type: 'toast_contains', value: '不能' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
