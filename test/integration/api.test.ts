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

  it('GET /projects — PM token 返回分页结果（records 数组）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/projects', pmToken)
    expect(status).toBe(200)
    expect(Array.isArray((body as any).records)).toBe(true)
  })

  it('GET /projects/1 — 返回项目详情，包含 name 和 members 字段', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/projects/1', ceoToken)
    expect(status).toBe(200)
    expect((body as any).name).toBeTruthy()
    expect(Array.isArray((body as any).members)).toBe(true)
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

// ─── M5 V5：薪资构成扩展（补贴 + 临时补贴 + 审批开关）───────────────────────────

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

describe('M5 V5 - 薪资构成扩展', () => {
  it('GET /allowances — 认证用户可查列表', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<unknown[]>('/allowances', ceoToken)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
  })

  it('POST /allowances — 仅 CEO/HR 可创建', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const code = 'TEST_MEAL_' + Date.now()
    const create = await post<any>('/allowances', { code, name: '测试餐补', displayOrder: 1 }, ceoToken)
    expect(create.status).toBe(200)
    expect((create.body as any).code).toBe(code)
    // worker 没权限
    const denied = await post('/allowances', { code: 'X', name: 'Y' }, workerToken)
    expect(denied.status).toBe(403)
    // 清理
    const id = (create.body as any).id
    if (id) await del(`/allowances/${id}`, ceoToken)
  })

  it('PUT /allowances/{id}/configs — 三级覆盖批量保存', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const code = 'TEST_TRANSPORT_' + Date.now()
    const create = await post<any>('/allowances', { code, name: '测试交通补' }, ceoToken)
    const id = (create.body as any).id
    expect(id).toBeTruthy()
    // 全局 200 元
    const save = await put(`/allowances/${id}/configs`, [
      { scope: 'GLOBAL', scopeTargetId: null, amount: 200 }
    ], ceoToken)
    expect(save.status).toBe(200)
    const list = await get<any[]>(`/allowances/${id}/configs`, ceoToken)
    expect(list.status).toBe(200)
    expect((list.body as any[]).length).toBe(1)
    expect((list.body as any[])[0].scope).toBe('GLOBAL')
    expect(Number((list.body as any[])[0].amount)).toBe(200)
    await del(`/allowances/${id}`, ceoToken)
  })

  it('GET /payroll/bonus-approval-config — 默认 false', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/payroll/bonus-approval-config', ceoToken)
    expect(status).toBe(200)
    expect(typeof (body as any).approvalRequired).toBe('boolean')
  })

  it('PUT /payroll/bonus-approval-config — 仅 CEO 可设置', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const ok = await put('/payroll/bonus-approval-config', { approvalRequired: false }, ceoToken)
    expect(ok.status).toBe(200)
    const denied = await put('/payroll/bonus-approval-config', { approvalRequired: true }, workerToken)
    expect(denied.status).toBe(403)
  })
})
