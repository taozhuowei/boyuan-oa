// @vitest-environment node
/**
 * 前后端 API 集成测试
 *
 * 覆盖：认证、员工、部门、项目、角色等核心端点的真实 HTTP 行为
 *
 * 前提：后端服务在 http://localhost:8080 运行
 *       服务不可达时所有用例自动跳过，不报错
 */
import { describe, it, expect, beforeAll } from 'vitest'

const BASE = 'http://localhost:8080/api'

// ─── 服务可达性检测 ──────────────────────────────────────────────────────────

let serverUp = false
let ceoToken = ''
let workerToken = ''
let pmToken = ''
let hrToken = ''
let employeeToken = ''
let financeToken = ''

async function get<T = unknown>(path: string, token?: string): Promise<{ status: number; body: T }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(BASE + path, { headers })
  const body = await res.json().catch(() => null)
  return { status: res.status, body: body as T }
}

async function post<T = unknown>(path: string, data: unknown, token?: string): Promise<{ status: number; body: T }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body: body as T }
}

async function loginAs(username: string): Promise<string> {
  const { body } = await post<{ token: string }>('/auth/login', { username, password: '123456' })
  return (body as any)?.token ?? ''
}

beforeAll(async () => {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`${BASE}/health`, { signal: controller.signal })
    clearTimeout(timer)
    serverUp = res.ok
    if (serverUp) {
      ceoToken = await loginAs('ceo.demo')
      pmToken = await loginAs('pm.demo')
      workerToken = await loginAs('worker.demo')
      hrToken = await loginAs('hr.demo')
      employeeToken = await loginAs('employee.demo')
      financeToken = await loginAs('finance.demo')
    }
  } catch {
    serverUp = false
  }
  if (!serverUp) {
    console.warn('[integration] Backend not running — all integration tests SKIPPED')
  }
})

// Use context.skip() inside test body for runtime conditional skipping
// (it.skipIf with function is evaluated at collection time, before beforeAll runs)
type SkipCtx = { skip: () => void }

// ─── M0 基础设施 ──────────────────────────────────────────────────────────────

describe('M0 - 基础设施', () => {
  it('GET /health 无需 token，返回 200', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/health')
    expect(status).toBe(200)
  })
})

// ─── M1 认证 ─────────────────────────────────────────────────────────────────

describe('M1 - 认证', () => {
  it('POST /auth/login — ceo.demo 登录成功，返回 token + role=ceo', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await post<any>('/auth/login', { username: 'ceo.demo', password: '123456' })
    expect(status).toBe(200)
    expect((body as any).token).toBeTruthy()
    expect((body as any).role).toBe('ceo')
  })

  it('POST /auth/login — 密码错误返回 401', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await post('/auth/login', { username: 'ceo.demo', password: 'wrong' })
    expect(status).toBe(401)
  })

  it('GET /employees — 无 token 返回 401', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/employees')
    expect(status).toBe(401)
  })

  it('GET /roles — 有效 token 返回角色数组', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<unknown[]>('/roles', ceoToken)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    expect((body as any[]).length).toBeGreaterThan(0)
  })

  it('GET /auth/me — 返回当前登录用户信息', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/auth/me', ceoToken)
    expect(status).toBe(200)
    expect((body as any).employeeNo).toBe('ceo.demo')
    expect((body as any).roleCode).toBe('ceo')
    expect((body as any).name).toBeTruthy()
  })
})

// ─── M1 员工管理 ──────────────────────────────────────────────────────────────

describe('M1 - 员工管理', () => {
  it('GET /employees — CEO token 返回 200 + content 数组', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/employees', ceoToken)
    expect(status).toBe(200)
    expect(Array.isArray((body as any).content)).toBe(true)
  })

  it('GET /employees — worker token 返回 403（无权限）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/employees', workerToken)
    expect(status).toBe(403)
  })

  it('GET /employees/1 — 返回 employee.demo 员工详情', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/employees/1', ceoToken)
    expect(status).toBe(200)
    expect((body as any).employeeNo).toBe('employee.demo')
  })

  it('GET /employees/9999 — 不存在返回 404', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/employees/9999', ceoToken)
    expect(status).toBe(404)
  })
})

// ─── M2 组织管理 ──────────────────────────────────────────────────────────────

