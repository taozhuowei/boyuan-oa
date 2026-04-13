/**
 * TC-AUTH-02: HR correct login
 * Purpose: Verify HR can login successfully with valid credentials
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-AUTH-02',
  title: 'HR correct login',
  module: 'auth',
  priority: 'P0',
  credentials: {
    username: 'hr.demo',
    password: '123456',
  },
  steps: [
    {
      action: 'navigate',
      target: '/login',
    },
    {
      action: 'fill',
      target: { by: 'label', value: '用户名' },
      value: 'hr.demo',
    },
    {
      action: 'fill',
      target: { by: 'label', value: '密码' },
      value: '123456',
    },
    {
      action: 'click',
      target: { by: 'role', value: 'button', name: '登录' },
    },
    {
      action: 'assert',
      target: { by: 'url_contains', value: '/dashboard' },
    },
    {
      action: 'assert',
      target: { by: 'text', value: 'hr.demo' },
    },
  ],
  expect: {
    result: 'pass',
    url: '/dashboard',
  },
} satisfies TestCase;
