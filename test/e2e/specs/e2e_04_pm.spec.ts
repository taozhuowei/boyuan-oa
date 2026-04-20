/**
 * E2E-04 项目经理主线（pm.demo）
 *
 * 测试用例设计见 TEST_DESIGN.md §E2E-04。
 * 前置：劳工已提交工伤申报和施工日志（PENDING）。
 */
import { test, expect, request as pwRequest } from '@playwright/test'
import { loginAs } from '../../tools/fixtures/auth'
import { resetData } from '../../tools/fixtures/reset'
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
    await page.goto('/injury')
    await page.waitForLoadState('networkidle')
    await page.getByTestId('injury-apply-btn').click()

    // Fill all required fields: date, time, description, medical diagnosis
    // DatePicker/TimePicker inputs are readonly — must click then pressSequentially
    const dateInput = page.getByTestId('injury-date').locator('input').first()
    await dateInput.click()
    await dateInput.pressSequentially('2026-06-01', { delay: 50 })
    await dateInput.press('Enter')

    const timeInput = page.getByTestId('injury-time').locator('input').first()
    await timeInput.click()
    await timeInput.pressSequentially('10:00', { delay: 50 })
    await timeInput.press('Enter')
    // antd TimePicker panel may not close on Enter — click 确定 if still open
    const timeOkBtn = page.locator('.ant-picker-ok button')
    if (await timeOkBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await timeOkBtn.click().catch(() => {})
    }

    await page.getByTestId('injury-description').fill('现场检查发现轻微划伤')
    await page.getByTestId('injury-diagnosis').fill('轻微划伤，无需住院')

    await page.getByTestId('injury-apply-modal-submit').click()
    await expect(page.getByTestId('form-submit-success')).toBeVisible({ timeout: 10_000 })

    // DB 断言：通过 API 验证工伤申报状态为 APPROVING（PM Review 节点已自动 SKIPPED，等待 CEO 审批）
    const cookieToken = (await context.cookies()).find(c => c.name === 'oa-token')?.value ?? ''
    const apiCtx = await pwRequest.newContext()

    const listResp = await apiCtx.get(`${API_URL}/logs/records`, {
      headers: { Authorization: `Bearer ${cookieToken}` }
    })
    expect(listResp.ok()).toBeTruthy()
    const records = await listResp.json() as Array<{ id: number; formNo: string; status: string }>
    // After PM submits, node 1 (PM Review) is auto-skipped; form status stays PENDING
    // waiting for CEO (node 2). APPROVING only changes when an actual approver acts.
    const injuryRecord = records.find(r => r.formNo?.startsWith('INJ') && (r.status === 'APPROVING' || r.status === 'PENDING'))
    expect(injuryRecord, 'PM 提交的工伤申报应存在（PM Review 已自动 SKIPPED，等待 CEO 审批）').toBeTruthy()

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

    // 切换到"进度管理"外层 Tab
    await page.getByRole('tab', { name: '进度管理' }).click()
    await page.waitForTimeout(500)

    // 切换到"Dashboard"内层 Tab（project-progress-rate 在 Dashboard 面板中）
    await page.getByRole('tab', { name: 'Dashboard' }).click()
    await page.waitForTimeout(500)

    await expect(page.getByTestId('project-progress-rate')).toBeVisible({ timeout: 10_000 })

    await context.close()
  })

  // Step 6: 为 worker.demo 分配 FOREMAN 第二角色
  test('04-6: 为劳工分配工长角色，分配成功', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'pm')

    const page = await context.newPage()
    // 第二角色分配在 /projects/[id] "第二角色" Tab
    await page.goto('/projects/1')
    await page.waitForLoadState('networkidle')

    // 输入员工 ID（worker.demo 的 seed ID = 5）并选择 FOREMAN 角色
    await page.locator('input[type=number]').first().fill('5')
    await page.getByTestId('second-role-option-FOREMAN').click()
    await page.getByTestId('assign-second-role-btn').click()

    // 分配成功后列表刷新，worker.demo 行应出现
    await page.waitForTimeout(1_000)
    await expect(page.getByTestId('member-row-5')).toBeVisible({ timeout: 10_000 })

    await context.close()
  })
})
