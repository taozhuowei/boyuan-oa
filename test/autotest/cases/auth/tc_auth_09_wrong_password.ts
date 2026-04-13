/**
 * TC-AUTH-09: Wrong password error
 * Purpose: Verify error message displays when password is incorrect
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-AUTH-09',
  title: 'Wrong password error',
  module: 'auth',
  priority: 'P0',
  steps: [
    {
      action: 'navigate',
      target: '/login',
    },
    {
      action: 'fill',
      target: { by: 'label', value: '用户名' },
      value: 'ceo.demo',
    },
    {
      action: 'fill',
      target: { by: 'label', value: '密码' },
      value: 'wrongpassword',
    },
    {
      action: 'click',
      target: { by: 'role', value: 'button', name: '登录' },
    },
    {
      action: 'assert',
      target: { by: 'text', value: '密码错误' },
    },
  ],
  expect: {
    result: 'pass',
  },
} satisfies TestCase;
