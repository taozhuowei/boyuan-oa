/**
 * ApprovalPage — Page Object
 *
 * 职责：封装审批待办列表和审批操作页面。
 * 适用角色：dept_manager、pm、finance、ceo 等具有审批权限的角色。
 */
import { Page, Locator, expect } from '@playwright/test'

export class ApprovalPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/todo')
    await this.page.waitForLoadState('networkidle')
  }

  /** 待办列表中的第一条记录 */
  firstItem(): Locator {
    return this.page.getByTestId('todo-item').first()
  }

  /** 待办数量 */
  async pendingCount(): Promise<number> {
    const items = this.page.getByTestId('todo-item')
    return items.count()
  }

  /** 点击第一条待办进入审批详情（点击"查看审批"按钮打开模态框） */
  async openFirst(): Promise<void> {
    await this.page.locator('[data-catch^="todo-row-detail-btn"]').first().click()
    // Wait for the approval modal to be fully visible
    await this.page.getByTestId('approval-approve-btn').waitFor({ state: 'visible', timeout: 10_000 })
  }

  /** 填写审批意见 */
  async fillComment(comment: string): Promise<void> {
    await this.page.getByTestId('approval-comment').fill(comment)
  }

  /** 点击"通过"按钮 */
  async approve(): Promise<void> {
    await this.page.getByTestId('approval-approve-btn').click()
    await expect(this.page.getByTestId('approval-result')).toBeVisible({ timeout: 10_000 })
  }

  /** 点击"驳回"按钮（需先填写意见） */
  async reject(reason: string): Promise<void> {
    await this.fillComment(reason)
    await this.page.getByTestId('approval-reject-btn').click()
    await expect(this.page.getByTestId('approval-result')).toBeVisible({ timeout: 10_000 })
  }

  /** 断言待办列表为空 */
  async expectEmpty(): Promise<void> {
    await expect(this.page.getByTestId('todo-empty')).toBeVisible()
  }

  /** 断言特定业务类型的待办存在 */
  async expectItemWithType(type: string): Promise<void> {
    await expect(this.page.getByTestId('todo-item').filter({ hasText: type })).toBeVisible()
  }
}
