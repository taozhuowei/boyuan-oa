import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-SYS-09',
  title: '前端跨域请求非 /api 路径的后端内部接口被 CORS 拒绝',
  module: 'system',
  priority: 'P2',
  steps: [
    { id: 1, desc: '导航到首页', action: 'navigate', to: '/' },
    { id: 2, desc: '尝试调用后端内部接口（非 /api 路径）', action: 'api_call', method: 'GET', endpoint: '/actuator/health', body: {} },
    { id: 3, desc: '断言请求被 CORS 拒绝（0 或 403）', action: 'assert', check: { type: 'http_status', value: 0 } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
