/**
 * TC-AUTH-20: Duplicate session handling
 * Purpose: Verify same account can login from two browsers without kicking out
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-AUTH-20',
  title: 'Duplicate session handling',
  module: 'auth',
  priority: 'P2',
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    {
      id: 1,
      desc: 'Login from two contexts',
      action: 'parallel',
      contexts: [
        [
          { id: 1, desc: 'First browser login', action: 'navigate', to: '/login' },
          { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
          { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
          { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
          { id: 5, desc: 'Assert first session', action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
        ],
        [
          { id: 1, desc: 'Second browser login', action: 'navigate', to: '/login' },
          { id: 2, desc: 'Fill username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: '{{credentials.username}}' },
          { id: 3, desc: 'Fill password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '{{credentials.password}}' },
          { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
          { id: 5, desc: 'Assert second session', action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
        ],
      ],
    },
  ],
  expect: {
    result: 'pass',
    url: '/dashboard',
  },
} satisfies TestCase;
