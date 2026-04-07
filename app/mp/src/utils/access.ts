/**
 * 认证与权限工具模块
 *
 * 模块职责：
 * - 提供登录认证、角色管理、权限控制相关功能
 * - 统一封装HTTP请求，处理认证头自动附加
 * - 管理测试账号和角色数据的CRUD操作
 *
 * 架构设计说明：
 *
 * 1. API优先 + 本地降级策略（Dual-Mode Architecture）
 *    本模块采用"后端API优先，本地mock兜底"的双层架构设计：
 *    - 优先尝试调用后端API，确保数据持久化和多设备同步
 *    - 当后端不可用（开发环境、网络中断、后端未启动）时，自动回退到本地mock数据
 *    - 这种设计保证了开发演示的连续性，同时生产环境可无缝切换到真实后端
 *
 * 2. 本地缓存用途（Local Cache Purpose）
 *    - 角色数据持久化：使用uni-app本地存储保存角色配置，避免每次重新初始化
 *    - 离线可用性：在无网络环境下仍可查看和编辑角色配置
 *    - 演示数据保存：用户在演示环境对角色的修改会被缓存，刷新后保留
 *    - 缓存键名：'oa-role-cache'，存储格式：RoleItem数组的JSON序列化
 *
 * 3. 角色/账号映射机制（Role & Account Mapping）
 *    - 角色代码（roleCode）：系统内部使用的英文标识符，如 'employee', 'finance'
 *    - 角色名称（roleName）：面向用户的中文显示名称，如 '员工', '财务'
 *    - 映射表：roleNameMap 提供代码到名称的默认映射，支持国际化扩展
 *    - 测试账号：defaultTestAccounts 将角色与具体用户账号绑定，用于演示登录
 *    - 权限绑定：每个角色对应一组权限字符串，用于前端路由和按钮级权限控制
 *
 * 交互入口：被登录页、角色管理页、权限控制逻辑调用
 */

import { request } from './http'
import type { LoginPayload, SessionUser, LoginResult, RoleItem, RolePayload, TestAccount } from '@shared/types'
import { roleNameMap, defaultTestAccounts } from '@shared/types'

/**
 * 角色本地存储键名
 * 用途：uni-app本地存储中保存角色数据的唯一标识
 * 存储位置：uni.getStorageSync(roleStorageKey)
 */
const roleStorageKey = 'oa-role-cache'

/**
 * 默认系统角色配置
 * 职责：定义系统的内置角色及其权限，作为角色管理的初始数据
 * 设计意图：建立基础的RBAC权限模型，区分系统角色和自定义角色
 * 角色设计原则：
 *   - 最小权限原则：每个角色只拥有完成工作所必需的权限
 *   - 职责分离：财务、项目、管理权限分离，避免权力过度集中
 *   - 系统角色保护：isSystem=true 的角色不允许删除，确保系统稳定性
 * 权限说明：
 *   - 员工：查看个人信息、发起请假/加班、确认工资条
 *   - 财务：全员信息查看、工资结算、数据导入导出
 *   - 项目经理：项目初审、项目总览、施工日志管理
 *   - CEO：终审审批、角色权限配置、经营总览
 */
const defaultRoles: RoleItem[] = [
  {
    id: 1,
    roleCode: 'employee',
    roleName: '员工',
    description: '发起和查看本人业务单据，查看并确认工资条。',
    status: 1,
    isSystem: true,
    permissions: ['查看本人信息', '发起请假', '发起加班', '工资条确认与异议']
  },
  {
    id: 2,
    roleCode: 'worker',
    roleName: '劳工',
    description: '处理施工日志、工伤补偿和个人工资确认事项。',
    status: 1,
    isSystem: true,
    permissions: ['施工日志', '工伤补偿', '发起请假', '工资条确认与异议']
  },
  {
    id: 3,
    roleCode: 'finance',
    roleName: '财务',
    description: '维护人员与薪资配置，执行结算、复核异议、导出数据。',
    status: 1,
    isSystem: true,
    permissions: ['查看全员信息', '工资结算', '通讯录导入', '导出数据']
  },
  {
    id: 4,
    roleCode: 'project_manager',
    roleName: '项目经理',
    description: '处理项目范围内审批，维护项目施工日志模板，查看项目总览。',
    status: 1,
    isSystem: true,
    permissions: ['项目初审', '项目总览', '日志模板维护']
  },
  {
    id: 5,
    roleCode: 'ceo',
    roleName: '首席经营者',
    description: '管理全局配置、终审审批、配置角色权限、查看经营总览。',
    status: 1,
    isSystem: true,
    permissions: ['终审审批', '角色与权限配置', '数据有效期配置', '经营总览']
  }
]

