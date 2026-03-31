/**
 * 工作台数据配置
 * 用途：按角色提供系统入口和演示数据
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

// 系统入口 - 按角色严格过滤
export const systemEntries = [
  {
    key: 'attendance',
    title: '考勤系统',
    icon: 'schedule',
    path: '/pages/attendance/index',
    roles: ['employee', 'worker', 'finance', 'project_manager', 'ceo'],
    description: '请假、加班申请与审批'
  },
  {
    key: 'payroll',
    title: '薪酬系统',
    icon: 'attach-money',
    path: '/pages/payroll/index',
    roles: ['employee', 'worker', 'finance', 'ceo'],
    description: '工资条查看与薪资管理'
  },
  {
    key: 'logs',
    title: '施工日志',
    icon: 'construction',
    path: '/pages/logs/index',
    roles: ['worker', 'project_manager'],
    description: '施工日志与工伤申报'
  },
  {
    key: 'employees',
    title: '员工管理',
    icon: 'people',
    path: '/pages/employees/index',
    roles: ['finance', 'ceo'],
    description: '员工档案管理'
  },
  {
    key: 'projects',
    title: '项目管理',
    icon: 'business',
    path: '/pages/projects/index',
    roles: ['project_manager', 'ceo'],
    description: '项目信息查看'
  },
  {
    key: 'role',
    title: '角色管理',
    icon: 'settings',
    path: '/pages/role/index',
    roles: ['ceo'],
    description: '权限配置'
  }
]

// 获取角色可见的系统入口
export function getVisibleSystems(role: string) {
  return systemEntries.filter(item => item.roles.includes(role))
}

// 待办事项 - 按角色展示
export const getPendingItems = (role: string) => {
  const commonItems = [
    { title: '新员工入职建档', category: '员工档案', owner: '综合管理部', deadline: '后天 09:00 前', priority: '低' }
  ]
  
  const roleItems: Record<string, typeof commonItems> = {
    project_manager: [
      { title: '第三区现场日志初审', category: '施工日志', owner: '项目经理', deadline: '今天 17:30 前', priority: '中' },
      { title: '请假申请初审', category: '考勤审批', owner: '项目经理', deadline: '今天 18:00 前', priority: '高' }
    ],
    ceo: [
      { title: '工伤补偿最终审核', category: '施工日志', owner: '首席经营者', deadline: '今天 18:00 前', priority: '高' },
      { title: '请假申请终审', category: '考勤审批', owner: '首席经营者', deadline: '今天 17:30 前', priority: '中' }
    ],
    finance: [
      { title: '薪资异议复核', category: '薪酬系统', owner: '财务', deadline: '明天 10:00 前', priority: '中' }
    ],
    employee: [],
    worker: []
  }
  
  return [...(roleItems[role] || []), ...commonItems]
}

// 通知消息
export const noticeItems = [
  { title: '企业微信导入结果已生成', time: '10 分钟前', source: '系统消息' },
  { title: '2024年3月工资条已发布', time: '35 分钟前', source: '薪酬系统' },
  { title: '施工日志提交提醒', time: '今天 09:20', source: '施工日志' }
]

// 提醒事项
export const reminderItems = [
  { category: '项目附件', detail: '7 天后过期，建议提前导出。', level: '高' },
  { category: '薪资凭证', detail: '14 天后冻结归档，请尽快确认。', level: '中' },
  { category: '现场照片', detail: '30 天后进入清理队列。', level: '低' }
]
