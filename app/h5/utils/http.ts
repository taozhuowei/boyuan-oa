// HTTP utility for H5 — wraps $fetch with auth header injection
// Uses Nuxt's $fetch (ofetch) instead of uni.request

import { message } from 'ant-design-vue'

const API_BASE = '/api'

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  skipAuthRedirect?: boolean
}

/**
 * 统一 HTTP 请求封装。自动注入 JWT token 与 X-Client-Type；401 且未显式 skipAuthRedirect 时退出并重定向 /login。
 * @param options 请求配置（url/method/body/skipAuthRedirect）
 * @param _isClient 内部参数，单元测试覆盖客户端分支用，生产代码不应显式传入
 */
export async function request<T>(options: RequestOptions, _isClient = import.meta.client): Promise<T> {
  const tokenCookie = useCookie<string | null>('oa-token')
  const headers: Record<string, string> = { 'X-Client-Type': 'web' }
  if (tokenCookie.value) {
    headers['Authorization'] = 'Bearer ' + tokenCookie.value
  }

  try {
    return await $fetch<T>(API_BASE + options.url, {
      method: options.method ?? 'GET',
      body: options.body as Record<string, unknown> | undefined,
      headers,
      // Dev-only: capture _devCode from any response and expose it to DevToolbar.
      // Tree-shaken in production builds because import.meta.env.DEV is a build-time constant.
      onResponse: import.meta.env.DEV
        ? ({ response }) => {
            const data = response._data
            if (data && typeof data === 'object' && '_devCode' in (data as object)) {
              useState<string>('dev-latest-code', () => '').value = String(
                (data as Record<string, unknown>)._devCode,
              )
            }
          }
        : undefined,
    })
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode
    if (status === 401 && !options.skipAuthRedirect && _isClient) {
      // Check if the server message indicates a disabled account — show specific toast before redirect
      const responseMessage: string = (err as { data?: { message?: string } }).data?.message ?? ''
      const store = useUserStore()
      store.logout()
      if (responseMessage.includes('账号') || responseMessage.includes('停用') || responseMessage.includes('禁用')) {
        message.error('您的账号已被停用，请联系管理员')
      }
      await navigateTo('/login')
    }
    throw err
  }
}
