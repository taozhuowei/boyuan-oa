import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-CON-08',
  title: '工时为 0 时提交',
  module: 'construction',
  priority: 'P1',
  tags: [],
  credentials: { username: 'worker.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到施工日志页面', action: 'navigate', to: '/construction/logs' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '点击新增施工日志按钮', action: 'click', locator: { by: 'text', value: '新增日志', exact: false } },
    { id: 4, desc: '填写日期', action: 'fill', locator: { by: 'label', value: '日期', exact: false }, value: '{{today}}' },
    { id: 5, desc: '填写工程内容', action: 'fill', locator: { by: 'label', value: '工程内容', exact: false }, value: '测试零工时' },
    { id: 6, desc: '填写工时 0', action: 'fill', locator: { by: 'label', value: '工时', exact: false }, value: '0' },
    { id: 7, desc: '点击提交按钮', action: 'click', locator: { by: 'text', value: '提交', exact: false } },
    { id: 8, desc: '断言校验报错', action: 'assert', check: { type: 'text_visible', value: '工时' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
