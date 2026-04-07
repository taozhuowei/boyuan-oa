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
    const timer = setTimeout(() => controller.abort(), 2000)
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

// ─── M0 基础设施 ──────────────────────────────────────────────────────────────

describe('M0 - 基础设施', () => {
  it.skipIf(() => !serverUp)('GET /health 无需 token，返回 200', async () => {
    const { status } = await get('/health')
    expect(status).toBe(200)
  })
})

// ─── M1 认证 ─────────────────────────────────────────────────────────────────

describe('M1 - 认证', () => {
  it.skipIf(() => !serverUp)('POST /auth/login — ceo.demo 登录成功，返回 token + role=ceo', async () => {
    const { status, body } = await post<any>('/auth/login', { username: 'ceo.demo', password: '123456' })
    expect(status).toBe(200)
    expect((body as any).token).toBeTruthy()
    expect((body as any).role).toBe('ceo')
  })

  it.skipIf(() => !serverUp)('POST /auth/login — 密码错误返回 401', async () => {
    const { status } = await post('/auth/login', { username: 'ceo.demo', password: 'wrong' })
    expect(status).toBe(401)
  })

  it.skipIf(() => !serverUp)('GET /employees — 无 token 返回 401', async () => {
    const { status } = await get('/employees')
    expect(status).toBe(401)
  })

  it.skipIf(() => !serverUp)('GET /roles — 有效 token 返回角色数组', async () => {
    const { status, body } = await get<unknown[]>('/roles', ceoToken)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    expect((body as any[]).length).toBeGreaterThan(0)
  })
})

// ─── M1 员工管理 ──────────────────────────────────────────────────────────────

describe('M1 - 员工管理', () => {
  it.skipIf(() => !serverUp)('GET /employees — CEO token 返回 200 + content 数组', async () => {
    const { status, body } = await get<any>('/employees', ceoToken)
    expect(status).toBe(200)
    expect(Array.isArray((body as any).content)).toBe(true)
  })

  it.skipIf(() => !serverUp)('GET /employees — worker token 返回 403（无权限）', async () => {
    const { status } = await get('/employees', workerToken)
    expect(status).toBe(403)
  })

  it.skipIf(() => !serverUp)('GET /employees/1 — 返回 employee.demo 员工详情', async () => {
    const { status, body } = await get<any>('/employees/1', ceoToken)
    expect(status).toBe(200)
    expect((body as any).employeeNo).toBe('employee.demo')
  })

  it.skipIf(() => !serverUp)('GET /employees/9999 — 不存在返回 404', async () => {
    const { status } = await get('/employees/9999', ceoToken)
    expect(status).toBe(404)
  })
})

// ─── M2 组织管理 ──────────────────────────────────────────────────────────────

describe('M2 - 组织管理', () => {
  it.skipIf(() => !serverUp)('GET /departments — 返回部门数组', async () => {
    const { status, body } = await get<unknown[]>('/departments', ceoToken)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
  })

  it.skipIf(() => !serverUp)('GET /projects — PM token 返回分页结果（records 数组）', async () => {
    const { status, body } = await get<any>('/projects', pmToken)
    expect(status).toBe(200)
    expect(Array.isArray((body as any).records)).toBe(true)
  })

  it.skipIf(() => !serverUp)('GET /projects/1 — 返回项目详情，包含 name 和 members 字段', async () => {
    const { status, body } = await get<any>('/projects/1', ceoToken)
    expect(status).toBe(200)
    expect((body as any).name).toBeTruthy()
    expect(Array.isArray((body as any).members)).toBe(true)
  })
})
