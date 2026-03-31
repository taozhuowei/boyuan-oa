/**
 * 工作台数据配置
 * 用途：提供演示数据和模块配置
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

export const pendingItems = [
  { title: '工伤补偿最终审核', category: '审批中心', owner: '首席经营者', deadline: '今天 18:00 前', priority: '高' },
  { title: '第三区现场日志初审', category: '项目管理', owner: '项目经理', deadline: '今天 17:30 前', priority: '中' },
  { title: '薪资异议复核', category: '薪资结算', owner: '财务', deadline: '明天 10:00 前', priority: '中' },
  { title: '新员工入职建档', category: '员工档案', owner: '综合管理部', deadline: '后天 09:00 前', priority: '低' }
]

export const progressStats = [
  { label: '待办完成率', value: '76%', note: '较昨日提升 8%' },
  { label: '薪资进度', value: '68%', note: '预结算校验中' },
  { label: '在建项目', value: '14', note: '关键项目 3 个' },
  { label: '归档完成度', value: '85%', note: '缺 12 份确认' }
]

export const moduleEntries = [
  { key: 'forms', title: '表单中心', icon: 'receipt', path: '/pages/forms/index', roles: ['employee', 'worker', 'finance', 'project_manager', 'ceo'] },
  { key: 'employees', title: '员工管理', icon: 'people', path: '/pages/employees/index', roles: ['employee', 'worker', 'finance', 'project_manager', 'ceo'] },
  { key: 'projects', title: '项目管理', icon: 'business', path: '/pages/projects/index', roles: ['employee', 'worker', 'project_manager', 'ceo'] },
  { key: 'directory', title: '通讯录导入', icon: 'person', path: '/pages/directory/index', roles: ['finance', 'ceo'] },
  { key: 'payroll', title: '薪资结算', icon: 'attach-money', roles: ['employee', 'worker', 'finance', 'ceo'] },
  { key: 'role', title: '角色管理', icon: 'settings', path: '/pages/role/index', roles: ['ceo'] }
]

export const noticeItems = [
  { title: '企业微信导入结果已生成', time: '10 分钟前', source: '系统消息' },
  { title: '预结算校验发现 2 项考勤问题', time: '35 分钟前', source: '财务系统' },
  { title: '主干项目材料到货记录不完整', time: '今天 09:20', source: '项目管理' }
]

export const reminderItems = [
  { category: '项目附件', detail: '7 天后过期，建议提前导出。', level: '高' },
  { category: '薪资凭证', detail: '14 天后冻结归档，请尽快确认。', level: '中' },
  { category: '现场照片', detail: '30 天后进入清理队列。', level: '低' }
]
