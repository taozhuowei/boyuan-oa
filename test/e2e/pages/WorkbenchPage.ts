/**
 * WorkbenchPage — Page Object
 *
 * 职责：封装工作台首页（/）的可见性断言和入口点击操作。
 * 工作台入口卡片根据角色动态渲染（menu 由后端 role 控制）。
 */
import { Page, Locator, expect } from '@playwright/test'

export class WorkbenchPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  /** 断言指定 testid 的表单入口可见 */
  async expectFormEntryVisible(code: 'LEAVE' | 'OVERTIME' | 'INJURY' | 'LOG'): Promise<void> {
    await expect(this.page.getByTestId(`form-entry-${code}`)).toBeVisible()
  }

  /** 断言指定 testid 的表单入口不存在 */
  async expectFormEntryHidden(code: 'LEAVE' | 'OVERTIME' | 'INJURY' | 'LOG'): Promise<void> {
    await expect(this.page.getByTestId(`form-entry-${code}`)).not.toBeVisible()
  }

  /** 点击表单入口，进入申请页 */
  async clickFormEntry(code: 'LEAVE' | 'OVERTIME' | 'INJURY' | 'LOG'): Promise<void> {
    await this.page.getByTestId(`form-entry-${code}`).click()
  }

  /** 签名状态徽章文本 */
  signatureBadge(): Locator {
    return this.page.getByTestId('signature-status')
  }

  /** 待办数量徽章 */
  pendingBadge(): Locator {
    return this.page.getByTestId('pending-count')
  }

  /** 通知铃铛 */
  notificationBell(): Locator {
    return this.page.getByTestId('notification-bell')
  }
}
