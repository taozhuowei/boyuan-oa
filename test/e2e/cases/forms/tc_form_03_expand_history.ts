import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-FORM-03',
  title: '点击某条记录展开审批历史（节点时间线）',
  module: 'forms',
  priority: 'P1',
  tags: ['deferred'],
  credentials: { username: 'pm.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到表单中心页面', action: 'navigate', to: '/forms' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '点击第一条记录展开详情', action: 'click', locator: { by: 'css', value: '.ant-table-row:first-child' } },
    { id: 4, desc: '等待展开内容加载', action: 'wait', ms: 800 },
    { id: 5, desc: '断言审批时间线可见', action: 'assert', check: { type: 'text_visible', value: '审批历史' } },
    { id: 6, desc: '断言节点时间线可见', action: 'assert', check: { type: 'element_visible', locator: { by: 'css', value: '.timeline' } } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
