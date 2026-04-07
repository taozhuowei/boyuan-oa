/**
 * utils/access.ts 单元测试
 *
 * 覆盖：loginWithAccount（参数校验、API 成功/失败/降级）、
 *       saveRole（字段归一化、本地存储回退）、
 *       fetchRoles（API 失败时返回默认值）、
 *       roleNameMap 完整性、defaultTestAccounts 完整性
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// 必须在导入 access 之前声明，Vitest 会自动 hoist vi.mock
vi.mock('@/utils/http', () => ({ request: vi.fn() }))

// uni polyfill — access.ts 直接调用 uni.* 无内置 polyfill，需在此处注入
// 使用 localStorage 模拟 uni 存储 API，与 jsdom 原生 localStorage 互通
vi.stubGlobal('uni', {
  getStorageSync: (key: string) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null } catch { return null }
  },
  setStorageSync: (key: string, value: unknown) => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
  },
  removeStorageSync: (key: string) => {
    try { localStorage.removeItem(key) } catch { /* ignore */ }
  },
  showToast: vi.fn(),
  showModal: vi.fn(),
  switchTab: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn()
})

// 每个测试前清空 localStorage，防止跨测试污染
beforeEach(() => localStorage.clear())

import { request } from '@/utils/http'
import {
  loginWithAccount,
  saveRole,
  fetchRoles,
  roleNameMap,
  defaultTestAccounts
} from '@/utils/access'

const mockRequest = vi.mocked(request)

// ─── loginWithAccount ─────────────────────────────────────────────────────────

describe('loginWithAccount', () => {
  beforeEach(() => mockRequest.mockReset())

  it('账号为空字符串时抛出"请输入账号和密码"', async () => {
    await expect(loginWithAccount({ identifier: '', password: '123456' }))
      .rejects.toThrow('请输入账号和密码')
    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('密码为空字符串时抛出"请输入账号和密码"', async () => {
    await expect(loginWithAccount({ identifier: 'ceo.demo', password: '   ' }))
      .rejects.toThrow('请输入账号和密码')
  })

  it('API 成功时返回标准 LoginResult 格式', async () => {
    mockRequest.mockResolvedValueOnce({
      token: 'jwt-abc',
      userId: 5,
      username: 'ceo.demo',
      displayName: '陈明远',
      role: 'ceo',
      roleName: '首席经营者',
      department: '运营管理部',
      employeeType: 'OFFICE'
    })

    const result = await loginWithAccount({ identifier: 'ceo.demo', password: '123456' })

    expect(result.token).toBe('jwt-abc')
    expect(result.user.username).toBe('ceo.demo')
    expect(result.user.role).toBe('ceo')
    expect(result.user.roleName).toBe('首席经营者')
    expect(result.user.status).toBe('在线值守')
    expect(result.user.userId).toBe(5)
  })

  it('API 成功但后端未返回 roleName 时 fallback 到 roleNameMap', async () => {
    mockRequest.mockResolvedValueOnce({
      token: 'jwt-xyz',
      username: 'finance.demo',
      displayName: '李静',
      role: 'finance'
      // 无 roleName
    })

    const result = await loginWithAccount({ identifier: 'finance.demo', password: '123456' })
    expect(result.user.roleName).toBe('财务') // 来自 roleNameMap
  })

  it('API 失败、本地账号密码匹配时返回 local session（token 以 local- 开头）', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Network error'))

    const result = await loginWithAccount({ identifier: 'employee.demo', password: '123456' })
    expect(result.token).toBe('local-employee.demo')
    expect(result.user.username).toBe('employee.demo')
    expect(result.user.role).toBe('employee')
  })

  it('API 失败且本地账号不存在时抛出"账号或密码错误"', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Network error'))

    await expect(loginWithAccount({ identifier: 'ghost.user', password: '123456' }))
      .rejects.toThrow('账号或密码错误')
  })

  it('API 失败且本地密码不匹配时抛出"账号或密码错误"', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Network error'))

    await expect(loginWithAccount({ identifier: 'ceo.demo', password: 'wrong' }))
      .rejects.toThrow('账号或密码错误')
  })

  it('API 成功时 token 被写入 localStorage', async () => {
    mockRequest.mockResolvedValueOnce({
      token: 'stored-token',
      username: 'pm.demo',
      displayName: '王建国',
      role: 'project_manager'
    })

    await loginWithAccount({ identifier: 'pm.demo', password: '123456' })
    // access.ts 在非 uni 环境写入 localStorage
    const stored = localStorage.getItem('token')
    expect(stored).toBe(JSON.stringify('stored-token'))
  })
})

