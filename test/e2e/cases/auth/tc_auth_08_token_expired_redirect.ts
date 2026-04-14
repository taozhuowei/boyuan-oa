/**
 * TC-AUTH-08: Expired token redirects to login
 * Purpose: Verify after logout, manually accessing /dashboard redirects to login
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-AUTH-08',
  title: 'Expired token redirects to login',
  module: 'auth',
  priority: 'P1',
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Navigate to login page', action: 'navigate', to: '/login' },
    { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: 'Click user avatar or menu', action: 'click', locator: { by: 'role', role: 'button', name: 'ceo.demo' } },
    { id: 6, desc: 'Click logout button', action: 'click', locator: { by: 'text', value: '退出登录' } },
    { id: 7, desc: 'Manually navigate to dashboard', action: 'navigate', to: '/dashboard' },
    { id: 8, desc: 'Assert redirected to login page', action: 'assert', check: { type: 'url_equals', value: '/login' } },
  ],
  expect: {
    result: 'pass',
    url: '/login',
  },
} satisfies TestCase;
