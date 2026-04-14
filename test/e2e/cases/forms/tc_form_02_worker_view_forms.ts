import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-FORM-02',
  title: '劳工进入表单中心，看到施工日志和工伤申报记录',
  module: 'forms',
  priority: 'P0',
  tags: ['smoke', 'deferred'],
  credentials: { username: 'worker.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到表单中心页面', action: 'navigate', to: '/forms' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '断言页面标题可见', action: 'assert', check: { type: 'text_visible', value: '表单中心' } },
    { id: 4, desc: '断言存在施工日志记录', action: 'assert', check: { type: 'text_visible', value: '施工日志' } },
    { id: 5, desc: '断言存在工伤申报记录', action: 'assert', check: { type: 'text_visible', value: '工伤申报' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
