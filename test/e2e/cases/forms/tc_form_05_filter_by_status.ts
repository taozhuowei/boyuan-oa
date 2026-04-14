import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-FORM-05',
  title: '表单中心支持按状态筛选（待审批/已通过/已驳回）',
  module: 'forms',
  priority: 'P1',
  tags: ['deferred'],
  credentials: { username: 'pm.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到表单中心页面', action: 'navigate', to: '/forms' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '选择状态筛选为已通过', action: 'select', locator: { by: 'label', value: '状态', exact: false }, value: '已通过' },
    { id: 4, desc: '点击查询按钮', action: 'click', locator: { by: 'text', value: '查询', exact: false } },
    { id: 5, desc: '等待筛选结果加载', action: 'wait', ms: 1000 },
    { id: 6, desc: '断言列表中均为已通过状态', action: 'assert', check: { type: 'text_visible', value: '已通过' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
