/**
 * LoginPage — Page Object
 *
 * 职责：封装 /login 页面的所有交互，spec 文件不直接操作 CSS 选择器。
 * 元素定位优先使用 data-testid，其次 ARIA role + name。
 */
import { Page, expect } from '@playwright/test'

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/login')
  }

  async fillUsername(username: string): Promise<void> {
    await this.page.getByTestId('login-username').fill(username)
  }

  async fillPassword(password: string): Promise<void> {
    await this.page.getByTestId('login-password').fill(password)
  }

  async submit(): Promise<void> {
    await this.page.getByTestId('login-submit').click()
  }

  /** 完整登录流程，等待跳转到工作台 */
  async loginAs(username: string, password: string): Promise<void> {
    await this.goto()
    await this.fillUsername(username)
    await this.fillPassword(password)
    await this.submit()
    await expect(this.page).toHaveURL('/', { timeout: 10_000 })
  }

  async getErrorMessage(): Promise<string> {
    return this.page.getByTestId('login-error').innerText()
  }
}
