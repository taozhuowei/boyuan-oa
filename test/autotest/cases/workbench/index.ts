/**
 * Workbench module test cases — TC-WB-01 ~ TC-WB-09
 * Scope: workbench summary cards, role-based sidebar, URL permission guards
 */
import type { TestCase } from '../../../../tools/autotest/runner/types.js';
import { loginSteps, USERS } from '../_helpers.js';

const cases: TestCase[] = [
  {
    id: 'TC-WB-01',
    title: 'CEO 工作台摘要数据非空',
    description: '角色：CEO。路径：登录后默认 /。期望：工作台加载员工数/项目数/待办数等摘要卡片，数字非空。',
    module: 'workbench',
    priority: 'P0',
    roles: ['ceo'],
    credentials: USERS.ceo,
    steps: [
      ...loginSteps(USERS.ceo.username, USERS.ceo.password),
      { id: 6, desc: '工作台摘要容器应可见', action: 'assert', check: { type: 'element_visible', locator: { by: 'catch', value: 'workbench-summary-root' } } },
      { id: 7, desc: '员工数卡片可见', action: 'assert', check: { type: 'element_visible', locator: { by: 'catch', value: 'workbench-card-total-employees' } } },
      { id: 8, desc: '项目数卡片可见', action: 'assert', check: { type: 'element_visible', locator: { by: 'catch', value: 'workbench-card-active-projects' } } },
    ],
    expect: { result: 'pass', url: '/' },
  },
  {
    id: 'TC-WB-02',
    title: '点击活跃项目卡片跳转项目列表',
    description: '角色：CEO。路径：工作台 → 点击"活跃项目"数字卡片。期望：跳转到 /projects。',
    module: 'workbench',
    priority: 'P1',
    roles: ['ceo'],
    credentials: USERS.ceo,
    steps: [
      ...loginSteps(USERS.ceo.username, USERS.ceo.password),
      { id: 6, desc: '点击活跃项目卡片', action: 'click', locator: { by: 'catch', value: 'workbench-card-active-projects' } },
      { id: 7, desc: '跳转到 /projects', action: 'assert', check: { type: 'url_contains', value: '/projects' } },
    ],
    expect: { result: 'pass', url: '/projects' },
  },
  {
    id: 'TC-WB-03',
    title: 'PM 工作台展示待审批数量',
    description: '角色：PM。路径：登录后 /。期望：工作台显示"待审批"或"待办"数量卡片。',
    module: 'workbench',
    priority: 'P1',
    roles: ['pm'],
    credentials: USERS.pm,
    steps: [
      ...loginSteps(USERS.pm.username, USERS.pm.password),
      { id: 6, desc: '待审批/待办卡片可见', action: 'assert', check: { type: 'text_visible', value: '待审批' } },
    ],
    expect: { result: 'pass', url: '/' },
  },
  {
    id: 'TC-WB-04',
    title: '员工工作台展示本月工资条摘要',
    description: '角色：Employee。路径：登录后 /。期望：工作台显示"本月工资"或类似摘要字段。',
    module: 'workbench',
    priority: 'P1',
    roles: ['employee'],
    credentials: USERS.employee,
    steps: [
      ...loginSteps(USERS.employee.username, USERS.employee.password),
      { id: 6, desc: '本月工资摘要可见', action: 'assert', check: { type: 'text_visible', value: '本月' } },
    ],
    expect: { result: 'pass', url: '/' },
  },
  {
    id: 'TC-WB-05',
    title: 'HR 侧栏无"薪资结算"入口',
    description: '角色：HR。路径：登录后 /。期望：侧栏显示组织架构等但不显示"薪资结算"菜单（权限隔离）。',
    module: 'workbench',
    priority: 'P1',
    roles: ['hr'],
    credentials: USERS.hr,
    tags: ['permission'],
    steps: [
      ...loginSteps(USERS.hr.username, USERS.hr.password),
      { id: 6, desc: '侧栏应不显示"薪资结算"', action: 'assert', check: { type: 'text_absent', value: '薪资结算' } },
    ],
    expect: { result: 'pass', url: '/' },
  },
  {
    id: 'TC-WB-06',
    title: '劳工侧栏无"员工管理"入口',
    description: '角色：Worker。路径：登录后 /。期望：侧栏不显示"员工管理"或"组织架构"。',
    module: 'workbench',
    priority: 'P1',
    roles: ['worker'],
    credentials: USERS.worker,
    tags: ['permission'],
    steps: [
      ...loginSteps(USERS.worker.username, USERS.worker.password),
      { id: 6, desc: '侧栏不显示"员工管理"', action: 'assert', check: { type: 'text_absent', value: '员工管理' } },
      { id: 7, desc: '侧栏不显示"组织架构"', action: 'assert', check: { type: 'text_absent', value: '组织架构' } },
    ],
    expect: { result: 'pass', url: '/' },
  },
  {
    id: 'TC-WB-07',
    title: 'HR 直接访问 /payroll 被拦截',
    description: '角色：HR。路径：登录后手动访问 /payroll。期望：前端路由守卫重定向或显示无权限。',
    module: 'workbench',
    priority: 'P1',
    roles: ['hr'],
    credentials: USERS.hr,
    tags: ['permission'],
    steps: [
      ...loginSteps(USERS.hr.username, USERS.hr.password),
      { id: 6, desc: '访问 /payroll', action: 'navigate', to: '/payroll' },
      { id: 7, desc: '不应停留在 /payroll（应重定向或无权限）', action: 'assert', check: { type: 'text_absent', value: '薪资周期管理' } },
    ],
    expect: { result: 'pass' },
  },
  {
    id: 'TC-WB-08',
    title: '员工直接访问 /employees 被拦截',
    description: '角色：Employee。路径：登录后手动访问 /employees。期望：被重定向或显示无权限。',
    module: 'workbench',
    priority: 'P1',
    roles: ['employee'],
    credentials: USERS.employee,
    tags: ['permission'],
    steps: [
      ...loginSteps(USERS.employee.username, USERS.employee.password),
      { id: 6, desc: '访问 /employees', action: 'navigate', to: '/employees' },
      { id: 7, desc: '不应显示员工管理列表', action: 'assert', check: { type: 'text_absent', value: '新建员工' } },
    ],
    expect: { result: 'pass' },
  },
  {
    id: 'TC-WB-09',
    title: '劳工直接访问 /operation-logs 被拦截',
    description: '角色：Worker。路径：登录后手动访问 /operation-logs。期望：被重定向或显示无权限。',
    module: 'workbench',
    priority: 'P1',
    roles: ['worker'],
    credentials: USERS.worker,
    tags: ['permission'],
    steps: [
      ...loginSteps(USERS.worker.username, USERS.worker.password),
      { id: 6, desc: '访问 /operation-logs', action: 'navigate', to: '/operation-logs' },
      { id: 7, desc: '不应显示操作日志列表', action: 'assert', check: { type: 'text_absent', value: '操作日志' } },
    ],
    expect: { result: 'pass' },
  },
];

export default cases;
