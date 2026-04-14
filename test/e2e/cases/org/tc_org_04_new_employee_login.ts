/**
 * TC-ORG-04: New employee login with generated account
 * Purpose: Verify newly created employee can login with system generated account + initial password 123456
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ORG-04',
  title: 'New employee login with generated account',
  module: 'org',
  priority: 'P0',
  tags: ['smoke'],
  credentials: {
    username: 'hr.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'HR login', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to employees page', action: 'navigate', to: '/employees' },
    { id: 6, desc: 'Click add employee button', action: 'click', locator: { by: 'role', role: 'button', name: '新增' } },
    { id: 7, desc: 'Fill employee name', action: 'fill', locator: { by: 'label', value: '姓名' }, value: '测试登录员工' },
    { id: 8, desc: 'Select gender', action: 'select', locator: { by: 'label', value: '性别' }, value: '男' },
    { id: 9, desc: 'Fill phone number', action: 'fill', locator: { by: 'label', value: '手机号' }, value: '18800002222' },
    { id: 10, desc: 'Select department', action: 'select', locator: { by: 'label', value: '部门' }, value: '技术部' },
    { id: 11, desc: 'Select position', action: 'select', locator: { by: 'label', value: '岗位' }, value: '工程师' },
    { id: 12, desc: 'Select level', action: 'select', locator: { by: 'label', value: '等级' }, value: '初级' },
    { id: 13, desc: 'Select main role', action: 'select', locator: { by: 'label', value: '主角色' }, value: '员工' },
    { id: 14, desc: 'Click save button', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 15, desc: 'Assert success', action: 'assert', check: { type: 'toast_contains', value: '成功' } },
    { id: 16, desc: 'Get generated account from employee row', action: 'screenshot', label: 'employee_list' },
    { id: 17, desc: 'Logout', action: 'navigate', to: '/login' },
    { id: 18, desc: 'Fill new employee username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'emp' },
    { id: 19, desc: 'Fill initial password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 20, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 21, desc: 'Assert login success', action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
  ],
  expect: {
    result: 'pass',
    url: '/dashboard',
  },
} satisfies TestCase;
