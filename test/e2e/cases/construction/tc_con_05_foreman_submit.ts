import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-CON-05',
  title: '工长提交施工日志（第二角色权限）',
  module: 'construction',
  priority: 'P1',
  tags: [],
  credentials: { username: 'worker.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到施工日志页面', action: 'navigate', to: '/construction/logs' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '点击新增施工日志按钮', action: 'click', locator: { by: 'text', value: '新增日志', exact: false } },
    { id: 4, desc: '填写日期', action: 'fill', locator: { by: 'label', value: '日期', exact: false }, value: '{{today}}' },
    { id: 5, desc: '填写工程内容', action: 'fill', locator: { by: 'label', value: '工程内容', exact: false }, value: '工长代填：现场安全检查' },
    { id: 6, desc: '填写工时', action: 'fill', locator: { by: 'label', value: '工时', exact: false }, value: '4' },
    { id: 7, desc: '点击提交按钮', action: 'click', locator: { by: 'text', value: '提交', exact: false } },
    { id: 8, desc: '断言提交成功提示', action: 'assert', check: { type: 'toast_contains', value: '提交成功' } },
    { id: 9, desc: '断言列表出现待审批记录', action: 'assert', check: { type: 'text_visible', value: '待审批' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
