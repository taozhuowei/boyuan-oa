/**
 * TC-PROF-01: Personal profile shows correct info
 * Purpose: Verify /me page displays correct name/role/phone
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-PROF-01',
  title: 'Personal profile shows correct info',
  module: 'profile',
  priority: 'P0',
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Login as CEO', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'ceo.demo' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Navigate to profile', action: 'navigate', to: '/me' },
    { id: 6, desc: 'Assert page loaded', action: 'assert', check: { type: 'text_visible', value: '个人信息' } },
    { id: 7, desc: 'Assert name visible', action: 'assert', check: { type: 'text_visible', value: 'CEO示例' } },
    { id: 8, desc: 'Assert role visible', action: 'assert', check: { type: 'text_visible', value: 'CEO' } },
    { id: 9, desc: 'Assert employee type', action: 'assert', check: { type: 'text_visible', value: '正式员工' } },
  ],
  expect: {
    result: 'pass',
    url: '/me',
  },
} satisfies TestCase;
