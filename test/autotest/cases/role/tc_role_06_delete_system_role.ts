/**
 * TC-ROLE-06: Cannot delete system role
 * Purpose: Verify system roles cannot be deleted
 */

import type { TestCase } from '../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-ROLE-06',
  title: 'Cannot delete system role',
  module: 'role',
  priority: 'P0',
  credentials: {
    username: 'ceo.demo',
    password: '123456',
  },
  steps: [
    { id: 1, desc: 'Login and navigate to roles', action: 'navigate', to: '/role' },
    { id: 2, desc: 'Find CEO role row', action: 'assert', check: { type: 'text_visible', value: 'CEO' } },
    { id: 3, desc: 'Assert no delete button for system role', action: 'assert', check: { type: 'element_not_visible', selector: '删除' } },
  ],
  expect: {
    result: 'pass',
    url: '/role',
  },
} satisfies TestCase;
