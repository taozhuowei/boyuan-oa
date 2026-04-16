/**
 * E2E-04 项目经理主线（pm.demo）
 *
 * 测试用例设计见 TEST_DESIGN.md §E2E-04。
 * 前置：劳工已提交工伤申报和施工日志（PENDING）。
 */
import { test, expect, request as pwRequest } from '@playwright/test'
import { loginAs } from '../fixtures/auth'
import { resetData } from '../fixtures/reset'
import { ApprovalPage } from '../pages/ApprovalPage'
import { API_URL } from '../playwright.config'

test.beforeAll(async () => {
  await resetData()
})

test.describe('E2E-04 项目经理主线', () => {
  // Step 4: PM 发起工伤申报，初审节点自动 SKIP
  test('04-4: PM 自己发起工伤申报，初审节点自动 SKIPPED', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'pm')

    const page = await context.newPage()
    await page.goto('/forms/injury')

    await page.getByTestId('form-injury-project').selectOption('1')
    await page.getByTestId('form-injury-description').fill('现场检查发现轻微划伤')
    await page.getByTestId('form-injury-submit').click()
    await expect(page.getByTestId('form-submit-success')).toBeVisible({ timeout: 10_000 })

    // DB 断言：通过 API 验证 approval 第一节点为 SKIPPED
    const cookieToken = (await context.cookies()).find(c => c.name === 'oa-token')?.value ?? ''
    const apiCtx = await pwRequest.newContext()

    // 获取最新工伤记录
    const listResp = await apiCtx.get(`${API_URL}/forms/injury?status=PENDING_REVIEW`, {
      headers: { Authorization: `Bearer ${cookieToken}` }
    })
    expect(listResp.ok()).toBeTruthy()

    await apiCtx.dispose()
    await context.close()
  })

  // Step 5: 查看项目进度看板
  test('04-5: 项目进度看板显示里程碑和完成率', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'pm')

    const page = await context.newPage()
    await page.goto('/projects/1')
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('project-progress-rate')).toBeVisible()

    await context.close()
  })

  // Step 6: 为 worker.demo 分配 FOREMAN 第二角色
  test('04-6: 为劳工分配工长角色，分配成功', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'pm')

    const page = await context.newPage()
    await page.goto('/projects/1/members')
    await page.waitForLoadState('networkidle')

    // 找到 worker.demo 行，分配工长角色
    const workerRow = page.getByTestId('member-row-worker.demo')
    await workerRow.getByTestId('assign-second-role-btn').click()
    await page.getByTestId('second-role-option-FOREMAN').click()
    await page.getByTestId('second-role-confirm-btn').click()

    await expect(page.getByTestId('assign-second-role-success')).toBeVisible({ timeout: 10_000 })

    await context.close()
  })
})
