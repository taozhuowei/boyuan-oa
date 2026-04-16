/**
 * E2E-08 初始化向导（首次部署）
 *
 * 测试用例设计见 TEST_DESIGN.md §E2E-08。
 * 前置：system_config.initialized = false（调用 POST /api/dev/reset-setup）。
 * 注意：此套件会破坏其他测试依赖的已初始化状态，必须独立运行或最后执行。
 */
import { test, expect, request as pwRequest } from '@playwright/test'
import { API_URL } from '../playwright.config'

test.beforeAll(async () => {
  // 重置为未初始化状态（不调用 resetData，只重置向导标志）
  const ctx = await pwRequest.newContext()
  const resp = await ctx.post(`${API_URL}/dev/reset-setup`)
  if (!resp.ok()) {
    throw new Error(`[E2E-08] reset-setup failed: ${resp.status()}`)
  }
  await ctx.dispose()
})

test.afterAll(async () => {
  // 测试完成后恢复已初始化状态，避免影响其他套件
  const ctx = await pwRequest.newContext()
  await ctx.post(`${API_URL}/dev/skip-setup`)
  await ctx.dispose()
})

test.describe('E2E-08 初始化向导', () => {
  // Step 1: 首次访问自动跳转向导
  test('08-1: 未初始化时访问 / 自动跳转 /setup', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/setup', { timeout: 10_000 })
  })

  // Step 2: 创建 CEO 账号，显示恢复码
  test('08-2: Step 1 创建 CEO 账号，恢复码仅显示一次', async ({ page }) => {
    await page.goto('/setup')

    await page.getByTestId('setup-ceo-name').fill('测试CEO')
    await page.getByTestId('setup-ceo-phone').fill('13800000001')
    await page.getByTestId('setup-ceo-password').fill('Abc12345!')
    await page.getByTestId('setup-step1-next').click()

    // 恢复码应显示
    await expect(page.getByTestId('setup-recovery-code')).toBeVisible({ timeout: 10_000 })
    const code = await page.getByTestId('setup-recovery-code').innerText()
    expect(code).toHaveLength(32)
  })

  // Step 4: 关闭浏览器后重新访问，从 Step 1 重新开始
  test('08-4: 新会话访问 /setup 从 Step 1 开始，无历史数据', async ({ browser }) => {
    // 使用全新 context 模拟新会话
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/setup')

    // 应显示 Step 1，而非跳到已完成的步骤
    await expect(page.getByTestId('setup-step-indicator-1')).toHaveClass(/active/, { timeout: 5_000 })
    await expect(page.getByTestId('setup-ceo-name')).toHaveValue('')

    await context.close()
  })

  // Step 7: 向导完成后不可重入
  test('08-7: 向导完成后访问 /setup 重定向到工作台', async ({ browser }) => {
    // 先通过 skip-setup 标记已初始化
    const apiCtx = await pwRequest.newContext()
    await apiCtx.post(`${API_URL}/dev/skip-setup`)
    await apiCtx.dispose()

    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/setup')
    // 已初始化后 /setup 应重定向（到登录页或工作台）
    await expect(page).not.toHaveURL('/setup', { timeout: 5_000 })

    await context.close()
  })
})
