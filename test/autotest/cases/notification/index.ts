/**
 * Notification module test cases — TC-NOTIF-01 ~ TC-NOTIF-06
 * Scope: notification center, unread badge, mark as read, ordering
 */
import type { TestCase } from '../../../../tools/autotest/runner/types.js';
import { loginSteps, USERS } from '../_helpers.js';

const cases: TestCase[] = [
  {
    id: 'TC-NOTIF-01',
    title: 'PM 审批通过请假后，员工收到通知',
    description: '角色：employee。路径：PM 审批通过后，员工登录并进入 /notifications。期望：通知列表中存在"请假审批通过"类通知。',
    module: 'notification',
    priority: 'P0',
    roles: ['employee'],
    credentials: USERS.employee,
    steps: [
      ...loginSteps(USERS.employee.username, USERS.employee.password),
      { id: 6, desc: '访问 /notifications', action: 'navigate', to: '/notifications' },
      { id: 7, desc: '页面标题"通知中心"可见', action: 'assert', check: { type: 'text_visible', value: '通知中心' } },
      { id: 8, desc: '列表中存在审批通过通知', action: 'assert', check: { type: 'text_visible', value: '审批通过' } },
    ],
    expect: { result: 'pass', url: '/notifications' },
  },
  {
    id: 'TC-NOTIF-02',
    title: '通知中心未读消息有红点徽章',
    description: '角色：employee。路径：登录 → /notifications。期望：未读通知项左侧显示红点徽章。',
    module: 'notification',
    priority: 'P1',
    roles: ['employee'],
    credentials: USERS.employee,
    steps: [
      ...loginSteps(USERS.employee.username, USERS.employee.password),
      { id: 6, desc: '访问 /notifications', action: 'navigate', to: '/notifications' },
      { id: 7, desc: '未读通知项存在红点徽章', action: 'assert', check: { type: 'element_visible', locator: { by: 'catch', value: 'notification-badge-unread' } } },
    ],
    expect: { result: 'pass', url: '/notifications' },
  },
  {
    id: 'TC-NOTIF-03',
    title: '点击通知标记为已读，红点消失',
    description: '角色：employee。路径：/notifications → 点击第一条未读通知 → 查看详情。期望：通知变为已读，红点消失。',
    module: 'notification',
    priority: 'P1',
    roles: ['employee'],
    credentials: USERS.employee,
    steps: [
      ...loginSteps(USERS.employee.username, USERS.employee.password),
      { id: 6, desc: '访问 /notifications', action: 'navigate', to: '/notifications' },
      { id: 7, desc: '点击第一条未读通知', action: 'click', locator: { by: 'catch', value: 'notification-item-first' } },
      { id: 8, desc: '通知详情弹窗可见', action: 'assert', check: { type: 'text_visible', value: '通知详情' } },
      { id: 9, desc: '关闭弹窗后红点消失', action: 'assert', check: { type: 'element_hidden', locator: { by: 'catch', value: 'notification-badge-unread' } } },
    ],
    expect: { result: 'pass', url: '/notifications' },
  },
  {
    id: 'TC-NOTIF-04',
    title: '全部标记已读功能',
    description: '角色：employee。路径：/notifications → 点击"全部已读"。期望：所有通知变为已读状态，页面提示"已全部标记为已读"。',
    module: 'notification',
    priority: 'P1',
    roles: ['employee'],
    credentials: USERS.employee,
    steps: [
      ...loginSteps(USERS.employee.username, USERS.employee.password),
      { id: 6, desc: '访问 /notifications', action: 'navigate', to: '/notifications' },
      { id: 7, desc: '点击"全部已读"按钮', action: 'click', locator: { by: 'catch', value: 'notification-mark-all-read' } },
      { id: 8, desc: '出现成功提示', action: 'assert', check: { type: 'toast_contains', value: '已全部标记为已读' } },
      { id: 9, desc: '页面无未读红点', action: 'assert', check: { type: 'element_hidden', locator: { by: 'catch', value: 'notification-badge-unread' } } },
    ],
    expect: { result: 'pass', url: '/notifications' },
  },
  {
    id: 'TC-NOTIF-05',
    title: '通知按时间倒序排列',
    description: '角色：employee。路径：登录 → /notifications。期望：列表中通知按创建时间从新到旧排列。',
    module: 'notification',
    priority: 'P1',
    roles: ['employee'],
    credentials: USERS.employee,
    steps: [
      ...loginSteps(USERS.employee.username, USERS.employee.password),
      { id: 6, desc: '访问 /notifications', action: 'navigate', to: '/notifications' },
      { id: 7, desc: '截取通知列表截图供人工核对时间顺序', action: 'screenshot', label: 'notification-time-order' },
    ],
    expect: { result: 'pass', url: '/notifications' },
  },
  {
    id: 'TC-NOTIF-06',
    title: '薪资结算完成后员工收到工资条可查通知',
    description: '角色：employee。路径：薪资结算完成后，员工进入 /notifications。期望：列表中存在工资条/薪资结算相关通知。',
    module: 'notification',
    priority: 'P1',
    roles: ['employee'],
    credentials: USERS.employee,
    steps: [
      ...loginSteps(USERS.employee.username, USERS.employee.password),
      { id: 6, desc: '访问 /notifications', action: 'navigate', to: '/notifications' },
      { id: 7, desc: '列表中存在工资条通知', action: 'assert', check: { type: 'text_visible', value: '工资条' } },
    ],
    expect: { result: 'pass', url: '/notifications' },
  },
];

export default cases;
