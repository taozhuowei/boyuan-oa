/**
 * TC-ORG-08: Re-enable disabled account restores login
 * Purpose: Verify re-enabled employee can login again
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ORG-08',
  title: 'Re-enable disabled account restores login',
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
    { id: 5, desc: 'Navigate to employees page', action: 'navigate', to: '/employees' },
    { id: 6, desc: 'Click enable button on disabled employee', action: 'click', locator: { by: 'role', role: 'button', name: '启用' } },
    { id: 7, desc: 'Assert status changed to enabled', action: 'assert', check: { type: 'text_visible', value: '正常' } },
    { id: 8, desc: 'Logout and try login', action: 'navigate', to: '/login' },
    { id: 9, desc: 'Fill enabled username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'test.employee' },
    { id: 10, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
    { id: 11, desc: 'Click login button', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 12, desc: 'Assert login success', action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
  ],
  expect: {
    result: 'pass',
    url: '/dashboard',
  },
} satisfies TestCase;
