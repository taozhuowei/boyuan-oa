/**
 * TC-ORG-18: Concurrent edit employee info conflict handling
 * Purpose: Verify concurrent edits are handled properly
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ORG-18',
  title: 'Concurrent edit employee info conflict handling',
  module: 'org',
  priority: 'P2',
  steps: [
    {
      id: 1,
      desc: 'HR and CEO edit same employee concurrently',
      action: 'parallel',
      contexts: [
        [
          { id: 1, desc: 'HR login', action: 'navigate', to: '/login' },
          { id: 2, desc: 'HR fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'hr.demo' },
          { id: 3, desc: 'HR fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
          { id: 4, desc: 'HR click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
          { id: 5, desc: 'HR navigate to employees', action: 'navigate', to: '/employees' },
          { id: 6, desc: 'HR click edit', action: 'click', locator: { by: 'role', role: 'button', name: '编辑' } },
          { id: 7, desc: 'HR update phone', action: 'fill', locator: { by: 'label', value: '手机号' }, value: '11111111111' },
          { id: 8, desc: 'HR save', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
        ],
        [
          { id: 1, desc: 'CEO login', action: 'navigate', to: '/login' },
          { id: 2, desc: 'CEO fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'ceo.demo' },
          { id: 3, desc: 'CEO fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
          { id: 4, desc: 'CEO click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
          { id: 5, desc: 'CEO navigate to employees', action: 'navigate', to: '/employees' },
          { id: 6, desc: 'CEO click edit', action: 'click', locator: { by: 'role', role: 'button', name: '编辑' } },
          { id: 7, desc: 'CEO update phone', action: 'fill', locator: { by: 'label', value: '手机号' }, value: '22222222222' },
          { id: 8, desc: 'CEO save', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
        ],
      ],
    },
  ],
  expect: {
    result: 'pass',
    url: '/employees',
  },
} satisfies TestCase;