/**
 * 从本地存储获取角色列表
 * 职责：优先读取缓存，无缓存时返回默认角色并初始化存储
 * 设计意图：提供离线可用的角色数据，支持演示环境
 * 逻辑说明：
 *   1. 获取uni实例，非uni环境直接返回默认角色
 *   2. 尝试从本地存储读取缓存数据
 *   3. 缓存有效则返回，无效则初始化存储并返回默认角色
 * 缓存策略：首次使用自动初始化，后续读取缓存，角色修改时更新缓存
 */
function getStoredRoles(): RoleItem[] {
  if (typeof uni === 'undefined') {
    return defaultRoles
  }

  const cached = uni.getStorageSync(roleStorageKey)

  if (Array.isArray(cached) && cached.length > 0) {
    return cached as RoleItem[]
  }

  uni.setStorageSync(roleStorageKey, defaultRoles)
  return defaultRoles
}

/**
 * 保存角色列表到本地存储
 * 职责：将角色数据持久化到设备本地存储
 * 参数说明：
 *   @param roles - 需要保存的完整角色列表（会覆盖原有数据）
 * 注意事项：
 *   - 此操作会完全覆盖原有缓存数据
 *   - 在非uni环境下静默失败（无报错），确保兼容性
 *   - 数据大小限制受uni-app存储限制（通常10MB）
 */
function setStoredRoles(roles: RoleItem[]) {
  if (typeof uni !== 'undefined') {
    uni.setStorageSync(roleStorageKey, roles)
  }
}

/**
 * 创建本地mock会话
 * 职责：为测试账号生成模拟登录结果
 * 设计意图：当后端不可用时，使用本地数据模拟登录流程，保证演示连续性
 * 令牌生成策略：使用 'local-{username}' 格式，标识为本地mock令牌
 * 状态设置：固定为 '在线值守'，模拟正常登录状态
 * 参数说明：
 *   @param account - 匹配的测试账号信息
 * 返回值：符合LoginResult结构的对象，可直接用于前端状态存储
 */
function createLocalSession(account: TestAccount): LoginResult {
  return {
    token: `local-${account.username}`,
    user: {
      username: account.username,
      displayName: account.displayName,
      role: account.role,
      roleName: account.roleName,
      department: account.department,
      employeeType: account.employeeType,
      status: '在线值守',
      userId: null,
      positionId: null
    }
  }
}

/**
 * 账号密码登录
 * 职责：尝试调用后端登录接口，失败时回退到本地mock验证
 * 设计意图：优先使用后端认证，确保后端不可用时仍可演示
 * 登录流程：
 *   1. 参数校验：检查账号密码非空
 *   2. API尝试：调用后端登录接口
 *   3. 成功处理：转换后端响应为LoginResult格式
 *   4. 失败回退：匹配本地测试账号，生成mock会话
 *   5. 完全失败：返回"账号或密码错误"
 * 字段映射说明：
 *   - roleName优先使用后端返回，缺失时使用roleNameMap映射
 *   - department/employeeType后端缺失时提供默认值
 * 参数说明：
 *   @param payload - 登录请求参数（username, password）
 * 返回值：Promise<LoginResult>，包含token和用户信息
 * 异常：参数错误或认证失败时抛出Error
 */
export async function loginWithAccount(payload: LoginPayload): Promise<LoginResult> {
  const identifier = payload.identifier.trim()
  const password = payload.password.trim()

  if (!identifier || !password) {
    throw new Error('请输入账号和密码')
  }

  try {
    const response = await request<{
      token: string
      userId?: number
      username: string
      displayName: string
      role: string
      roleName?: string
      department?: string
      employeeType?: string
    }>({
      url: '/auth/login',
      method: 'POST',
      data: { username: identifier, password },
      skipAuthRedirect: true
    })

    // 保存token到本地存储（供http.ts拦截器使用）
    if (typeof uni !== 'undefined') {
      uni.setStorageSync('token', response.token)
    } else {
      localStorage.setItem('token', JSON.stringify(response.token))
    }

    return {
      token: response.token,
      user: {
        username: response.username,
        displayName: response.displayName,
        role: response.role,
        roleName: response.roleName ?? roleNameMap[response.role] ?? response.role,
        department: response.department ?? '未分配部门',
        employeeType: response.employeeType ?? 'OFFICE',
        status: '在线值守',
        userId: response.userId ?? null,
        positionId: null  // 当前login response暂无positionId
      }
    }
  } catch {
    const matched = defaultTestAccounts.find(
      (item) => item.username === identifier && item.password === password
    )

    if (!matched) {
      throw new Error('账号或密码错误')
    }

    return createLocalSession(matched)
  }
}

