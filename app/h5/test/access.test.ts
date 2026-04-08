/**
 * H5 utils/access.ts 单元测试
 *
 * 覆盖：loginWithAccount（参数校验、API 成功/失败降级）、
 *       fetchRoles（H5 版失败返回空数组，区别于 MP 版）、
 *       saveRole（字段归一化、PUT/POST 路由选择）、
 *       deleteRole（DELETE 路由）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// 必须在导入 access 之前声明，Vitest 会自动 hoist vi.mock
vi.mock('../utils/http', () => ({ request: vi.fn() }))

import { request } from '../utils/http'
import {
  loginWithAccount,
  fetchRoles,
  saveRole,
  deleteRole
} from '../utils/access'
import { roleNameMap, defaultTestAccounts } from '@shared/types'

const mockRequest = vi.mocked(request)

// ─── loginWithAccount ─────────────────────────────────────────────────────────

describe('loginWithAccount', () => {
  beforeEach(() => mockRequest.mockReset())

  it('账号为空字符串时抛出"请输入账号和密码"，且 request 未被调用', async () => {
    await expect(loginWithAccount({ identifier: '', password: '123456' }))
      .rejects.toThrow('请输入账号和密码')
    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('密码全为空格时抛出"请输入账号和密码"', async () => {
    await expect(loginWithAccount({ identifier: 'ceo.demo', password: '   ' }))
      .rejects.toThrow('请输入账号和密码')
    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('API 成功时返回正确的 LoginResult（token、username、role、status）', async () => {
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
    expect(result.user.status).toBe('在线值守')
  })

  it('API 成功但后端未返回 roleName 时 fallback 到 roleNameMap（finance 角色）', async () => {
    mockRequest.mockResolvedValueOnce({
      token: 'jwt-xyz',
      username: 'finance.demo',
      displayName: '李静',
      role: 'finance'
      // 故意不提供 roleName，触发 fallback
    })

    const result = await loginWithAccount({ identifier: 'finance.demo', password: '123456' })
    expect(result.user.roleName).toBe(roleNameMap['finance']) // '财务'
  })

  it('API 成功时 department 缺失时 fallback 为"未分配部门"', async () => {
    mockRequest.mockResolvedValueOnce({
      token: 'jwt-dep',
      username: 'employee.demo',
      displayName: '张晓宁',
      role: 'employee'
      // 故意不提供 department
    })

    const result = await loginWithAccount({ identifier: 'employee.demo', password: '123456' })
    expect(result.user.department).toBe('未分配部门')
  })

  it('API 成功时 employeeType 缺失时 fallback 为 OFFICE', async () => {
    mockRequest.mockResolvedValueOnce({
      token: 'jwt-emp',
      username: 'employee.demo',
      displayName: '张晓宁',
      role: 'employee'
      // 故意不提供 employeeType
    })

    const result = await loginWithAccount({ identifier: 'employee.demo', password: '123456' })
    expect(result.user.employeeType).toBe('OFFICE')
  })

  it('API 失败且本地账号密码匹配时返回 local session（token = "local-employee.demo"）', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Network error'))

    const result = await loginWithAccount({ identifier: 'employee.demo', password: '123456' })

    expect(result.token).toBe('local-employee.demo')
    expect(result.user.username).toBe('employee.demo')
    expect(result.user.role).toBe('employee')
    expect(result.user.status).toBe('在线值守')
  })

  it('API 失败但本地无此账号时抛出"账号或密码错误"', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Network error'))

    await expect(loginWithAccount({ identifier: 'ghost.user', password: '123456' }))
      .rejects.toThrow('账号或密码错误')
  })

  it('API 失败且本地密码不匹配时抛出"账号或密码错误"', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Network error'))

    await expect(loginWithAccount({ identifier: 'employee.demo', password: 'wrong-password' }))
      .rejects.toThrow('账号或密码错误')
  })
})

// ─── fetchRoles ──────────────────────────────────────────────────────────────

describe('fetchRoles', () => {
  beforeEach(() => mockRequest.mockReset())

  it('API 成功时返回后端数据', async () => {
    const backendRoles = [
      { id: 1, roleCode: 'ceo', roleName: '首席经营者', description: '', status: 1, isSystem: true, permissions: [] },
      { id: 2, roleCode: 'employee', roleName: '员工', description: '', status: 1, isSystem: true, permissions: [] }
    ]
    mockRequest.mockResolvedValueOnce(backendRoles)

    const result = await fetchRoles()

    expect(result).toEqual(backendRoles)
    expect(result).toHaveLength(2)
  })

  it('API 失败时返回空数组（H5 与 MP 的关键区别：MP 返回默认角色，H5 返回 []）', async () => {
    mockRequest.mockRejectedValueOnce(new Error('offline'))

    const result = await fetchRoles()

    expect(result).toEqual([])
    expect(result).toHaveLength(0)
  })
})

// ─── saveRole ────────────────────────────────────────────────────────────────

describe('saveRole', () => {
  beforeEach(() => mockRequest.mockReset())

  it('roleCode 被 trim 并转 lowercase', async () => {
    const saved = { id: 10, roleCode: 'finance', roleName: '财务', description: '', status: 1, isSystem: false, permissions: [] }
    mockRequest.mockResolvedValueOnce(saved)

    await saveRole({
      roleCode: '  Finance  ',
      roleName: '财务',
      description: '',
      status: 1,
      permissions: []
    })

    // 验证 request 调用时 body 内的 roleCode 已归一化
    const callBody = (mockRequest.mock.calls[0][0] as { body: { roleCode: string } }).body
    expect(callBody.roleCode).toBe('finance')
  })

  it('permissions 中的空字符串和纯空格被过滤', async () => {
    const saved = { id: 11, roleCode: 'test', roleName: '测试', description: '', status: 1, isSystem: false, permissions: ['权限A', '权限B'] }
    mockRequest.mockResolvedValueOnce(saved)

    await saveRole({
      roleCode: 'test',
      roleName: '测试',
      description: '',
      status: 1,
      permissions: ['权限A', '  ', '', '权限B']
    })

    const callBody = (mockRequest.mock.calls[0][0] as { body: { permissions: string[] } }).body
    expect(callBody.permissions).toEqual(['权限A', '权限B'])
  })

  it('有 id 时调用 PUT /roles/{id}', async () => {
    const saved = { id: 3, roleCode: 'employee', roleName: '员工', description: '', status: 1, isSystem: true, permissions: [] }
    mockRequest.mockResolvedValueOnce(saved)

    await saveRole({ id: 3, roleCode: 'employee', roleName: '员工', description: '', status: 1, permissions: [] })

    const call = mockRequest.mock.calls[0][0] as { url: string; method: string }
    expect(call.url).toBe('/roles/3')
    expect(call.method).toBe('PUT')
  })

  it('无 id 时调用 POST /roles', async () => {
    const saved = { id: 99, roleCode: 'custom', roleName: '自定义', description: '', status: 1, isSystem: false, permissions: [] }
    mockRequest.mockResolvedValueOnce(saved)

    await saveRole({ roleCode: 'custom', roleName: '自定义', description: '', status: 1, permissions: [] })

    const call = mockRequest.mock.calls[0][0] as { url: string; method: string }
    expect(call.url).toBe('/roles')
    expect(call.method).toBe('POST')
  })
})

// ─── deleteRole ──────────────────────────────────────────────────────────────

describe('deleteRole', () => {
  beforeEach(() => mockRequest.mockReset())

  it('调用 DELETE /roles/{id}', async () => {
    mockRequest.mockResolvedValueOnce(undefined)

    await deleteRole(7)

    const call = mockRequest.mock.calls[0][0] as { url: string; method: string }
    expect(call.url).toBe('/roles/7')
    expect(call.method).toBe('DELETE')
  })
})

// ─── defaultTestAccounts 完整性验证 ──────────────────────────────────────────

describe('defaultTestAccounts 完整性', () => {
  it('包含 5 个预置演示账号', () => {
    expect(defaultTestAccounts).toHaveLength(5)
  })

  it('employee.demo / worker.demo / finance.demo / pm.demo / ceo.demo 全部存在', () => {
    const names = defaultTestAccounts.map((a) => a.username)
    expect(names).toContain('employee.demo')
    expect(names).toContain('worker.demo')
    expect(names).toContain('finance.demo')
    expect(names).toContain('pm.demo')
    expect(names).toContain('ceo.demo')
  })

  it('所有账号密码均为 123456', () => {
    for (const acc of defaultTestAccounts) {
      expect(acc.password).toBe('123456')
    }
  })
})
