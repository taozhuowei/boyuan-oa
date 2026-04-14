import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-FORM-07',
  title: '空列表状态（无历史表单时）展示友好的空状态提示',
  module: 'forms',
  priority: 'P2',
  tags: ['deferred'],
  credentials: { username: 'pm.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到表单中心页面', action: 'navigate', to: '/forms' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '选择不存在的表单类型筛选', action: 'select', locator: { by: 'label', value: '表单类型', exact: false }, value: '不存在的类型' },
    { id: 4, desc: '点击查询按钮', action: 'click', locator: { by: 'text', value: '查询', exact: false } },
    { id: 5, desc: '等待筛选结果加载', action: 'wait', ms: 1000 },
    { id: 6, desc: '断言空状态提示可见', action: 'assert', check: { type: 'text_visible', value: '暂无数据' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