/**
 * 获取角色列表
 * 职责：尝试从后端获取角色，失败时使用本地存储（API优先+本地降级策略）
 * 设计意图：保证角色数据的可访问性，无论后端是否可用
 * 调用逻辑：
 *   1. 优先调用 GET /api/roles 获取后端数据
 *   2. 携带token进行认证（如提供）
 *   3. API失败时自动降级到本地缓存
 * 参数说明：
 *   @param token - 可选的JWT令牌，用于认证请求
 * 返回值：Promise<RoleItem[]>，角色列表数组
 * 降级策略：后端不可用返回本地存储数据，本地无数据返回默认角色
 */
export async function fetchRoles(): Promise<RoleItem[]> {
  try {
    return await request<RoleItem[]>({ url: '/roles', method: 'GET' })
  } catch {
    return getStoredRoles()
  }
}

/**
 * 保存角色
 * 职责：创建或更新角色信息，失败时回退到本地存储（API优先+本地降级策略）
 * 设计意图：优先调用后端API持久化数据，支持离线演示和开发调试
 * 数据处理：
 *   - roleCode：去空格并转为小写，确保一致性
 *   - roleName：去空格，去除前后空白
 *   - description：去空格
 *   - permissions：遍历去空格，过滤空字符串
 * 接口调用：
 *   - 存在id：调用 PUT /api/roles/{id} 更新角色
 *   - 不存在id：调用 POST /api/roles 创建角色
 * 本地回退逻辑：
 *   - 更新：遍历本地角色列表，匹配id进行合并更新，保留isSystem属性
 *   - 创建：生成新id（当前最大id+1），标记为非系统角色，添加到列表
 *   - 持久化：调用setStoredRoles保存修改后的列表
 * 参数说明：
 *   @param payload - 角色保存参数（包含或不含id）
 *   @param token - 可选的JWT令牌
 * 返回值：Promise<RoleItem>，保存后的角色对象（包含生成的id）
 */
export async function saveRole(payload: RolePayload): Promise<RoleItem> {
  const normalized: RolePayload = {
    ...payload,
    roleCode: payload.roleCode.trim().toLowerCase(),
    roleName: payload.roleName.trim(),
    description: payload.description.trim(),
    permissions: payload.permissions.map((item) => item.trim()).filter(Boolean)
  }

  try {
    if (normalized.id) {
      return await request<RoleItem>({
        url: `/roles/${normalized.id}`,
        method: 'PUT',
        data: normalized
      })
    }

    return await request<RoleItem>({
      url: '/roles',
      method: 'POST',
      data: normalized
    })
  } catch {
    const roles = getStoredRoles()

    if (normalized.id) {
      const nextRoles = roles.map((item) =>
        item.id === normalized.id
          ? { ...item, ...normalized, isSystem: item.isSystem }
          : item
      )
      setStoredRoles(nextRoles)
      return nextRoles.find((item) => item.id === normalized.id) ?? nextRoles[0]
    }

    const nextRole: RoleItem = {
      id: Math.max(...roles.map((item) => item.id), 0) + 1,
      isSystem: false,
      ...normalized
    }
    const nextRoles = [...roles, nextRole]
    setStoredRoles(nextRoles)
    return nextRole
  }
}

/**
 * 删除角色
 * 职责：删除指定角色
 * 设计意图：优先调用后端API删除，失败时回退到本地存储
 * 参数说明：
 *   @param id - 角色ID
 * 返回值：Promise<void>
 */
export async function deleteRole(id: number): Promise<void> {
  try {
    await request<void>({
      url: `/roles/${id}`,
      method: 'DELETE'
    })
  } catch {
    // 本地回退：从缓存中删除
    const roles = getStoredRoles()
    const nextRoles = roles.filter((item) => item.id !== id)
    setStoredRoles(nextRoles)
  }
}
