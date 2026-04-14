import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-PROJ-11',
  title: '项目名称为空时创建表单校验报错',
  module: 'project',
  priority: 'P1',
  credentials: { username: 'ceo.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到项目管理页', action: 'navigate', to: '/projects' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击新建项目', action: 'click', locator: { by: 'role', role: 'button', name: '新建项目' } },
    { id: 9, desc: '不输入项目名称直接保存', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 10, desc: '断言校验错误', action: 'assert', check: { type: 'text_visible', value: '必填' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
