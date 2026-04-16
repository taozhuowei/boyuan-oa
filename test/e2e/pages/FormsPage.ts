/**
 * FormsPage — Page Object
 *
 * 职责：封装表单提交相关页面的操作（请假、加班、施工日志、工伤申报）。
 * 各表单使用统一的 data-testid 命名规范：
 *   form-{type}-{field}  例如 form-leave-days、form-leave-submit
 */
import { Page, Locator, expect } from '@playwright/test'

export class FormsPage {
  constructor(private readonly page: Page) {}

  // ── 请假申请 ────────────────────────────────────────────────────────────

  async gotoLeaveForm(): Promise<void> {
    await this.page.goto('/forms/leave')
  }

  async fillLeaveForm(opts: { leaveType: string; days: number; startDate: string }): Promise<void> {
    await this.page.getByTestId('form-leave-type').selectOption(opts.leaveType)
    await this.page.getByTestId('form-leave-start-date').fill(opts.startDate)
    await this.page.getByTestId('form-leave-days').fill(String(opts.days))
  }

  async submitLeaveForm(): Promise<void> {
    await this.page.getByTestId('form-leave-submit').click()
  }

  async expectSubmitSuccess(): Promise<void> {
    await expect(this.page.getByTestId('form-submit-success')).toBeVisible({ timeout: 10_000 })
  }

  // ── 施工日志 ────────────────────────────────────────────────────────────

  async gotoLogForm(): Promise<void> {
    await this.page.goto('/forms/log')
  }

  async fillLogForm(opts: { projectId: string; weather: string; content: string }): Promise<void> {
    await this.page.getByTestId('form-log-project').selectOption(opts.projectId)
    await this.page.getByTestId('form-log-weather').selectOption(opts.weather)
    await this.page.getByTestId('form-log-content').fill(opts.content)
  }

  async submitLogForm(): Promise<void> {
    await this.page.getByTestId('form-log-submit').click()
  }

  // ── 工伤申报 ────────────────────────────────────────────────────────────

  async gotoInjuryForm(): Promise<void> {
    await this.page.goto('/forms/injury')
  }

  /** 断言"补偿金额"字段不存在（工人提交时不可见，DESIGN.md §8.4） */
  async expectAmountFieldHidden(): Promise<void> {
    await expect(this.page.getByTestId('form-injury-amount')).not.toBeVisible()
  }

  async fillInjuryForm(opts: { projectId: string; description: string }): Promise<void> {
    await this.page.getByTestId('form-injury-project').selectOption(opts.projectId)
    await this.page.getByTestId('form-injury-description').fill(opts.description)
  }

  async submitInjuryForm(): Promise<void> {
    await this.page.getByTestId('form-injury-submit').click()
  }

  // ── 表单列表 ────────────────────────────────────────────────────────────

  async gotoFormList(): Promise<void> {
    await this.page.goto('/forms')
  }

  latestFormStatus(): Locator {
    return this.page.getByTestId('form-list-item').first().getByTestId('form-status')
  }
}
