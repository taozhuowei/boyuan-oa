/**
 * Forms module test cases — TC-FORM-01 ~ TC-FORM-07
 * Scope: form center list, detail drawer, filters, empty state
 */
import type { TestCase } from '../../../../tools/autotest/runner/types.js';
import { loginSteps, USERS } from '../_helpers.js';

const cases: TestCase[] = [
  {
    id: 'TC-FORM-01',
    title: 'PM 进入表单中心，看到自己历史提交的所有表单',
    description: '角色：PM。路径：登录 → /forms。期望：表单中心页面加载，"我的提交"标签下显示 PM 历史提交的表单列表。',
    module: 'forms',
    priority: 'P0',
    roles: ['pm'],
    credentials: USERS.pm,
    steps: [
      ...loginSteps(USERS.pm.username, USERS.pm.password),
      { id: 6, desc: '访问 /forms', action: 'navigate', to: '/forms' },
      { id: 7, desc: '页面标题"表单中心"可见', action: 'assert', check: { type: 'text_visible', value: '表单中心' } },
      { id: 8, desc: '"我的提交"标签可见', action: 'assert', check: { type: 'text_visible', value: '我的提交' } },
      { id: 9, desc: '列表中至少有一条表单记录', action: 'assert', check: { type: 'element_visible', locator: { by: 'catch', value: 'forms-row-view-btn' } } },
    ],
    expect: { result: 'pass', url: '/forms' },
  },
  {
    id: 'TC-FORM-02',
    title: '劳工进入表单中心，看到施工日志和工伤申报记录',
    description: '角色：worker。路径：登录 → /forms。期望：表单列表中显示施工日志、工伤申报等 worker 相关记录。',
    module: 'forms',
    priority: 'P0',
    roles: ['worker'],
    credentials: USERS.worker,
    steps: [
      ...loginSteps(USERS.worker.username, USERS.worker.password),
      { id: 6, desc: '访问 /forms', action: 'navigate', to: '/forms' },
      { id: 7, desc: '页面标题"表单中心"可见', action: 'assert', check: { type: 'text_visible', value: '表单中心' } },
      { id: 8, desc: '列表包含"施工日志"类型记录', action: 'assert', check: { type: 'text_visible', value: '施工日志' } },
    ],
    expect: { result: 'pass', url: '/forms' },
  },
  {
    id: 'TC-FORM-03',
    title: '点击某条记录展开审批历史（节点时间线）',
    description: '角色：PM。路径：/forms → 点击记录"查看" → 展开详情抽屉。期望：抽屉中显示"审批历史"时间线。',
    module: 'forms',
    priority: 'P1',
    roles: ['pm'],
    credentials: USERS.pm,
    steps: [
      ...loginSteps(USERS.pm.username, USERS.pm.password),
      { id: 6, desc: '访问 /forms', action: 'navigate', to: '/forms' },
      { id: 7, desc: '点击第一条记录的"查看"按钮', action: 'click', locator: { by: 'catch', value: 'forms-row-view-btn' } },
      { id: 8, desc: '详情抽屉标题"表单详情"可见', action: 'assert', check: { type: 'text_visible', value: '表单详情' } },
      { id: 9, desc: '审批历史时间线可见', action: 'assert', check: { type: 'text_visible', value: '审批历史' } },
    ],
    expect: { result: 'pass', url: '/forms' },
  },
  {
    id: 'TC-FORM-04',
    title: '表单中心支持按类型筛选（请假/加班/施工日志等）',
    description: '角色：PM。路径：/forms → 使用类型筛选器选择"请假"。期望：列表仅显示请假类型表单。',
    module: 'forms',
    priority: 'P1',
    roles: ['pm'],
    credentials: USERS.pm,
    steps: [
      ...loginSteps(USERS.pm.username, USERS.pm.password),
      { id: 6, desc: '访问 /forms', action: 'navigate', to: '/forms' },
      { id: 7, desc: '点击类型筛选下拉框', action: 'click', locator: { by: 'catch', value: 'forms-filter-type' } },
      { id: 8, desc: '选择"请假"选项', action: 'click', locator: { by: 'text', value: '请假', exact: true } },
      { id: 9, desc: '列表中记录类型为请假', action: 'assert', check: { type: 'text_visible', value: '请假' } },
    ],
    expect: { result: 'pass', url: '/forms' },
  },
  {
    id: 'TC-FORM-05',
    title: '表单中心支持按状态筛选（待审批/已通过/已驳回）',
    description: '角色：PM。路径：/forms → 使用状态筛选器选择"已通过"。期望：列表仅显示已通过状态的表单。',
    module: 'forms',
    priority: 'P1',
    roles: ['pm'],
    credentials: USERS.pm,
    steps: [
      ...loginSteps(USERS.pm.username, USERS.pm.password),
      { id: 6, desc: '访问 /forms', action: 'navigate', to: '/forms' },
      { id: 7, desc: '点击状态筛选下拉框', action: 'click', locator: { by: 'catch', value: 'forms-filter-status' } },
      { id: 8, desc: '选择"已通过"选项', action: 'click', locator: { by: 'text', value: '已通过', exact: true } },
      { id: 9, desc: '列表中记录状态为已通过', action: 'assert', check: { type: 'text_visible', value: '已通过' } },
    ],
    expect: { result: 'pass', url: '/forms' },
  },
  {
    id: 'TC-FORM-06',
    title: 'CEO 访问 /forms，看到的是自己的记录而非全体',
    description: '角色：CEO。路径：登录 → /forms。期望：列表仅显示 CEO 自己提交的表单记录，不包含全体员工记录。',
    module: 'forms',
    priority: 'P1',
    roles: ['ceo'],
    credentials: USERS.ceo,
    steps: [
      ...loginSteps(USERS.ceo.username, USERS.ceo.password),
      { id: 6, desc: '访问 /forms', action: 'navigate', to: '/forms' },
      { id: 7, desc: '页面标题"表单中心"可见', action: 'assert', check: { type: 'text_visible', value: '表单中心' } },
      { id: 8, desc: '列表提交人列不包含其他员工姓名', action: 'screenshot', label: 'forms-ceo-self-only' },
    ],
    expect: { result: 'pass', url: '/forms' },
  },
  {
    id: 'TC-FORM-07',
    title: '空列表状态（无历史表单时）展示友好的空状态提示',
    description: '角色：employee（无历史表单）。路径：登录 → /forms。期望：列表为空时显示友好空状态提示（如"暂无数据"）。',
    module: 'forms',
    priority: 'P2',
    roles: ['employee'],
    credentials: USERS.employee,
    steps: [
      ...loginSteps(USERS.employee.username, USERS.employee.password),
      { id: 6, desc: '访问 /forms', action: 'navigate', to: '/forms' },
      { id: 7, desc: '页面显示空状态提示', action: 'assert', check: { type: 'text_visible', value: '暂无数据' } },
    ],
    expect: { result: 'pass', url: '/forms' },
  },
];

export default cases;
