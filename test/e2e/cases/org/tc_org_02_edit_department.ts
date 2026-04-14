/**
 * TC-ORG-02: Edit department name
 * Purpose: Verify HR can edit department name
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ORG-02',
  title: 'Edit department name',
  module: 'org',
  priority: 'P1',
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
    { id: 6, desc: 'Click edit button on first department', action: 'click', locator: { by: 'role', role: 'button', name: '编辑' } },
    { id: 7, desc: 'Clear and fill new name', action: 'fill', locator: { by: 'label', value: '部门名称' }, value: '修改后部门' },
    { id: 8, desc: 'Click save button', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 9, desc: 'Assert success toast', action: 'assert', check: { type: 'toast_contains', value: '成功' } },
    { id: 10, desc: 'Assert new name in list', action: 'assert', check: { type: 'text_visible', value: '修改后部门' } },
  ],
  expect: {
    result: 'pass',
    url: '/departments',
  },
} satisfies TestCase;
