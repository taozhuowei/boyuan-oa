import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-PROJ-10',
  title: '为项目添加劳工成员，分配工长第二角色',
  module: 'project',
  priority: 'P2',
  credentials: { username: 'pm.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到项目成员页', action: 'navigate', to: '/projects/1/members' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击添加成员', action: 'click', locator: { by: 'role', role: 'button', name: '添加成员' } },
    { id: 9, desc: '选择劳工', action: 'click', locator: { by: 'label', value: '成员' } },
    { id: 10, desc: '选择worker.demo', action: 'click', locator: { by: 'text', value: 'worker.demo' } },
    { id: 11, desc: '选择角色', action: 'click', locator: { by: 'label', value: '角色' } },
    { id: 12, desc: '选择工长', action: 'click', locator: { by: 'text', value: '工长' } },
    { id: 13, desc: '点击保存按钮', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 14, desc: '断言添加成功', action: 'assert', check: { type: 'toast_contains', value: '添加成功' } },
    { id: 15, desc: '断言成员在列表中', action: 'assert', check: { type: 'text_visible', value: 'worker.demo' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
