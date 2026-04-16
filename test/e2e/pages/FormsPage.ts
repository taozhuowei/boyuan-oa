/**
 * FormsPage — Page Object
 *
 * 职责：封装各表单提交相关页面的操作。
 *
 * 路由映射（来自 app/h5/pages/）：
 *   请假 / 加班 → /attendance（Tab key="leave" / "overtime"）
 *   施工日志    → /construction-log（模态框）
 *   工伤申报    → /injury（模态框）
 *   表单列表    → /forms
 *
 * data-catch 命名规范：
 *   请假：form-leave-type / form-leave-start-date / form-leave-days / leave-form-submit
 *   日志：form-log-open-btn / form-log-date / form-log-content / form-log-submit
 *   工伤：injury-apply-btn / injury-date / injury-description / injury-apply-modal-submit
 */
import { Page, Locator, expect } from '@playwright/test'

export class FormsPage {
  constructor(private readonly page: Page) {}

  // ── 请假申请 ─────────────────────────────────────────────────────────────

  /** 导航到考勤管理页并切换到请假 Tab */
  async gotoLeaveForm(): Promise<void> {
    await this.page.goto('/attendance')
    await this.page.waitForLoadState('networkidle')
    // 点击"请假"Tab（data-catch="attendance-tab-leave" 由 Kimi 添加，
    // 备选：直接通过文本定位）
    const leaveTab = this.page.getByTestId('attendance-tab-leave')
    if (await leaveTab.isVisible()) {
      await leaveTab.click()
    }
  }

  async fillLeaveForm(opts: { leaveType: string; startDate: string; endDate: string }): Promise<void> {
    await this.page.getByTestId('form-leave-type').selectOption(opts.leaveType)
    await this.page.getByTestId('form-leave-start-date').fill(opts.startDate)
    await this.page.getByTestId('form-leave-end-date').fill(opts.endDate)
  }

  async submitLeaveForm(): Promise<void> {
    await this.page.getByTestId('leave-form-submit').click()
  }

  async expectSubmitSuccess(): Promise<void> {
    await expect(this.page.getByTestId('form-submit-success')).toBeVisible({ timeout: 10_000 })
  }

  // ── 施工日志 ─────────────────────────────────────────────────────────────

  async gotoLogForm(): Promise<void> {
    await this.page.goto('/construction-log')
    await this.page.waitForLoadState('networkidle')
    // 打开新建日志模态框（data-catch="construction-log-create-btn"）
    await this.page.getByTestId('construction-log-create-btn').click()
  }

  async fillLogForm(opts: { content: string; logDate?: string }): Promise<void> {
    if (opts.logDate) {
      await this.page.getByTestId('form-log-date').fill(opts.logDate)
    }
    await this.page.getByTestId('form-log-content').fill(opts.content)
  }

  async submitLogForm(): Promise<void> {
    await this.page.getByTestId('form-log-submit').click()
  }

  // ── 工伤申报 ─────────────────────────────────────────────────────────────

  async gotoInjuryForm(): Promise<void> {
    await this.page.goto('/injury')
    await this.page.waitForLoadState('networkidle')
    // 打开申报模态框
    await this.page.getByTestId('injury-apply-btn').click()
  }

  /** 断言补偿金额字段不存在（工人/员工提交时不可见，DESIGN.md §8.4） */
  async expectAmountFieldHidden(): Promise<void> {
    await expect(this.page.getByTestId('injury-amount-input')).not.toBeVisible()
  }

  async fillInjuryForm(opts: { description: string; injuryDate?: string }): Promise<void> {
    if (opts.injuryDate) {
      await this.page.getByTestId('injury-date').fill(opts.injuryDate)
    }
    await this.page.getByTestId('injury-description').fill(opts.description)
  }

  async submitInjuryForm(): Promise<void> {
    await this.page.getByTestId('injury-apply-modal-submit').click()
  }

  // ── 表单列表 ─────────────────────────────────────────────────────────────

  async gotoFormList(): Promise<void> {
    await this.page.goto('/forms')
  }

  latestFormStatus(): Locator {
    return this.page.getByTestId('form-list-item').first().getByTestId('form-status')
  }
}
