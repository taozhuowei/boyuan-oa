/**
 * 认证与权限类型定义模块
 *
 * 模块职责：
 * - 提供登录认证、角色管理、权限控制相关的TypeScript类型定义
 * - 纯类型定义文件，无运行时依赖
 */

/**
 * 登录请求参数类型
 * @property identifier - 用户账号（工号或手机号）
 * @property password - 登录密码（明文传输，后端加密存储）
 */
export interface LoginPayload {
  identifier: string
  password: string
}

/**
 * 会话用户信息类型
 * 描述：登录成功后返回的完整用户信息结构，包含身份、组织、状态等字段
 * @property username - 用户唯一标识（账号）
 * @property displayName - 显示名称（真实姓名）
 * @property role - 角色代码（系统内部标识，如 'employee'）
 * @property roleName - 角色中文名称（界面展示用，如 '员工'）
 * @property department - 所属部门名称
 * @property employeeType - 员工类型（OFFICE/LABOR）
 * @property status - 当前在线状态（在线值守、离线等）
 * @property userId - 用户ID
 * @property positionId - 岗位ID
 * @property phone - 手机号（可选，用于换绑手机功能）
 */
export interface SessionUser {
  username: string
  displayName: string
  role: string
  roleName: string
  department: string
  employeeType: string
  status: string
  userId: number | null
  positionId: number | null
  phone?: string
  /** 当前用户持有的第二角色代码列表（如 FOREMAN / AFTER_SALES / MATERIAL_MANAGER）。来源：后端 second_role_assignment 表 */
  secondRoles?: string[]
}

/**
 * 登录结果类型
 * 描述：登录接口返回的完整数据结构
 * @property token - JWT认证令牌，后续请求需携带此令牌
 * @property user - 当前登录用户的完整信息
 */
export interface LoginResult {
  token: string
  user: SessionUser
}

/**
 * 角色项类型（RBAC模型中的Role实体）
 * 描述：定义系统角色的完整数据结构，支持权限分配和状态管理
 * @property id - 角色唯一标识（正整数，数据库主键）
 * @property roleCode - 角色代码（英文小写，系统内部使用，如 'employee'）
 * @property roleName - 角色显示名称（中文，界面展示用，如 '员工'）
 * @property description - 角色职责描述（帮助管理员理解角色用途）
 * @property status - 角色状态（1=启用，0=禁用）
 * @property isSystem - 是否为系统内置角色（系统角色不允许删除，保护核心权限）
 * @property permissions - 权限列表（字符串数组，每个字符串代表一项权限标识）
 */
export interface RoleItem {
  id: number
  roleCode: string
  roleName: string
  description: string
  status: number
  isSystem: boolean
  permissions: string[]
}

/**
 * 角色保存参数类型
 * 描述：创建或更新角色时使用的请求参数结构
 * @property id - 角色ID（可选，存在时为更新，不存在时为创建）
 * @property roleCode - 角色代码（创建后不可修改，作为系统唯一标识）
 * @property roleName - 角色显示名称（支持修改，不影响业务逻辑）
 * @property description - 角色描述（可选填，建议填写职责范围）
 * @property status - 角色状态（1=启用，0=禁用，禁用后用户无法分配此角色）
 * @property permissions - 权限列表（决定该角色可访问的菜单和操作）
 */
export interface RolePayload {
  id?: number
  roleCode: string
  roleName: string
  description: string
  status: number
  permissions: string[]
}

/**
 * 测试账号类型
 * 描述：演示环境预置的登录账号数据结构
 * @property username - 登录账号（格式：角色.demo，如 'employee.demo'）
 * @property password - 登录密码（演示环境统一为简单密码）
 * @property displayName - 显示姓名（中文）
 * @property role - 角色代码（关联到对应角色配置）
 * @property roleName - 角色显示名称（冗余存储，避免查询）
 * @property department - 所属部门
 * @property employeeType - 员工类型
 */
export interface TestAccount {
  username: string
  password: string
  displayName: string
  role: string
  roleName: string
  department: string
  employeeType: string
}

/**
 * 角色代码到中文名称的映射表
 * 职责：提供默认角色名称的国际化映射，当后端未返回roleName时使用
 * 设计意图：解耦角色代码与显示文本，支持未来多语言扩展
 */
export const roleNameMap: Record<string, string> = {
  employee: '员工',
  worker: '劳工',
  finance: '财务',
  project_manager: '项目经理',
  ceo: '首席经营者',
  hr: '人力资源',
  general_manager: '总经理'
}

/**
 * 默认测试账号列表
 * 职责：提供演示环境的预置账号，支持不同角色登录测试
 * 设计意图：覆盖系统主要角色（员工、财务、项目经理、CEO），确保完整功能演示
 * 账号命名规范：{角色}.demo，便于识别和管理
 * 密码策略：演示环境使用统一简单密码 '123456'
 */
export const defaultTestAccounts: TestAccount[] = [
  {
    username: 'employee.demo',
    password: '123456',
    displayName: '张晓宁',
    role: 'employee',
    roleName: '员工',
    department: '综合管理部',
    employeeType: 'OFFICE'
  },
  {
    username: 'worker.demo',
    password: '123456',
    displayName: '赵铁柱',
    role: 'worker',
    roleName: '劳工',
    department: '施工一部',
    employeeType: 'LABOR'
  },
  {
    username: 'finance.demo',
    password: '123456',
    displayName: '李静',
    role: 'finance',
    roleName: '财务',
    department: '财务管理部',
    employeeType: 'OFFICE'
  },
  {
    username: 'pm.demo',
    password: '123456',
    displayName: '王建国',
    role: 'project_manager',
    roleName: '项目经理',
    department: '项目一部',
    employeeType: 'OFFICE'
  },
  {
    username: 'ceo.demo',
    password: '123456',
    displayName: '陈明远',
    role: 'ceo',
    roleName: '首席经营者',
    department: '运营管理部',
    employeeType: 'OFFICE'
  }
]