// ─── saveRole ────────────────────────────────────────────────────────────────

describe('saveRole', () => {
  beforeEach(() => {
    mockRequest.mockReset()
    localStorage.removeItem('oa-role-cache')
  })

  it('roleCode 被 trim 并转 lowercase', async () => {
    mockRequest.mockRejectedValueOnce(new Error('offline'))

    const result = await saveRole({
      roleCode: '  Finance  ',
      roleName: '财务',
      description: '财务角色',
      status: 1,
      permissions: ['查看']
    })

    expect(result.roleCode).toBe('finance')
  })

  it('permissions 中的空字符串被过滤', async () => {
    mockRequest.mockRejectedValueOnce(new Error('offline'))

    const result = await saveRole({
      roleCode: 'test',
      roleName: '测试',
      description: '',
      status: 1,
      permissions: ['权限A', '  ', '', '权限B']
    })

    expect(result.permissions).toEqual(['权限A', '权限B'])
  })

  it('API 失败时新建角色自动分配递增 id，并写入本地存储', async () => {
    mockRequest.mockRejectedValueOnce(new Error('offline'))

    const result = await saveRole({
      roleCode: 'custom',
      roleName: '自定义角色',
      description: '',
      status: 1,
      permissions: []
    })

    expect(result.id).toBeGreaterThan(0)
    expect(result.isSystem).toBe(false)
    const cached = JSON.parse(localStorage.getItem('oa-role-cache') || '[]')
    expect(cached.find((r: { roleCode: string }) => r.roleCode === 'custom')).toBeTruthy()
  })

  it('API 失败时更新已有角色保留 isSystem 属性', async () => {
    // 先写入一个系统角色到 cache
    const initial = [{ id: 1, roleCode: 'employee', roleName: '员工', description: '', status: 1, isSystem: true, permissions: [] }]
    localStorage.setItem('oa-role-cache', JSON.stringify(initial))

    mockRequest.mockRejectedValueOnce(new Error('offline'))

    const result = await saveRole({
      id: 1,
      roleCode: 'employee',
      roleName: '员工（已改）',
      description: '更新',
      status: 1,
      permissions: ['查看']
    })

    expect(result.roleName).toBe('员工（已改）')
    expect(result.isSystem).toBe(true) // 保留原 isSystem
  })
})

// ─── fetchRoles ──────────────────────────────────────────────────────────────

describe('fetchRoles', () => {
  beforeEach(() => mockRequest.mockReset())

  it('API 失败时返回至少 5 个默认角色', async () => {
    mockRequest.mockRejectedValueOnce(new Error('offline'))
    localStorage.removeItem('oa-role-cache')

    const roles = await fetchRoles()
    expect(roles.length).toBeGreaterThanOrEqual(5)
    expect(roles.some((r) => r.roleCode === 'ceo')).toBe(true)
  })
})

// ─── roleNameMap ─────────────────────────────────────────────────────────────

describe('roleNameMap', () => {
  it('包含全部5个系统角色映射', () => {
    expect(roleNameMap['employee']).toBe('员工')
    expect(roleNameMap['worker']).toBe('劳工')
    expect(roleNameMap['finance']).toBe('财务')
    expect(roleNameMap['project_manager']).toBe('项目经理')
    expect(roleNameMap['ceo']).toBe('首席经营者')
  })
})

// ─── defaultTestAccounts ─────────────────────────────────────────────────────

describe('defaultTestAccounts', () => {
  it('预置账号包含 5 个演示账号', () => {
    expect(defaultTestAccounts).toHaveLength(5)
  })

  it('每个账号都有 username / password / role 字段', () => {
    for (const acc of defaultTestAccounts) {
      expect(acc.username).toBeTruthy()
      expect(acc.password).toBeTruthy()
      expect(acc.role).toBeTruthy()
    }
  })

  it('包含 ceo.demo / employee.demo / worker.demo', () => {
    const names = defaultTestAccounts.map((a) => a.username)
    expect(names).toContain('ceo.demo')
    expect(names).toContain('employee.demo')
    expect(names).toContain('worker.demo')
  })
})
