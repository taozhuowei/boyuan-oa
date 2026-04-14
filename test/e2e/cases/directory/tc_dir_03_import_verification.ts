import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-DIR-03',
  title: '导入后在员工列表中可查到新增人员',
  module: 'directory',
  priority: 'P0',
  tags: ['smoke', 'deferred'],
  credentials: { username: 'hr.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到通讯录导入页面', action: 'navigate', to: '/directory/import' },
    { id: 2, desc: '等待页面加载', action: 'wait', ms: 1000 },
    { id: 3, desc: '粘贴唯一 CSV 内容', action: 'fill', locator: { by: 'label', value: 'CSV 内容', exact: false }, value: 'name,phone,department\n导入测试员,13800138999,测试部' },
    { id: 4, desc: '点击预览按钮', action: 'click', locator: { by: 'text', value: '预览', exact: false } },
    { id: 5, desc: '等待预览加载', action: 'wait', ms: 1000 },
    { id: 6, desc: '点击确认导入按钮', action: 'click', locator: { by: 'text', value: '确认导入', exact: false } },
    { id: 7, desc: '等待导入完成', action: 'wait', ms: 1500 },
    { id: 8, desc: '导航到员工列表', action: 'navigate', to: '/employees' },
    { id: 9, desc: '搜索导入的员工姓名', action: 'fill', locator: { by: 'label', value: '搜索', exact: false }, value: '导入测试员' },
    { id: 10, desc: '点击查询按钮', action: 'click', locator: { by: 'text', value: '查询', exact: false } },
    { id: 11, desc: '等待结果加载', action: 'wait', ms: 1000 },
    { id: 12, desc: '断言列表中出现新增员工', action: 'assert', check: { type: 'text_visible', value: '导入测试员' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
