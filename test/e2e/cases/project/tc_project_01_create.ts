import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-PROJ-01',
  title: 'CEO 创建新项目（完整字段），项目号格式 PRJ-YYYYMM-XXXX',
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
    { id: 6, desc: '导航到项目管理页', action: 'navigate', to: '/projects' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击新建项目', action: 'click', locator: { by: 'role', role: 'button', name: '新建项目' } },
    { id: 9, desc: '输入项目名称', action: 'fill', locator: { by: 'placeholder', value: '项目名称' }, value: '测试项目01' },
    { id: 10, desc: '输入项目描述', action: 'fill', locator: { by: 'placeholder', value: '描述' }, value: '这是一个测试项目' },
    { id: 11, desc: '选择开始日期', action: 'fill', locator: { by: 'placeholder', value: '开始日期' }, value: '2026-04-01' },
    { id: 12, desc: '选择预计结束日期', action: 'fill', locator: { by: 'placeholder', value: '预计结束日期' }, value: '2026-06-30' },
    { id: 13, desc: '点击保存按钮', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 14, desc: '断言创建成功提示', action: 'assert', check: { type: 'toast_contains', value: '创建成功' } },
    { id: 15, desc: '断言项目号格式正确', action: 'assert', check: { type: 'text_visible', value: 'PRJ-' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
