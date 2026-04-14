import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-CON-06',
  title: '施工日志列表支持按日期范围筛选',
  module: 'construction',
  priority: 'P1',
  tags: [],
  credentials: { username: 'pm.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到施工日志列表页', action: 'navigate', to: '/construction/logs' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '填写开始日期', action: 'fill', locator: { by: 'label', value: '开始日期', exact: false }, value: '{{week_start}}' },
    { id: 4, desc: '填写结束日期', action: 'fill', locator: { by: 'label', value: '结束日期', exact: false }, value: '{{week_end}}' },
    { id: 5, desc: '点击查询按钮', action: 'click', locator: { by: 'text', value: '查询', exact: false } },
    { id: 6, desc: '等待筛选结果加载', action: 'wait', ms: 1000 },
    { id: 7, desc: '断言列表有数据', action: 'assert', check: { type: 'element_visible', locator: { by: 'css', value: '.ant-table-row' } } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
