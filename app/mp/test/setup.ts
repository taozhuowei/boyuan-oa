import { beforeEach, vi } from 'vitest'

/**
 * MP 单元测试全局 setup
 *
 * 职责：
 * 1. 提供最小化的 uni API mock（无 request 方法，确保 org.ts 走本地 fallback）
 * 2. 每个测试前重置 localStorage 和 uni mock 调用记录
 */

// uni global mock — 不包含 request，让依赖 uni.request 的代码走 catch fallback
vi.stubGlobal('uni', {
  getStorageSync: vi.fn((key: string) => {
    try {
      const v = localStorage.getItem(key)
      return v ? JSON.parse(v) : null
    } catch {
      return null
    }
  }),
  setStorageSync: vi.fn((key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore
    }
  }),
  removeStorageSync: vi.fn((key: string) => {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }),
  showToast: vi.fn(),
  showModal: vi.fn(),
  switchTab: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn()
  // request 故意不提供，让 org.ts 内部 request 抛 TypeError → catch → buildPreviewResult
})

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})
