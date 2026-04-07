import { useUserStore } from '../stores'

const API_BASE = 'http://localhost:8080/api'

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: unknown
  baseURL?: string
  skipAuthRedirect?: boolean
}

// 请求去重：维护进行中的请求 key 集合
const pendingRequests = new Set<string>()

export function request<T>(options: RequestOptions): Promise<T> {
  const uniIns = typeof uni === 'undefined' ? null : uni
  if (!uniIns) return Promise.reject(new Error('Not in uni-app environment'))

  const userStore = useUserStore()
  const token = userStore.token

  const headers: Record<string, string> = {
    'X-Client-Type': 'mp'
  }
  if (token) {
    headers['Authorization'] = 'Bearer ' + token
  }

  const base = options.baseURL ?? API_BASE

  // 请求去重检查
  const requestKey = `${options.method ?? 'GET'}:${options.url}`
  if (pendingRequests.has(requestKey)) {
    return Promise.reject(new Error('请勿重复提交'))
  }
  pendingRequests.add(requestKey)

  return new Promise((resolve, reject) => {
    uniIns.request({
      url: base + options.url,
      // UniApp types 未列出 PATCH，但微信小程序实际支持，强制转型绕过类型检查
      method: (options.method ?? 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE',
      data: options.data as string | Record<string, unknown> | ArrayBuffer | undefined,
      header: headers,
      success(res) {
        if (res.statusCode === 401 && options.skipAuthRedirect !== true) {
          userStore.logout()
          // 登录页是 tabBar 页面，必须用 switchTab 而非 navigateTo
          uni.switchTab({ url: '/pages/login/index' })
          pendingRequests.delete(requestKey)
          reject(new Error('Unauthorized'))
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          pendingRequests.delete(requestKey)
          resolve(res.data as T)
        } else {
          const msg = (res.data as any)?.message || 'Request failed'
          uni.showToast({ title: msg, icon: 'none' })
          pendingRequests.delete(requestKey)
          reject(new Error(msg))
        }
      },
      fail() {
        uni.showToast({ title: 'Network error', icon: 'none' })
        pendingRequests.delete(requestKey)
        reject(new Error('Network error'))
      }
    })
  })
}

export const http = { request }
