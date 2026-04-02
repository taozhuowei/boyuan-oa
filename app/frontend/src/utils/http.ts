import { useUserStore } from '../stores'

const API_BASE = 'http://localhost:8080/api'

function getClientType(): string {
  // #ifdef H5
  return 'web'
  // #endif
  // #ifdef MP-WEIXIN || APP-PLUS
  return 'mp'
  // #endif
  return 'web'
}

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: unknown
  baseURL?: string
}

export function request<T>(options: RequestOptions): Promise<T> {
  const uniIns = typeof uni === 'undefined' ? null : uni
  if (!uniIns) return Promise.reject(new Error('Not in uni-app environment'))

  const userStore = useUserStore()
  const token = userStore.token

  const headers: Record<string, string> = {
    'X-Client-Type': getClientType()
  }
  if (token) {
    headers['Authorization'] = 'Bearer ' + token
  }

  const base = options.baseURL ?? API_BASE

  return new Promise((resolve, reject) => {
    uniIns.request({
      url: base + options.url,
      method: options.method ?? 'GET',
      data: options.data as string | Record<string, unknown> | ArrayBuffer | undefined,
      header: headers,
      success(res) {
        if (res.statusCode === 401) {
          userStore.logout()
          uni.navigateTo({ url: '/pages/login/index' })
          reject(new Error('Unauthorized'))
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T)
        } else {
          const msg = (res.data as any)?.message || 'Request failed'
          uni.showToast({ title: msg, icon: 'none' })
          reject(new Error(msg))
        }
      },
      fail() {
        uni.showToast({ title: 'Network error', icon: 'none' })
        reject(new Error('Network error'))
      }
    })
  })
}

export const http = { request }
