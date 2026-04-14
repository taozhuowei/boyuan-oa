import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-PROJ-03',
  title: '更新项目进度百分比',
  module: 'project',
  priority: 'P1',
  credentials: { username: 'pm.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到项目详情页', action: 'navigate', to: '/projects/1' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击编辑进度', action: 'click', locator: { by: 'role', role: 'button', name: '编辑进度' } },
    { id: 9, desc: '输入进度百分比', action: 'fill', locator: { by: 'placeholder', value: '进度' }, value: '50' },
    { id: 10, desc: '点击保存按钮', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 11, desc: '断言保存成功提示', action: 'assert', check: { type: 'toast_contains', value: '保存成功' } },
    { id: 12, desc: '断言显示50%', action: 'assert', check: { type: 'text_visible', value: '50%' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
