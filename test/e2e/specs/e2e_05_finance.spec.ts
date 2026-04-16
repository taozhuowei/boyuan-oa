/**
 * E2E-05 财务主线（finance.demo）
 *
 * 测试用例设计见 TEST_DESIGN.md §E2E-05。
 * 前置：薪资周期窗口期开放；员工数据完整。
 * 注意：步骤 6（重新结算）依赖 E2E-06 步骤 8（CEO 审批解锁），需跨 spec 协调。
 */
import { test, expect } from '@playwright/test'
import { loginAs } from '../fixtures/auth'
import { resetData } from '../fixtures/reset'

test.beforeAll(async () => {
  await resetData()
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

    // 切换到"结算操作"Tab
    await page.getByRole('tab', { name: '结算操作' }).click()

    // 先执行预结算检查
    await page.getByTestId('payroll-settle-precheck-btn').click()
    // 等待检查通过（最多 10s）
    await page.waitForTimeout(3_000)

    // 正式结算
    await page.getByTestId('payroll-settle-run-btn').click()
    await page.waitForLoadState('networkidle', { timeout: 30_000 })

    // 返回"周期管理"Tab 确认状态已变 SETTLED
    await page.getByRole('tab', { name: '周期管理' }).click()
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

    // 找到已归档工伤记录，录入金额
    const firstArchived = page.getByTestId('injury-row-archived').first()
    await firstArchived.getByTestId('injury-fill-amount-btn').click()
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
    // 切换到"更正记录"Tab，点击"发起更正"
    await page.getByRole('tab', { name: '更正记录' }).click()
    await page.getByTestId('payroll-correction-open-btn').click()
    await page.getByTestId('correction-reason-input').fill('数据录入错误，需更正基本工资')
    await page.getByTestId('correction-submit-btn').click()
    await expect(page.getByTestId('correction-pending-badge')).toBeVisible({ timeout: 10_000 })

    await context.close()
  })
})
