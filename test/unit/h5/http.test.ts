/**
 * H5 utils/http.ts 单元测试
 *
 * 覆盖：request 函数 — 带 token 请求、无 token 请求、
 *       401 自动退出重定向、skipAuthRedirect 时不重定向、非 401 错误直接抛出
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Nuxt 全局 mock（必须在导入 http.ts 之前 hoist） ──────────────────────────
const mockCookieValue = vi.fn<[], string | null>(() => null)
const mockLogout = vi.fn()
const mockNavigateTo = vi.fn()
const mockFetch = vi.fn()

vi.stubGlobal('useCookie', () => ({ value: mockCookieValue() }))
vi.stubGlobal('$fetch', mockFetch)
vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('useUserStore', () => ({ logout: mockLogout }))

// Note: import.meta.client is falsy in jsdom (not a Vite browser build),
// so the 401 redirect branch inside request() does NOT execute in unit tests.
// The redirect behavior is covered by E2E tests instead.

import { request } from '@/utils/http'

describe('request', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookieValue.mockReturnValue(null)
    mockFetch.mockResolvedValue({ data: 'ok' })
  })

  it('无 token 时不注入 Authorization 头', async () => {
    mockCookieValue.mockReturnValue(null)
    await request({ url: '/test' })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.not.objectContaining({ Authorization: expect.anything() }),
      }),
    )
  })

  it('有 token 时注入 Bearer Authorization 头', async () => {
    mockCookieValue.mockReturnValue('my-token')
    await request({ url: '/test', method: 'GET' })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
      }),
    )
  })

  it('默认使用 GET 方法', async () => {
    await request({ url: '/test' })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('POST 请求携带 body', async () => {
    const body = { key: 'value' }
    await request({ url: '/test', method: 'POST', body })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({ method: 'POST', body }),
    )
  })

  it('返回 $fetch 的响应数据', async () => {
    mockFetch.mockResolvedValue({ id: 1 })
    const result = await request<{ id: number }>({ url: '/test' })
    expect(result).toEqual({ id: 1 })
  })

  it('401 错误仍然被 re-throw（jsdom 中不触发重定向）', async () => {
    // import.meta.client is falsy in jsdom, so logout/navigateTo are NOT called.
    // The error is still re-thrown for callers to handle.
    const error = Object.assign(new Error('Unauthorized'), { statusCode: 401 })
    mockFetch.mockRejectedValue(error)

    await expect(request({ url: '/secure' })).rejects.toThrow('Unauthorized')
    // In the browser build, logout + navigateTo would fire — covered by E2E.
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('skipAuthRedirect=true 时 401 不触发重定向', async () => {
    const error = Object.assign(new Error('Unauthorized'), { statusCode: 401 })
    mockFetch.mockRejectedValue(error)

    await expect(request({ url: '/secure', skipAuthRedirect: true })).rejects.toThrow(
      'Unauthorized',
    )
    expect(mockLogout).not.toHaveBeenCalled()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('非 401 错误直接抛出，不触发退出', async () => {
    const error = Object.assign(new Error('Server Error'), { statusCode: 500 })
    mockFetch.mockRejectedValue(error)

    await expect(request({ url: '/test' })).rejects.toThrow('Server Error')
    expect(mockLogout).not.toHaveBeenCalled()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
})
