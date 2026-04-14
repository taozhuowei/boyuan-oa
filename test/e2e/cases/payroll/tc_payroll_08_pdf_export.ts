import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-PAY-08',
  title: '工资条 PDF 导出，文件可下载',
  module: 'payroll',
  priority: 'P1',
  credentials: { username: 'employee.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到工资条页', action: 'navigate', to: '/payroll/slip' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击导出按钮', action: 'click', locator: { by: 'role', role: 'button', name: '导出' } },
    { id: 9, desc: '断言导出成功提示', action: 'assert', check: { type: 'toast_contains', value: '导出成功' } },
    { id: 10, desc: '断言显示下载链接', action: 'assert', check: { type: 'element_visible', locator: { by: 'role', role: 'link', name: '下载' } } },
  ],
  expect: { result: 'pass' },
};

export default tc;
