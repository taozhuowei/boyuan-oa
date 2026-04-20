/**
 * 登录态 fixture
 *
 * 职责：为每个测试角色通过 API 获取 JWT token，并将 oa-token / oa-user 两个
 * cookie 注入浏览器 context，使 Nuxt auth middleware 认为用户已登录，
 * 无需经过登录页面。
 *
 * Cookie 命名来源：app/h5/stores/user.ts（oa-token / oa-user，maxAge 604800）。
 * 数据来源：local/seed-data.sql（dev profile 本地手动执行一次）。
 */
import { request as playwrightRequest, BrowserContext } from '@playwright/test'

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8080/api'

export type RoleKey = 'ceo' | 'hr' | 'finance' | 'pm' | 'employee' | 'worker' | 'dept_manager'

const CREDENTIALS: Record<RoleKey, { username: string; password: string }> = {
  ceo:          { username: 'ceo.demo',          password: '123456' },
  hr:           { username: 'hr.demo',           password: '123456' },
  finance:      { username: 'finance.demo',      password: '123456' },
  pm:           { username: 'pm.demo',           password: '123456' },
  employee:     { username: 'employee.demo',     password: '123456' },
  worker:       { username: 'worker.demo',       password: '123456' },
  dept_manager: { username: 'dept_manager.demo', password: '123456' }
}

/** Backend login response shape (AuthLoginResponse.java) */
interface LoginResponse {
  token: string
  userId: number
  username: string
  displayName: string
  role: string
  roleName: string
  department: string
  employeeType: string
  secondRoles: string[]
}

/**
 * 通过后端 API 登录，返回 token + user 信息。
 * 直接调用 backend（:8080），不经过 Nuxt 代理。
 */
export async function loginViaApi(role: RoleKey): Promise<{ token: string; user: LoginResponse }> {
  const ctx = await playwrightRequest.newContext()
  try {
    const { username, password } = CREDENTIALS[role]
    const response = await ctx.post(`${API_URL}/auth/login`, {
      data: { username, password }
    })
    if (!response.ok()) {
      throw new Error(`[auth] Login failed for role=${role}: ${response.status()} ${await response.text()}`)
    }
    const body = await response.json() as LoginResponse
    return { token: body.token, user: body }
  } finally {
    await ctx.dispose()
  }
}

/**
 * 将 oa-token + oa-user cookies 注入 context，模拟已登录状态。
 * 需要在 page.goto() 之前调用。
 */
export async function loginAs(context: BrowserContext, role: RoleKey): Promise<void> {
  const { token, user } = await loginViaApi(role)

  await context.addCookies([
    {
      name: 'oa-token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    },
    {
      name: 'oa-user',
      value: encodeURIComponent(JSON.stringify({
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        roleName: user.roleName,
        department: user.department,
        employeeType: user.employeeType,
        status: '在线值守',
        userId: user.userId ?? null,
        positionId: null,
        secondRoles: user.secondRoles ?? []
      })),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax'
    }
  ])
}
