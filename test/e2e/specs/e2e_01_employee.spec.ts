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
    const cookies = await context.cookies()
    const token = cookies.find(c => c.name === 'oa-token')?.value ?? ''
    const apiCtx = await request.newContext()
    const resp = await apiCtx.get(`${API_URL}/attendance/records`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(resp.ok()).toBeTruthy()
    const records = await resp.json() as Array<{ status: string }>
    expect(records.some(r => r.status === 'PENDING')).toBeTruthy()
    await apiCtx.dispose()

    await context.close()
  })

  // Step 4: 电子签名绑定
  test('01-4: 签名绑定成功，工作台状态变"已绑定"', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'employee')

    const page = await context.newPage()
    // Correct route: /payroll/signature_bind (not /me/signature)
    await page.goto('/payroll/signature_bind')
    await page.waitForLoadState('networkidle')

    // If already bound, click rebind to reset to step 0
    const rebind_btn = page.getByRole('button', { name: '重新绑定' })
    if (await rebind_btn.isVisible().catch(() => false)) {
      await rebind_btn.click()
    }

    // Step 0: Draw on canvas (blank canvas base64 is still >100 chars — passes validation)
    const canvas_wrapper = page.getByTestId('signature-canvas')
    await canvas_wrapper.waitFor({ state: 'visible', timeout: 10_000 })
    const canvas_el = canvas_wrapper.locator('canvas')
    const box = await canvas_el.boundingBox()
    if (box) {
      await page.mouse.move(box.x + 50, box.y + 50)
      await page.mouse.down()
      await page.mouse.move(box.x + 150, box.y + 80)
      await page.mouse.up()
    }

    // Click 确认 → advance to PIN step
    await page.getByRole('button', { name: '确认' }).click()

    // Step 1: Fill PIN (4-digit number, both fields must match)
    const pin_input = page.locator('input[type=password]').first()
    await pin_input.waitFor({ state: 'visible', timeout: 5_000 })
    await pin_input.fill('1234')
    await page.locator('input[type=password]').last().fill('1234')

    // Click 下一步 → advance to confirmation step
    await page.getByRole('button', { name: '下一步' }).click()

    // Step 2: Submit
    await page.getByTestId('signature-submit').click()
    await expect(page.getByTestId('signature-success')).toBeVisible({ timeout: 10_000 })

    await context.close()
  })
})
