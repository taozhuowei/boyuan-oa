import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-CON-10',
  title: '重复提交同一日期的施工日志',
  module: 'construction',
  priority: 'P2',
  tags: [],
  credentials: { username: 'worker.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到施工日志页面', action: 'navigate', to: '/construction/logs' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '点击新增施工日志按钮', action: 'click', locator: { by: 'text', value: '新增日志', exact: false } },
    { id: 4, desc: '填写已存在的日期', action: 'fill', locator: { by: 'label', value: '日期', exact: false }, value: '{{today}}' },
    { id: 5, desc: '填写工程内容', action: 'fill', locator: { by: 'label', value: '工程内容', exact: false }, value: '重复提交测试' },
    { id: 6, desc: '填写工时', action: 'fill', locator: { by: 'label', value: '工时', exact: false }, value: '8' },
    { id: 7, desc: '点击提交按钮', action: 'click', locator: { by: 'text', value: '提交', exact: false } },
    { id: 8, desc: '断言存在重复提示或错误', action: 'assert', check: { type: 'text_visible', value: '已存在' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
