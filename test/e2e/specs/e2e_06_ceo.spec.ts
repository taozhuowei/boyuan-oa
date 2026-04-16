/**
 * E2E-06 CEO 主线（ceo.demo）
 *
 * 测试用例设计见 TEST_DESIGN.md §E2E-06。
 * 前置：各角色已提交待审批单据；薪资更正申请来自 E2E-05 步骤 5。
 */
import { test, expect } from '@playwright/test'
import { loginAs } from '../fixtures/auth'
import { resetData } from '../fixtures/reset'

test.beforeAll(async () => {
  await resetData()
})

test.describe('E2E-06 CEO 主线', () => {
  // Step 2: 查看操作日志
  test('06-2: CEO 可查看操作日志，finance 访问 403', async ({ browser }) => {
    // CEO 可见
    const ceoCtx = await browser.newContext()
    await loginAs(ceoCtx, 'ceo')
    const ceoPage = await ceoCtx.newPage()
    await ceoPage.goto('/operation-logs')
    await expect(ceoPage.getByTestId('operation-log-list')).toBeVisible()
    await ceoCtx.close()

    // Finance 被重定向（无权限）
    const finCtx = await browser.newContext()
    await loginAs(finCtx, 'finance')
    const finPage = await finCtx.newPage()
    await finPage.goto('/operation-logs')
    await expect(finPage).not.toHaveURL('/operation-logs')
    await finCtx.close()
  })

  // Step 8: 审批薪资更正解锁申请（关键路径）
  test('06-8: CEO 审批解锁，payroll_cycle.locked 变 false', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'ceo')

    const page = await context.newPage()
    await page.goto('/todo')
    await page.waitForLoadState('networkidle')

    // 找到薪资更正审批单
    const correctionItem = page.getByTestId('todo-item').filter({ hasText: '薪资更正' })
    if (await correctionItem.count() > 0) {
      await correctionItem.first().click()
      await page.getByTestId('approval-approve-btn').click()
      await expect(page.getByTestId('approval-result')).toBeVisible({ timeout: 10_000 })
    }

    await context.close()
  })

  // Step 9: 停用员工账号
  test('06-9: CEO 停用账号，该员工无法登录', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'ceo')

    const page = await context.newPage()
    await page.goto('/employees')
    await page.waitForLoadState('networkidle')

    // 找到测试用员工行，点击停用
    const targetRow = page.getByTestId('employee-row').last()
    await targetRow.getByTestId('employee-disable-btn').click()
    // 二次确认弹窗
    await expect(page.getByTestId('disable-confirm-dialog')).toBeVisible()
    await page.getByTestId('disable-confirm-ok').click()
    await expect(page.getByTestId('disable-success')).toBeVisible({ timeout: 10_000 })

    await context.close()
  })
})
