/**
 * 用户状态管理模块 (User State Management Module)
 *
 * 文件用途：管理用户登录状态和会话信息，提供完整的登录/登出能力
 * 数据来源：uni-app本地存储、登录接口返回数据
 * 交互入口：被登录页、工作台、个人中心等组件调用
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// ============================================================
// H5 环境 Polyfill - 在模块加载时立即执行
// ============================================================
(function setupPolyfill() {
  if (typeof window !== 'undefined' && typeof (window as any).uni === 'undefined') {
    (window as any).uni = {
      getStorageSync(key: string) {
        try {
          const value = localStorage.getItem(key)
          return value ? JSON.parse(value) : ''
        } catch {
          return ''
        }
      },
      setStorageSync(key: string, value: unknown) {
        try {
          localStorage.setItem(key, JSON.stringify(value))
        } catch {
          // ignore
        }
      },
      removeStorageSync(key: string) {
        try {
          localStorage.removeItem(key)
        } catch {
          // ignore
        }
      },
      switchTab(options: { url: string }) {
        window.location.href = options.url
      },
      navigateTo(options: { url: string }) {
        window.location.href = options.url
      },
      redirectTo(options: { url: string }) {
        window.location.href = options.url
      },
      showToast(options: { title: string; icon?: string }) {
        alert(options.title)
      },
      showModal(options: { title?: string; content: string; success?: (res: { confirm: boolean }) => void }) {
        const confirmed = confirm(options.content)
        options.success?.({ confirm: confirmed })
      }
    }
  }
})()

// ============================================================
// 辅助函数 - 每次调用时动态获取 uni
// ============================================================
function getUni() {
  return typeof uni !== 'undefined' ? uni : null
}

function getStorage(key: string): string {
  const u = getUni()
  if (u) {
    try {
      return (u.getStorageSync(key) as string) || ''
    } catch {
      return ''
    }
  }
  // Fallback to localStorage
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : ''
  } catch {
    return ''
  }
}

function setStorage(key: string, value: unknown): void {
  const u = getUni()
  if (u) {
    try {
      u.setStorageSync(key, value)
    } catch {
      // ignore
    }
    return
  }
  // Fallback to localStorage
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

function removeStorage(key: string): void {
  const u = getUni()
  if (u) {
    try {
      u.removeStorageSync(key)
    } catch {
      // ignore
    }
    return
  }
  // Fallback to localStorage
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

// ============================================================
// 类型定义
// ============================================================

/**
 * 会话用户信息类型
 */
export interface SessionUser {
  username: string
  displayName: string
  role: string
  roleName: string
  department: string
  employeeType: string
  status: string
  // Phase 2 新增字段
  userId: number | null
  positionId: number | null
  // Phone field for change phone feature
  phone?: string
}

// ============================================================
// Store 定义
// ============================================================
export const useUserStore = defineStore('user', () => {
  // 从本地存储恢复会话状态 - 使用函数调用而不是模块级别的值
  const storedToken = getStorage('oa-token')
  const storedUser = getStorage('oa-user') as unknown as SessionUser | null

  // 状态 (State)
  const token = ref(storedToken)
  const userInfo = ref<SessionUser | null>(storedUser)

  // 计算状态 (Computed State)
  const isLoggedIn = computed(() => Boolean(token.value && userInfo.value))

  // 持久化方法
  const persist = () => {
    setStorage('oa-token', token.value)
    setStorage('oa-user', userInfo.value)
  }

  // 清除方法
  const clear = () => {
    removeStorage('oa-token')
    removeStorage('oa-user')
  }

  // 会话设置方法
  const setSession = (nextToken: string, nextUser: SessionUser) => {
    token.value = nextToken
    userInfo.value = nextUser
    persist()
  }

  // 更新用户信息（保留token）
  const setUserInfo = (nextUser: Partial<SessionUser>) => {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...nextUser } as SessionUser
    } else {
      userInfo.value = nextUser as SessionUser
    }
    persist()
  }

  // 登出方法
  const logout = () => {
    token.value = ''
    userInfo.value = null
    clear()
  }

  // 对外暴露
  return {
    token,
    userInfo,
    isLoggedIn,
    setSession,
    setUserInfo,
    logout
  }
})
