import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-PAY-09',
  title: '社保模式切换（正常分摊/公司全额），计算结果对应变化',
  module: 'payroll',
  priority: 'P1',
  credentials: { username: 'finance.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到薪资管理页', action: 'navigate', to: '/payroll' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击社保模式选项', action: 'click', locator: { by: 'label', value: '社保模式' } },
    { id: 9, desc: '选择公司全额', action: 'click', locator: { by: 'text', value: '公司全额' } },
    { id: 10, desc: '点击保存按钮', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 11, desc: '断言保存成功提示', action: 'assert', check: { type: 'toast_contains', value: '保存成功' } },
    { id: 12, desc: '导航到工资条详情', action: 'navigate', to: '/payroll/slip/1' },
    { id: 13, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 14, desc: '断言公司全额计算正确', action: 'assert', check: { type: 'text_visible', value: '公司全额' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
