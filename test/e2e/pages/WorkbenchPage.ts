/**
 * WorkbenchPage — Page Object
 *
 * 职责：封装工作台首页（/）的侧边栏导航可见性断言。
 * 表单入口对应侧边栏导航菜单项（data-catch="nav-item-{path}"），
 * 由 layouts/default.vue 的 ROLE_MENUS 按角色动态渲染。
 *
 * 映射关系：
 *   LEAVE / OVERTIME → nav-item-/attendance（同一考勤管理菜单项）
 *   INJURY           → nav-item-/injury
 *   LOG              → nav-item-/construction-log
 */
import { Page, Locator, expect } from '@playwright/test'

const FORM_ROUTE_MAP = {
  LEAVE:    '/attendance',
  OVERTIME: '/attendance',
  INJURY:   '/injury',
  LOG:      '/construction-log'
} as const

type FormCode = keyof typeof FORM_ROUTE_MAP

export class WorkbenchPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  /** 断言侧边栏导航中对应表单路由菜单项可见 */
  async expectFormEntryVisible(code: FormCode): Promise<void> {
    await expect(this.page.getByTestId(`nav-item-${FORM_ROUTE_MAP[code]}`)).toBeVisible()
  }

  /** 断言侧边栏导航中对应表单路由菜单项不存在 */
  async expectFormEntryHidden(code: FormCode): Promise<void> {
    await expect(this.page.getByTestId(`nav-item-${FORM_ROUTE_MAP[code]}`)).not.toBeVisible()
  }

  /** 点击侧边栏导航菜单项进入对应页面 */
  async clickFormEntry(code: FormCode): Promise<void> {
    await this.page.getByTestId(`nav-item-${FORM_ROUTE_MAP[code]}`).click()
  }

  /** 签名状态徽章 */
  signatureBadge(): Locator {
    return this.page.getByTestId('signature-status')
  }

  /** 顶栏通知铃铛 */
  notificationBell(): Locator {
    return this.page.getByTestId('notification-bell')
  }
}
