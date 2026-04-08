/**
 * stores/user.ts 单元测试
 *
 * 覆盖：setSession、logout、setUserInfo、isLoggedIn 计算属性、
 *       localStorage 持久化与恢复
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import type { SessionUser } from '@shared/types'

// uni polyfill — stores/user.ts 调用 uni.* 读写存储，在 jsdom 环境下用 localStorage 模拟
vi.stubGlobal('uni', {
  getStorageSync: (key: string) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null } catch { return null }
  },
  setStorageSync: (key: string, value: unknown) => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
  },
  removeStorageSync: (key: string) => {
    try { localStorage.removeItem(key) } catch { /* ignore */ }
  }
})

function mockUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    username: 'ceo.demo',
    displayName: '陈明远',
    role: 'ceo',
    roleName: '首席经营者',
    department: '运营管理部',
    employeeType: 'OFFICE',
    status: '在线值守',
    userId: 5,
    positionId: null,
    ...overrides
  }
}

describe('useUserStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('初始状态：isLoggedIn = false，token / userInfo 为空', () => {
    const store = useUserStore()
    expect(store.isLoggedIn).toBe(false)
    expect(store.token).toBeFalsy()
    expect(store.userInfo).toBeNull()
  })

  it('setSession 后 token 和 userInfo 被正确赋值', () => {
    const store = useUserStore()
    store.setSession('jwt-token', mockUser())

    expect(store.token).toBe('jwt-token')
    expect(store.userInfo?.username).toBe('ceo.demo')
    expect(store.userInfo?.role).toBe('ceo')
  })

  it('setSession 后 isLoggedIn = true', () => {
    const store = useUserStore()
    store.setSession('jwt-token', mockUser())
    expect(store.isLoggedIn).toBe(true)
  })

  it('setSession 后数据被持久化到 localStorage', () => {
    const store = useUserStore()
    store.setSession('persisted-token', mockUser())

    const rawToken = localStorage.getItem('oa-token')
    expect(rawToken).not.toBeNull()
    // uni polyfill 用 JSON.stringify 存储，解析后应等于原值
    expect(JSON.parse(rawToken!)).toBe('persisted-token')
  })

  it('logout 后 token 清空、userInfo 为 null、isLoggedIn = false', () => {
    const store = useUserStore()
    store.setSession('jwt-token', mockUser())
    store.logout()

    expect(store.token).toBeFalsy()
    expect(store.userInfo).toBeNull()
    expect(store.isLoggedIn).toBe(false)
  })

  it('logout 后 localStorage 中 oa-token / oa-user 被清除', () => {
    const store = useUserStore()
    store.setSession('jwt-token', mockUser())
    store.logout()

    const rawToken = localStorage.getItem('oa-token')
    const rawUser = localStorage.getItem('oa-user')
    // 清除后值为 null 或空字符串序列化 '""'
    expect(!rawToken || rawToken === '""' || rawToken === 'null').toBe(true)
    expect(!rawUser || rawUser === 'null').toBe(true)
  })

  it('setUserInfo 局部更新后原有字段保留', () => {
    const store = useUserStore()
    store.setSession('jwt-token', mockUser())
    store.setUserInfo({ displayName: '陈总' })

    expect(store.userInfo?.displayName).toBe('陈总')
    expect(store.userInfo?.username).toBe('ceo.demo') // 原字段保留
    expect(store.userInfo?.role).toBe('ceo')
  })

  it('重建 pinia 时从 localStorage 恢复已登录状态', () => {
    // 先登录并持久化
    const store1 = useUserStore()
    store1.setSession('restored-token', mockUser({ username: 'pm.demo' }))

    // 重建 pinia（模拟页面刷新）
    setActivePinia(createPinia())
    const store2 = useUserStore()

    expect(store2.token).toBe('restored-token')
    expect(store2.userInfo?.username).toBe('pm.demo')
    expect(store2.isLoggedIn).toBe(true)
  })

  it('token 存在但 userInfo 为 null 时 isLoggedIn = false', () => {
    // 手动只写 token，不写 user
    localStorage.setItem('oa-token', JSON.stringify('orphan-token'))
    setActivePinia(createPinia())
    const store = useUserStore()

    // userInfo 读取返回 null（空字符串 → falsy）
    expect(store.isLoggedIn).toBe(false)
  })
})