describe('M2 - 组织管理', () => {
  it('GET /departments — 返回部门数组', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<unknown[]>('/departments', ceoToken)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
  })

  it('GET /operation-logs — CEO token 返回分页数据', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/operation-logs', ceoToken)
    expect(status).toBe(200)
    expect(typeof (body as any).total).toBe('number')
    expect(Array.isArray((body as any).records)).toBe(true)
  })

  it('GET /operation-logs — finance token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const financeToken = await loginAs('finance.demo')
    const { status } = await get('/operation-logs', financeToken)
    expect(status).toBe(403)
  })
})

async function put<T = unknown>(path: string, data: unknown, token?: string): Promise<{ status: number; body: T }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(BASE + path, { method: 'PUT', headers, body: JSON.stringify(data) })
  const body = await res.json().catch(() => null)
  return { status: res.status, body: body as T }
}

async function del(path: string, token?: string): Promise<{ status: number }> {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(BASE + path, { method: 'DELETE', headers })
  return { status: res.status }
}

// ─── C-INT-05 系统配置 API ────────────────────────────────────────────────────

describe('C-INT-05 - 系统配置 API', () => {
  it('SC-01: GET /config/company-name — CEO token 返回 200 + companyName 字段', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/config/company-name', ceoToken)
    expect(status).toBe(200)
    expect((body as any).companyName === null || typeof (body as any).companyName === 'string').toBe(true)
  })

  it('SC-02: PUT /config/company-name — CEO 可修改公司名称，返回 200', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await put('/config/company-name', { companyName: '测试企业名称' }, ceoToken)
    expect(status).toBe(200)
  })

  it('SC-03: PUT /config/company-name — HR token 返回 403（无权修改）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await put('/config/company-name', { companyName: '违规' }, hrToken)
    expect(status).toBe(403)
  })

  it('SC-06: GET /config/retention-period — CEO token 返回 200 + days 字段', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/config/retention-period', ceoToken)
    expect(status).toBe(200)
    expect((body as any).days).toBeDefined()
  })
})

// ─── C-INT-06 权限越权直调 ────────────────────────────────────────────────────

describe('C-INT-06 - 权限越权直调', () => {
  it('SEC-01: GET /employees — employee token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/employees', employeeToken)
    expect(status).toBe(403)
  })

  it('SEC-02: GET /employees — worker token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/employees', workerToken)
    expect(status).toBe(403)
  })

  it('SEC-03: DELETE /employees/1 — employee token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await del('/employees/1', employeeToken)
    expect(status).toBe(403)
  })

  it('SEC-07: GET /operation-logs — employee token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/operation-logs', employeeToken)
    expect(status).toBe(403)
  })

  it('SEC-08: GET /operation-logs — finance token 返回 403（操作日志仅 CEO）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/operation-logs', financeToken)
    expect(status).toBe(403)
  })

  it('SEC-09: PUT /config/company-name — HR token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await put('/config/company-name', { companyName: '越权测试' }, hrToken)
    expect(status).toBe(403)
  })

  it('SEC-12: POST /forms/1/approve — employee token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await post('/forms/1/approve', { action: 'APPROVE' }, employeeToken)
    expect(status).toBe(403)
  })

  it('SEC-15: GET /config/retention-period — HR token 返回 403（CEO 专属）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/config/retention-period', hrToken)
    expect(status).toBe(403)
  })
})

// ─── C-INT-07 密码变更 API ────────────────────────────────────────────────────

describe('C-INT-07 - 密码变更 API', () => {
  it('PW-01: POST /auth/change-password — 正确旧密码变更成功，返回 204；随后立即还原密码', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await post(
      '/auth/change-password',
      { currentPassword: '123456', newPassword: 'Abc12345!' },
      employeeToken
    )
    expect(status).toBe(204)
    // 立即还原密码，避免影响其他用例
    await post(
      '/auth/change-password',
      { currentPassword: 'Abc12345!', newPassword: '123456' },
      employeeToken
    )
  })

  it('PW-02: POST /auth/change-password — 旧密码错误返回 400', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await post(
      '/auth/change-password',
      { currentPassword: 'wrongpwd', newPassword: 'Abc12345!' },
      hrToken
    )
    expect(status).toBe(400)
  })

  it('PW-03: POST /auth/change-password — 新密码少于 6 位返回 400', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await post(
      '/auth/change-password',
      { currentPassword: '123456', newPassword: '123' },
      workerToken
    )
    expect(status).toBe(400)
  })
})

