/**
 * TC-ROLE-02: CEO creates custom role
 * Purpose: Verify CEO can create a custom role
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ROLE-02',
  title: 'CEO creates custom role',
  module: 'role',
  priority: 'P1',
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Login and navigate to roles', action: 'navigate', to: '/role' },
    { id: 2, desc: 'Click add role button', action: 'click', locator: { by: 'role', role: 'button', name: '新增角色' } },
    { id: 3, desc: 'Fill role code', action: 'fill', locator: { by: 'label', value: '角色编码' }, value: 'test_role_auto' },
    { id: 4, desc: 'Fill role name', action: 'fill', locator: { by: 'label', value: '角色名称' }, value: '测试自定义角色' },
    { id: 5, desc: 'Fill description', action: 'fill', locator: { by: 'label', value: '描述' }, value: '自动化测试用角色' },
    { id: 6, desc: 'Select status', action: 'select', locator: { by: 'label', value: '状态' }, value: '1' },
    { id: 7, desc: 'Click save', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 8, desc: 'Assert success', action: 'assert', check: { type: 'text_visible', value: '测试自定义角色' } },
    { id: 9, desc: 'Assert custom tag', action: 'assert', check: { type: 'text_visible', value: '自定义' } },
  ],
  expect: {
    result: 'pass',
    url: '/role',
  },
} satisfies TestCase;
