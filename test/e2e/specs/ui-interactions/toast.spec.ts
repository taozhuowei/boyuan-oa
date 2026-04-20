/**
 * UI-TOAST — AntD Message Toast 行为测试
 *
 * 职责：验证操作成功/失败后的 Toast 反馈行为。
 * 覆盖场景：
 *   1. config-save-shows-success-toast — 保存系统配置后出现成功 Toast
 *   2. toast-auto-dismisses            — 成功 Toast 在合理时间内自动消失
 *   3. config-save-error-toast         — 后端 500 时出现错误反馈
 *
 * 说明：测试 1 和 2 共享页面状态（按顺序执行，test 2 承接 test 1 的页面）。
 */
import { test, expect, loginAs, resetData } from '../../../tools/fixtures/index'

test.describe('UI-TOAST Toast 反馈测试', () => {
  test.beforeAll(async () => {
    await resetData()
  })

  // ── 测试 1: 保存配置后出现成功 Toast ────────────────────────────────────────
  test('config-save-shows-success-toast', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'ceo')
    const page = await context.newPage()

    try {
      await page.goto('/config')
      await page.waitForLoadState('networkidle')

      // 填写公司名称并保存
      const name_input = page.getByTestId('config-company-name-input')
      await name_input.waitFor({ state: 'visible' })
      await name_input.clear()
      await name_input.fill('测试公司名称')

      await page.getByTestId('config-company-name-save-btn').click()

      // 等待成功 Toast
      const success_toast = page.locator('.ant-message-success')
      await expect(success_toast).toBeVisible({ timeout: 8000 })

      // Toast 文本不得含有原始 HTTP 信息
      const toast_text = await success_toast.textContent() ?? ''
      expect(toast_text).not.toContain('POST')
      expect(toast_text).not.toContain('/api')
      expect(toast_text).not.toContain('200')
    } finally {
      await context.close()
    }
  })

  // ── 测试 2: 成功 Toast 自动消失 ──────────────────────────────────────────────
  test('toast-auto-dismisses', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'ceo')
    const page = await context.newPage()

    try {
      await page.goto('/config')
      await page.waitForLoadState('networkidle')

      // 触发保存以产生 Toast
      const name_input = page.getByTestId('config-company-name-input')
      await name_input.waitFor({ state: 'visible' })
      await name_input.clear()
      await name_input.fill('测试公司名称自动消失')

      await page.getByTestId('config-company-name-save-btn').click()

      const success_toast = page.locator('.ant-message-success')
      await expect(success_toast).toBeVisible({ timeout: 8000 })

      // Toast 应在 6s 内自动消失（AntD 默认 duration 3s，加缓冲）
      await expect(success_toast).not.toBeVisible({ timeout: 6000 })
    } finally {
      await context.close()
    }
  })

  // ── 测试 3: 后端 500 时出现错误反馈 ─────────────────────────────────────────
  test('config-save-error-toast', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'ceo')
    const page = await context.newPage()

    // 监听浏览器 dialog（部分实现可能用 alert）
    let dialog_appeared = false
    page.once('dialog', async dialog => {
      dialog_appeared = true
      await dialog.dismiss()
    })

    try {
      await page.goto('/config')
      await page.waitForLoadState('networkidle')

      // 拦截配置保存接口，强制返回 500
      await page.route('**/api/config**', route =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal Server Error' })
        })
      )

      const name_input = page.getByTestId('config-company-name-input')
      await name_input.waitFor({ state: 'visible' })
      await name_input.clear()
      await name_input.fill('触发错误')

      await page.getByTestId('config-company-name-save-btn').click()

      // 等待错误反馈：Toast 错误 或 浏览器 dialog，满足其一即通过
      const error_toast = page.locator('.ant-message-error')

      // 给 500ms 让 dialog 事件有机会触发
      await page.waitForTimeout ? undefined : undefined // 不使用 waitForTimeout
      // 用 expect.poll 轮询而非固定延时
      await expect
        .poll(
          async () => {
            const is_toast_visible = await error_toast.isVisible().catch(() => false)
            return is_toast_visible || dialog_appeared
          },
          { timeout: 8000, message: 'Expected error toast or dialog to appear after 500 response' }
        )
        .toBe(true)
    } finally {
      await context.close()
    }
  })
})
