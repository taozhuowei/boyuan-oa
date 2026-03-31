/**
 * 工作台数据配置
 * 用途：按角色提供功能入口和演示数据
 */

export const userProfile = {
  username: 'ceo.demo',
  name: '陈明远',
  role: 'ceo',
  status: '在线',
  department: '运营管理部',
  employeeType: '普通员工',
  updatedAt: '今天 09:40'
}

// 角色名称映射
export const roleNameMap: Record<string, string> = {
  employee: '员工',
  worker: '劳工',
  finance: '财务',
  project_manager: '项目经理',
  ceo: '首席经营者'
}

// 功能入口 - 按角色严格过滤（去掉"系统"字样）
export const systemEntries = [
  {
    key: 'attendance',
    title: '考勤',
    icon: 'schedule',
    path: '/pages/attendance/index',
    roles: ['employee', 'worker', 'finance', 'project_manager', 'ceo'],
    description: '请假、加班申请与审批'
  },
  {
    key: 'payroll',
    title: '薪酬',
    icon: 'attach-money',
    path: '/pages/payroll/index',
    roles: ['employee', 'worker', 'finance', 'ceo'],
    description: '工资条、工伤申报与薪资管理'
  },
  {
    key: 'projects',
    title: '项目',
    icon: 'business',
    path: '/pages/projects/index',
    roles: ['employee', 'worker', 'project_manager', 'ceo'],
    description: '项目管理与施工阶段'
  },
  {
    key: 'employees',
    title: '员工',
    icon: 'people',
    path: '/pages/employees/index',
    roles: ['finance', 'ceo'],
    description: '员工档案管理'
  },
  {
    key: 'role',
    title: '角色',
    icon: 'settings',
    path: '/pages/role/index',
    roles: ['finance', 'ceo'],
    description: '权限配置'
  }
]

// 获取角色可见的功能入口
export function getVisibleSystems(role: string) {
  return systemEntries.filter(item => item.roles.includes(role))
}

// 待办事项 - 按角色展示
export const getPendingItems = (role: string) => {
  const roleItems: Record<string, any[]> = {
    project_manager: [
      { title: '请假申请初审', category: '考勤', owner: '项目经理', deadline: '今天 18:00', priority: '高' },
      { title: '施工阶段审批', category: '项目', owner: '项目经理', deadline: '今天 17:30', priority: '中' }
    ],
    ceo: [
      { title: '请假申请终审', category: '考勤', owner: 'CEO', deadline: '今天 18:00', priority: '高' },
      { title: '施工阶段确认', category: '项目', owner: 'CEO', deadline: '明天 10:00', priority: '中' }
    ],
    finance: [
      { title: '薪资异议复核', category: '薪酬', owner: '财务', deadline: '明天 10:00', priority: '中' }
    ],
    employee: [],
    worker: []
  }
  
  return roleItems[role] || []
}

// 通知消息
export const noticeItems = [
  { title: '2024年3月工资条已发布', time: '35 分钟前', source: '薪酬' },
  { title: '施工阶段待确认提醒', time: '今天 09:20', source: '项目' }
]

// 提醒事项
export const reminderItems = [
  { category: '薪资凭证', detail: '14 天后冻结归档，请尽快确认。', level: '中' }
]
