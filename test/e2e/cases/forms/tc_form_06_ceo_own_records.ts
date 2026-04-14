import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-FORM-06',
  title: 'CEO 访问 /forms，看到的是自己的记录而非全体',
  module: 'forms',
  priority: 'P1',
  tags: ['deferred'],
  credentials: { username: 'ceo.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到表单中心页面', action: 'navigate', to: '/forms' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '断言页面标题可见', action: 'assert', check: { type: 'text_visible', value: '表单中心' } },
    { id: 4, desc: '断言列表仅显示 CEO 自己的记录', action: 'assert', check: { type: 'text_visible', value: 'ceo.demo' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
