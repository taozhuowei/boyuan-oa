import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-CON-03',
  title: 'PM 批注并审批通过施工日志',
  module: 'construction',
  priority: 'P0',
  tags: ['smoke'],
  credentials: { username: 'pm.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到待审批页面', action: 'navigate', to: '/todos' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '点击第一条施工日志审批记录', action: 'click', locator: { by: 'css', value: '[data-testid="todo-row-construction"]' } },
    { id: 4, desc: '填写审批意见', action: 'fill', locator: { by: 'label', value: '审批意见', exact: false }, value: '同意，施工内容符合进度' },
    { id: 5, desc: '点击通过按钮', action: 'click', locator: { by: 'text', value: '通过', exact: false } },
    { id: 6, desc: '断言审批成功提示', action: 'assert', check: { type: 'toast_contains', value: '审批成功' } },
    { id: 7, desc: '断言状态变为已通过', action: 'assert', check: { type: 'text_visible', value: '已通过' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
