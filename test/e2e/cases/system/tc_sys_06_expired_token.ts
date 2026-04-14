import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-SYS-06',
  title: '手动构造过期 Token 访问受保护接口返回 401',
  module: 'system',
  priority: 'P0',
  tags: ['smoke'],
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '设置过期 token 到 localStorage', action: 'api_call', method: 'POST', endpoint: '/api/dev/set-storage', body: { key: 'token', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJleHBpcmVkIiwiZXhwIjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' } },
    { id: 3, desc: '导航到员工列表页', action: 'navigate', to: '/employees' },
    { id: 4, desc: '等待页面响应', action: 'wait', ms: 1000 },
    { id: 5, desc: '断言跳转到登录页', action: 'assert', check: { type: 'url_contains', value: '/login' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
