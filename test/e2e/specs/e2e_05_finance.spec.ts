/**
 * E2E-05 财务主线（finance.demo）
 *
 * 测试用例设计见 TEST_DESIGN.md §E2E-05。
 * 前置：薪资周期窗口期开放；员工数据完整。
 * 注意：步骤 6（重新结算）依赖 E2E-06 步骤 8（CEO 审批解锁），需跨 spec 协调。
 */
import { test, expect, request as pwRequest } from '@playwright/test'
import { loginAs, loginViaApi } from '../../tools/fixtures/auth'
import { resetData } from '../../tools/fixtures/reset'
import { API_URL } from '../playwright.config'

test.beforeAll(async () => {
  await resetData()

  const { token: finance_token } = await loginViaApi('finance')
  const { token: pm_token } = await loginViaApi('pm')
  const { token: ceo_token } = await loginViaApi('ceo')
  const ctx = await pwRequest.newContext()

  // Create a payroll cycle for settlement tests
  await ctx.post(`${API_URL}/payroll/cycles`, {
    headers: { Authorization: `Bearer ${finance_token}` },
    data: { period: '2026-04' }
  })

  // Create an approved injury record for 05-4 (finance injury claim amount test).
  // PM submits → node 1 (PM Review) auto-SKIPPED → CEO approves → APPROVED.
  const injury_resp = await ctx.post(`${API_URL}/logs/injury`, {
    headers: { Authorization: `Bearer ${pm_token}` },
    data: {
      formData: {
        injuryDate: '2026-04-01',
        injuryTime: '10:00',
        accidentDescription: 'E2E 05-4 test injury',
        medicalDiagnosis: 'Minor test injury',
        attachmentIds: []
      },
      remark: 'E2E 05-4 injury setup'
    }
  })
  const injury_body = await injury_resp.json() as { id: number }
  if (injury_body.id) {
    await ctx.post(`${API_URL}/forms/${injury_body.id}/approve`, {
      headers: { Authorization: `Bearer ${ceo_token}` },
      data: { comment: 'Auto-approved for E2E test' }
    })
  }

  await ctx.dispose()
})

test.describe('E2E-05 财务主线', () => {
  // Step 1: 查看薪资周期窗口期
  test('05-1: 当前周期窗口期状态显示正常', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'finance')

    const page = await context.newPage()
    await page.goto('/payroll')
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('payroll-cycle-status')).toBeVisible()

    await context.close()
  })

  // Step 3: 执行正式结算
  test('05-3: 执行结算，周期锁定，工资条批量生成', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'finance')

    const page = await context.newPage()
    await page.goto('/payroll')
    await page.waitForLoadState('networkidle')

    // Click "结算" button on the cycle row to pre-select the cycle and switch to settle tab
    const cycle_row = page.locator('tr').filter({ hasText: '2026-04' })
    await cycle_row.getByRole('button', { name: '结算' }).click()
    await page.waitForTimeout(500)

    // Precheck button should now be enabled (cycle pre-selected via preselectedCycleId)
    await page.getByTestId('payroll-settle-precheck-btn').click()
    // Wait for precheck to complete
    await page.waitForTimeout(3_000)

    // 正式结算
    await page.getByTestId('payroll-settle-run-btn').click()
    await page.waitForLoadState('networkidle', { timeout: 30_000 })

    // Settled — auto-returns to cycles tab; verify status shows
    await expect(page.getByTestId('payroll-cycle-status')).toBeVisible({ timeout: 10_000 })

    await context.close()
  })

  // Step 4: 录入工伤理赔金额
  test('05-4: 财务录入工伤补偿金额', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'finance')

    const page = await context.newPage()
    await page.goto('/injury')
    await page.waitForLoadState('networkidle')

    // Use the global "录入理赔" button (opens claim modal with approved injury list)
    const fill_btn = page.getByTestId('injury-fill-amount-btn').first()
    await fill_btn.waitFor({ state: 'visible', timeout: 10_000 })
    await fill_btn.click()

    // Fill amount and submit
    await page.getByTestId('injury-amount-input').fill('5000')
    await page.getByTestId('injury-amount-submit').click()
    await expect(page.getByTestId('injury-amount-success')).toBeVisible({ timeout: 10_000 })

    await context.close()
  })

  // Step 5: 发起薪资更正申请
  test('05-5: 发起薪资更正，状态变"待 CEO 审批"', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'finance')

    const page = await context.newPage()
    await page.goto('/payroll')
    await page.waitForLoadState('networkidle')

    // 切换到"更正记录"Tab，点击"发起更正"
    await page.getByRole('tab', { name: '更正记录' }).click()
    await page.waitForLoadState('networkidle')

    await page.getByTestId('payroll-correction-open-btn').click()
    // loadSlipsForCorrection auto-selects first slip if slips exist
    await page.waitForTimeout(1_000)

    await page.getByTestId('correction-reason-input').fill('数据录入错误，需更正基本工资')
    await page.getByTestId('correction-submit-btn').click()
    await expect(page.getByTestId('correction-pending-badge')).toBeVisible({ timeout: 10_000 })

    await context.close()
  })
})
