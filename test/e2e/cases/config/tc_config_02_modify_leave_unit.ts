import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-CFG-02',
  title: 'CEO 修改请假计量单位（半小时/1小时/半天/1天），前端重新加载后显示新值',
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
    { id: 8, desc: '点击请假计量单位下拉', action: 'click', locator: { by: 'label', value: '请假计量单位' } },
    { id: 9, desc: '选择半天', action: 'click', locator: { by: 'text', value: '半天' } },
    { id: 10, desc: '点击保存按钮', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 11, desc: '断言保存成功提示', action: 'assert', check: { type: 'toast_contains', value: '保存成功' } },
    { id: 12, desc: '重新加载页面', action: 'navigate', to: '/config' },
    { id: 13, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 14, desc: '断言页面显示半天', action: 'assert', check: { type: 'text_visible', value: '半天' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
