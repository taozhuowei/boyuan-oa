/**
 * UI-MODAL-LIFECYCLE — AntD Modal 生命周期测试
 *
 * 职责：验证 Modal 的开启、确认拦截、ESC 关闭和关闭按钮行为。
 * 覆盖场景：
 *   1. employee-create-modal-opens       — 点击创建按钮弹出 Modal，标题非空
 *   2. disable-modal-requires-confirmation — 停用确认框出现前不触发 API
 *   3. modal-closes-on-escape            — ESC 键关闭 Modal
 *   4. modal-close-button-works          — 点击 × 按钮关闭 Modal
 */
import { test, expect, loginAs, resetData } from '../../../tools/fixtures/index'

test.describe('UI-MODAL-LIFECYCLE Modal 生命周期测试', () => {
  test.beforeAll(async () => {
    await resetData()
  })

  // ── 测试 1: 点击创建按钮弹出 Modal ──────────────────────────────────────────
  test('employee-create-modal-opens', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'ceo')
    const page = await context.newPage()

    try {
      await page.goto('/employees')
      await page.waitForLoadState('networkidle')

      await page.getByTestId('employee-create-btn').click()

      // Modal 内容区可见
      const modal = page.locator('.ant-modal-content')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // 标题存在且非空
      const title = modal.locator('.ant-modal-title')
      await expect(title).toBeVisible()
      const title_text = await title.textContent()
      expect((title_text ?? '').trim().length).toBeGreaterThan(0)
    } finally {
      await page.keyboard.press('Escape')
      await context.close()
    }
  })

  // ── 测试 2: 停用确认框出现，未点确认前不触发 API ─────────────────────────────
  test('disable-modal-requires-confirmation', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'ceo')
    const page = await context.newPage()

    try {
      await page.goto('/employees')
      await page.waitForLoadState('networkidle')

      // 追踪停用接口是否被调用
      let disable_api_called = false
      await page.route('**/api/employees/*/disable', () => {
        disable_api_called = true
        // 不 fulfill — 测试结束前此路由不应被触发
      })
      // 同时监听 status 路径写法（PATCH /employees/:id/status）
      await page.route('**/api/employees/*/status', () => {
        disable_api_called = true
      })

      // 找到第一个停用按钮并点击
      const disable_btn = page.getByTestId('employee-disable-btn').first()
      await disable_btn.waitFor({ state: 'visible', timeout: 10_000 })
      await disable_btn.click()

      // 确认对话框必须出现
      const confirm_dialog = page.getByTestId('disable-confirm-dialog')
      await expect(confirm_dialog).toBeVisible({ timeout: 5000 })

      // 此时 API 尚未调用
      expect(disable_api_called).toBe(false)

      // 按 ESC 取消，验证 API 仍未调用
      await page.keyboard.press('Escape')
      await expect(confirm_dialog).not.toBeVisible({ timeout: 3000 })
      expect(disable_api_called).toBe(false)
    } finally {
      await context.close()
    }
  })

  // ── 测试 3: ESC 键关闭 Modal ─────────────────────────────────────────────────
  test('modal-closes-on-escape', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'ceo')
    const page = await context.newPage()

    try {
      await page.goto('/employees')
      await page.waitForLoadState('networkidle')

      await page.getByTestId('employee-create-btn').click()
      const modal = page.locator('.ant-modal-content')
      await expect(modal).toBeVisible({ timeout: 5000 })

      await page.keyboard.press('Escape')

      await expect(modal).not.toBeVisible({ timeout: 5000 })
    } finally {
      await context.close()
    }
  })

  // ── 测试 4: 点击 × 关闭按钮关闭 Modal ───────────────────────────────────────
  test('modal-close-button-works', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'ceo')
    const page = await context.newPage()

    try {
      await page.goto('/employees')
      await page.waitForLoadState('networkidle')

      await page.getByTestId('employee-create-btn').click()
      const modal = page.locator('.ant-modal-content')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // 点击 Modal 右上角关闭按钮
      await page.locator('.ant-modal-close').click()

      await expect(modal).not.toBeVisible({ timeout: 5000 })
    } finally {
      await context.close()
    }
  })
})
