/**
 * TC-AUTH-19: Six roles login concurrently
 * Purpose: Verify 6 roles can login simultaneously with independent sessions
 */

import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-AUTH-19',
  title: 'Six roles login concurrently',
  module: 'auth',
  priority: 'P1',
  steps: [
    {
      id: 1,
      desc: 'All 6 roles login in parallel',
      action: 'parallel',
      contexts: [
        [
          { id: 1, desc: 'CEO login', action: 'navigate', to: '/login' },
          { id: 2, desc: 'Fill CEO username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'ceo.demo' },
          { id: 3, desc: 'Fill CEO password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
          { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
          { id: 5, desc: 'Assert CEO dashboard', action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
        ],
        [
          { id: 1, desc: 'HR login', action: 'navigate', to: '/login' },
          { id: 2, desc: 'Fill HR username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'hr.demo' },
          { id: 3, desc: 'Fill HR password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
          { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
          { id: 5, desc: 'Assert HR dashboard', action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
        ],
        [
          { id: 1, desc: 'Finance login', action: 'navigate', to: '/login' },
          { id: 2, desc: 'Fill Finance username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'finance.demo' },
          { id: 3, desc: 'Fill Finance password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
          { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
          { id: 5, desc: 'Assert Finance dashboard', action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
        ],
        [
          { id: 1, desc: 'PM login', action: 'navigate', to: '/login' },
          { id: 2, desc: 'Fill PM username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'pm.demo' },
          { id: 3, desc: 'Fill PM password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
          { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
          { id: 5, desc: 'Assert PM dashboard', action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
        ],
        [
          { id: 1, desc: 'Employee login', action: 'navigate', to: '/login' },
          { id: 2, desc: 'Fill Employee username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'employee.demo' },
          { id: 3, desc: 'Fill Employee password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
          { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
          { id: 5, desc: 'Assert Employee dashboard', action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
        ],
        [
          { id: 1, desc: 'Worker login', action: 'navigate', to: '/login' },
          { id: 2, desc: 'Fill Worker username', action: 'fill', locator: { by: 'label', value: '用户名' }, value: 'worker.demo' },
          { id: 3, desc: 'Fill Worker password', action: 'fill', locator: { by: 'label', value: '密码' }, value: '123456' },
          { id: 4, desc: 'Click login', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
          { id: 5, desc: 'Assert Worker dashboard', action: 'assert', check: { type: 'url_contains', value: '/dashboard' } },
        ],
      ],
    },
  ],
  expect: {
    result: 'pass',
    url: '/dashboard',
  },
} satisfies TestCase;
