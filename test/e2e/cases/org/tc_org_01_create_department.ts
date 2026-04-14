/**
 * TC-ORG-01: Create department with full fields
 * Purpose: Verify HR can create department with all required fields
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ORG-01',
  title: 'Create department with full fields',
  module: 'org',
  priority: 'P0',
  tags: ['smoke'],
  credentials: {
    username: 'hr.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to departments page', action: 'navigate', to: '/departments' },
    { id: 6, desc: 'Click add department button', action: 'click', locator: { by: 'role', role: 'button', name: '新增' } },
    { id: 7, desc: 'Fill department name', action: 'fill', locator: { by: 'label', value: '部门名称' }, value: '测试部门' },
    { id: 8, desc: 'Fill department code', action: 'fill', locator: { by: 'label', value: '部门编码' }, value: 'TEST001' },
    { id: 9, desc: 'Click save button', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 10, desc: 'Assert success toast', action: 'assert', check: { type: 'toast_contains', value: '成功' } },
    { id: 11, desc: 'Assert department in list', action: 'assert', check: { type: 'text_visible', value: '测试部门' } },
  ],
  expect: {
    result: 'pass',
    url: '/departments',
  },
} satisfies TestCase;
