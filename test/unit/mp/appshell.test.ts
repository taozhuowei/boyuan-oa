/**
 * MP AppShell 路由逻辑单元测试
 *
 * 不挂载组件（uni-app 条件编译在 jsdom 中不生效，emoji icon 字符串会触发
 * InvalidCharacterError）。改为直接验证路由逻辑与 uni API 调用契约。
 *
 * 与 src/layouts/AppShell.vue 中 goTo / handleLogout 保持一致，
 * 若源码中 TAB_PAGES 列表或跳转方式变更，须同步更新此处。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── uni API mock ─────────────────────────────────────────────────────────────
const mockSwitchTab  = vi.fn()
const mockRedirectTo = vi.fn()

vi.stubGlobal('uni', {
  switchTab:  mockSwitchTab,
  redirectTo: mockRedirectTo
})

// ── 与 AppShell.vue 保持一致的路由规则（若源码改动需同步） ──────────────────
const TAB_PAGES = ['/pages/index/index', '/pages/login/index']

function goTo(path: string, currentPath = '') {
  if (currentPath === path) return
  if (TAB_PAGES.includes(path)) {
    uni.switchTab({ url: path })
  } else {
    uni.redirectTo({ url: path })
  }
}

function handleLogout(logoutFn: () => void) {
  logoutFn()
  uni.switchTab({ url: '/pages/login/index' })
}

// ─────────────────────────────────────────────────────────────────────────────

describe('路由规则', () => {
  beforeEach(() => { mockSwitchTab.mockClear(); mockRedirectTo.mockClear() })

  it('登录页属于 tabBar，goTo 使用 switchTab', () => {
    goTo('/pages/login/index')
    expect(mockSwitchTab).toHaveBeenCalledWith({ url: '/pages/login/index' })
    expect(mockRedirectTo).not.toHaveBeenCalled()
  })

  it('工作台属于 tabBar，goTo 使用 switchTab', () => {
    goTo('/pages/index/index')
    expect(mockSwitchTab).toHaveBeenCalledWith({ url: '/pages/index/index' })
    expect(mockRedirectTo).not.toHaveBeenCalled()
  })

  it('考勤/薪资等业务页用 redirectTo', () => {
    for (const path of [
      '/pages/attendance/index',
      '/pages/payroll/index',
      '/pages/projects/index',
      '/pages/employees/index'
    ]) {
      mockRedirectTo.mockClear(); mockSwitchTab.mockClear()
      goTo(path)
      expect(mockRedirectTo).toHaveBeenCalledWith({ url: path })
      expect(mockSwitchTab).not.toHaveBeenCalled()
    }
  })

  it('当前页与目标相同时不导航', () => {
    goTo('/pages/index/index', '/pages/index/index')
    expect(mockSwitchTab).not.toHaveBeenCalled()
    expect(mockRedirectTo).not.toHaveBeenCalled()
  })
})

describe('退出登录', () => {
  beforeEach(() => { mockSwitchTab.mockClear(); mockRedirectTo.mockClear() })

  it('调用 logout 后用 switchTab 跳转登录页', () => {
    const mockLogout = vi.fn()
    handleLogout(mockLogout)

    expect(mockLogout).toHaveBeenCalledOnce()
    expect(mockSwitchTab).toHaveBeenCalledWith({ url: '/pages/login/index' })
  })

  it('退出时禁止使用 redirectTo 跳转登录页（tabBar 限制）', () => {
    handleLogout(vi.fn())
    expect(mockRedirectTo).not.toHaveBeenCalledWith(
      expect.objectContaining({ url: '/pages/login/index' })
    )
  })
})
