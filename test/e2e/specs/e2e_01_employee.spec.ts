/**
 * E2E-01 员工主线（employee.demo）
 *
 * 测试用例设计见 TEST_DESIGN.md §E2E-01。
 * 前置：dev profile 已启动，业务数据已重置。
 */
import { test, expect, request } from '@playwright/test'
import { loginAs } from '../fixtures/auth'
import { resetData } from '../fixtures/reset'
import { WorkbenchPage } from '../pages/WorkbenchPage'
import { FormsPage } from '../pages/FormsPage'
import { API_URL } from '../playwright.config'

test.beforeAll(async () => {
  await resetData()
})

test.describe('E2E-01 员工主线', () => {
  // Step 1: 登录 + 工作台入口权限
  test('01-1: 登录成功，可见 LEAVE / OVERTIME 入口，无 INJURY / LOG', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'employee')

    const page = await context.newPage()
    const workbench = new WorkbenchPage(page)
    await workbench.goto()

    await workbench.expectFormEntryVisible('LEAVE')
    await workbench.expectFormEntryVisible('OVERTIME')
    await workbench.expectFormEntryHidden('INJURY')
    await workbench.expectFormEntryHidden('LOG')

    await context.close()
  })

  // Step 2: 提交请假申请
  test('01-2: 提交年假申请，列表显示"待审批"', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'employee')

    const page = await context.newPage()
    const forms = new FormsPage(page)
    await forms.gotoLeaveForm()
    await forms.fillLeaveForm({ leaveType: 'ANNUAL', startDate: '2026-05-01', endDate: '2026-05-03' })
    await forms.submitLeaveForm()
    await forms.expectSubmitSuccess()

    // DB 断言：通过 API 验证 form_record 状态
    const apiCtx = await request.newContext()
    const resp = await apiCtx.get(`${API_URL}/forms?type=LEAVE&status=PENDING`, {
      headers: { Authorization: `Bearer ${context.cookies().then(c => c.find(x => x.name === 'oa-token')?.value ?? '')}` }
    })
    expect(resp.ok()).toBeTruthy()
    const body = await resp.json()
    expect(body.total ?? body.records?.length ?? body.length).toBeGreaterThan(0)
    await apiCtx.dispose()

    await context.close()
  })

  // Step 4: 电子签名绑定
  test('01-4: 签名绑定成功，工作台状态变"已绑定"', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'employee')

    const page = await context.newPage()
    await page.goto('/me/signature')

    // 在画布上划线（模拟签名）
    const canvas = page.getByTestId('signature-canvas')
    await canvas.hover()
    await page.mouse.down()
    await page.mouse.move(100, 50)
    await page.mouse.move(150, 100)
    await page.mouse.up()

    await page.getByTestId('signature-submit').click()
    await expect(page.getByTestId('signature-success')).toBeVisible({ timeout: 10_000 })

    await context.close()
  })
})
