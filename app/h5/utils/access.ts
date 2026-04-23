// Auth utilities for H5 — web-native, no uni.request or uni.storage
// Mirrors app/mp/src/utils/access.ts but uses $fetch via request()

import { request } from './http'
import type { LoginPayload, LoginResult, RoleItem, RolePayload } from '@shared/types'
import { roleNameMap, defaultTestAccounts } from '@shared/types'

export type { LoginPayload, LoginResult, RoleItem, RolePayload }

/**
 * DEF-AUTH-02: 登录错误扩展信息。
 * 登录失败 ≥ 3 次后后端返回 401 + captchaRequired=true，或锁定时返回 429 + selfServiceUnlock。
 */
export interface LoginErrorInfo {
  captchaRequired?: boolean
  selfServiceUnlock?: string
}

export class LoginError extends Error {
  readonly info: LoginErrorInfo
  constructor(message: string, info: LoginErrorInfo = {}) {
    super(message)
    this.info = info
  }
}

/**
 * DEF-AUTH-02: 获取一次图形验证码。
 */
export async function fetchCaptcha(): Promise<{ captchaId: string; imageBase64: string }> {
  return request<{ captchaId: string; imageBase64: string }>({
    url: '/auth/captcha',
    method: 'GET',
    skipAuthRedirect: true,
  })
}

export async function loginWithAccount(payload: LoginPayload): Promise<LoginResult> {
  const identifier = payload.identifier.trim()
  const password = payload.password.trim()
  if (!identifier || !password) throw new Error('请输入账号和密码')

  const body: Record<string, string> = { username: identifier, password }
  if (payload.captchaId && payload.captchaAnswer) {
    body.captchaId = payload.captchaId
    body.captchaAnswer = payload.captchaAnswer.trim()
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
      secondRoles?: string[]
    }>({
      url: '/auth/login',
      method: 'POST',
      body,
      skipAuthRedirect: true,
    })

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
        positionId: null,
        secondRoles: response.secondRoles ?? [],
      },
    }
  } catch (err: unknown) {
    const e = err as {
      statusCode?: number
      data?: { captchaRequired?: boolean; selfServiceUnlock?: string; message?: string }
    }
    if (typeof e.statusCode === 'number') {
      // 后端返回的 captcha 要求或自助解锁提示，附加到 LoginError 供调用方处理
      const info: LoginErrorInfo = {}
      if (e.data?.captchaRequired) info.captchaRequired = true
      if (e.data?.selfServiceUnlock) info.selfServiceUnlock = e.data.selfServiceUnlock
      const msg = e.data?.message || '账号或密码错误'
      throw new LoginError(msg, info)
    }
    // 后端不可达：仅此时才走离线测试账号兜底
    const matched = defaultTestAccounts.find(
      (a) => a.username === identifier && a.password === password
    )
    if (!matched) throw new Error('账号或密码错误')
    return {
      token: 'local-' + matched.username,
      user: {
        username: matched.username,
        displayName: matched.displayName,
        role: matched.role,
        roleName: matched.roleName,
        department: matched.department,
        employeeType: matched.employeeType,
        status: '在线值守',
        userId: null,
        positionId: null,
      },
    }
  }
}

export async function fetchRoles(): Promise<RoleItem[]> {
  try {
    return await request<RoleItem[]>({ url: '/roles', method: 'GET' })
  } catch {
    return []
  }
}

export async function saveRole(payload: RolePayload): Promise<RoleItem> {
  const normalized = {
    ...payload,
    roleCode: payload.roleCode.trim().toLowerCase(),
    roleName: payload.roleName.trim(),
    description: payload.description.trim(),
    permissions: payload.permissions.map((p) => p.trim()).filter(Boolean),
  }
  if (normalized.id) {
    return request<RoleItem>({ url: '/roles/' + normalized.id, method: 'PUT', body: normalized })
  }
  return request<RoleItem>({ url: '/roles', method: 'POST', body: normalized })
}

export async function deleteRole(id: number): Promise<void> {
  return request<void>({ url: '/roles/' + id, method: 'DELETE' })
}
