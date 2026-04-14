import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-PAY-01',
  title: '财务创建新薪资周期（选择月份）',
  module: 'payroll',
  priority: 'P0',
  tags: ['smoke'],
  credentials: { username: 'finance.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到薪资管理页', action: 'navigate', to: '/payroll' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击新建周期', action: 'click', locator: { by: 'role', role: 'button', name: '新建周期' } },
    { id: 9, desc: '选择月份', action: 'click', locator: { by: 'label', value: '月份' } },
    { id: 10, desc: '选择2026-04', action: 'click', locator: { by: 'text', value: '2026-04' } },
    { id: 11, desc: '点击确认按钮', action: 'click', locator: { by: 'role', role: 'button', name: '确认' } },
    { id: 12, desc: '断言创建成功提示', action: 'assert', check: { type: 'toast_contains', value: '创建成功' } },
    { id: 13, desc: '断言列表出现新周期', action: 'assert', check: { type: 'text_visible', value: '2026-04' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
