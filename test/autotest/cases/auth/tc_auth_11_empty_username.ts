/**
 * TC-AUTH-11: Empty username validation
 * Purpose: Verify validation error when username is empty
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-AUTH-11',
  title: 'Empty username validation',
  module: 'auth',
  priority: 'P1',
  steps: [
    {
      action: 'navigate',
      target: '/login',
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
      target: { by: 'text', value: '请输入用户名' },
    },
  ],
  expect: {
    result: 'pass',
  },
} satisfies TestCase;
