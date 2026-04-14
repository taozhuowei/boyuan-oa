import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-SYS-05',
  title: '无 Token 直接调用 /api/employees 返回 401',
  module: 'system',
  priority: 'P0',
  tags: ['smoke'],
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '清除 localStorage 中的 token', action: 'api_call', method: 'POST', endpoint: '/api/dev/clear-storage', body: {} },
    { id: 3, desc: '直接调用员工列表 API', action: 'api_call', method: 'GET', endpoint: '/api/employees', body: {} },
    { id: 4, desc: '断言返回 401', action: 'assert', check: { type: 'http_status', value: 401 } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
