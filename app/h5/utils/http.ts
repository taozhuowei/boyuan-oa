// HTTP utility for H5 — wraps $fetch with auth header injection
// Uses Nuxt's $fetch (ofetch) instead of uni.request

const API_BASE = '/api'

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  skipAuthRedirect?: boolean
}

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
    })
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode
    if (status === 401 && !options.skipAuthRedirect && _isClient) {
      const store = useUserStore()
      store.logout()
      await navigateTo('/login')
    }
    throw err
  }
}
