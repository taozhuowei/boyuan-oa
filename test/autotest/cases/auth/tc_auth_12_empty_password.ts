/**
 * TC-AUTH-12: Empty password validation
 * Purpose: Verify validation error when password is empty
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-AUTH-12',
  title: 'Empty password validation',
  module: 'auth',
  priority: 'P1',
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
      action: 'click',
      target: { by: 'role', value: 'button', name: '登录' },
    },
    {
      action: 'assert',
      target: { by: 'text', value: '请输入密码' },
    },
  ],
  expect: {
    result: 'pass',
  },
} satisfies TestCase;
