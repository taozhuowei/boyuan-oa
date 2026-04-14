/**
 * TC-AUTH-07: Logout redirects to login page
 * Purpose: Verify clicking logout redirects to login page
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-AUTH-07',
  title: 'Logout redirects to login page',
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
    { id: 5, desc: 'Assert URL contains dashboard', action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
    { id: 6, desc: 'Click user avatar or menu', action: 'click', locator: { by: 'role', role: 'button', name: 'ceo.demo' } },
    { id: 7, desc: 'Click logout button', action: 'click', locator: { by: 'text', value: '退出登录' } },
    { id: 8, desc: 'Assert URL is login page', action: 'assert', check: { type: 'url_equals', value: '/login' } },
    { id: 9, desc: 'Assert login form visible', action: 'assert', check: { type: 'text_visible', value: '登录' } },
  ],
  expect: {
    result: 'pass',
    url: '/login',
  },
} satisfies TestCase;
