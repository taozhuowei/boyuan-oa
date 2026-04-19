// Auth utilities for H5 — web-native, no uni.request or uni.storage
// Mirrors app/mp/src/utils/access.ts but uses $fetch via request()

import { request } from './http'
import type { LoginPayload, LoginResult, RoleItem, RolePayload } from '@shared/types'
import { roleNameMap, defaultTestAccounts } from '@shared/types'

export type { LoginPayload, LoginResult, RoleItem, RolePayload }

export async function loginWithAccount(payload: LoginPayload): Promise<LoginResult> {
  const identifier = payload.identifier.trim()
  const password = payload.password.trim()
  if (!identifier || !password) throw new Error('请输入账号和密码')

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
      body: { username: identifier, password },
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
  } catch {
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
