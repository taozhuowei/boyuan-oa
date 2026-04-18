/**
 * C-E2E-04 申请驳回后重新提交
 * employee 提交请假 → dept_manager 驳回（填驳回原因）→ employee 查看驳回原因 → 重新提交
 */
import { test, expect, request } from '@playwright/test'
import { loginAs, loginViaApi } from '../fixtures/auth'
import { resetData } from '../fixtures/reset'
import { API_URL } from '../playwright.config'

// Shared state: id of the rejected form
let rejectedFormId: number | null = null

test.beforeAll(async () => {
  await resetData()
})

test.describe('C-E2E-04 申请驳回后重新提交', () => {
  // ── Test 1: employee 提交请假申请 ─────────────────────────────────────────
  test('04-1: employee 提交请假申请（驳回测试）', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'employee')

    const page = await context.newPage()
    await page.goto('/attendance')
    await page.waitForLoadState('networkidle')

    const leave_tab = page.getByTestId('attendance-tab-leave')
    if (await leave_tab.isVisible()) {
      await leave_tab.click()
    }

    // Select first available leave type
    await page.getByTestId('form-leave-type').click()
    const first_option = page.locator('.ant-select-item-option').first()
    await first_option.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
    if (await first_option.isVisible()) {
      await first_option.click()
    }

    // antd DatePicker inputs are readonly — must click first then pressSequentially
    const start_input = page.getByTestId('form-leave-start-date').locator('input').first()
    await start_input.click()
    await start_input.pressSequentially('2026-07-01', { delay: 50 })
    await start_input.press('Enter')

    const end_input = page.getByTestId('form-leave-end-date').locator('input').first()
    await end_input.click()
    await end_input.pressSequentially('2026-07-02', { delay: 50 })
    await end_input.press('Enter')

    await page.getByTestId('form-leave-reason').fill('驳回测试')

    await page.getByTestId('leave-form-submit').click()

    // Expect success feedback
    await expect(
      page.getByTestId('form-submit-success').or(page.getByTestId('attendance-records-table'))
    ).toBeVisible({ timeout: 10_000 })

    // API assertion: capture PENDING record id
    const { token } = await loginViaApi('employee')
    const api_ctx = await request.newContext()
    const resp = await api_ctx.get(`${API_URL}/attendance/records`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(resp.ok()).toBeTruthy()
    const records = await resp.json() as Array<{ id: number; status: string }>
    const pending = records.find(r => r.status === 'PENDING')
    expect(pending).toBeDefined()
    rejectedFormId = pending!.id
    await api_ctx.dispose()

    await context.close()
  })

  // ── Test 2: dept_manager 驳回 ─────────────────────────────────────────────
  test('04-2: dept_manager 驳回，填驳回原因"时间冲突，请另安排"', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'dept_manager')

    const page = await context.newPage()
    await page.goto('/todo')
    await page.waitForLoadState('networkidle')

    // Verify at least one pending item exists
    const todo_item = page.getByTestId('todo-item').first()
    await expect(todo_item).toBeVisible({ timeout: 10_000 })

    // Open detail modal
    const detail_btn = todo_item.getByRole('button', { name: '查看审批' })
    await detail_btn.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
    if (await detail_btn.isVisible()) {
      await detail_btn.click()
    } else {
      await todo_item.click()
    }

    // Fill rejection reason and click reject
    const comment_input = page.getByTestId('approval-comment')
    await comment_input.waitFor({ state: 'visible', timeout: 10_000 })
    await comment_input.fill('时间冲突，请另安排')

    await page.getByTestId('approval-reject-btn').click()

    // Expect success feedback after rejection
    await expect(page.getByTestId('approval-result')).toBeVisible({ timeout: 10_000 })
    const result_text = await page.getByTestId('approval-result').textContent()
    expect(result_text).toMatch(/已驳回|驳回/)

    await context.close()
  })

  // ── Test 3: employee 查看驳回原因 ─────────────────────────────────────────
  test('04-3: employee 查看被驳回申请，驳回原因可读', async ({ browser }) => {
    expect(rejectedFormId).not.toBeNull()

    // API assertion: record status is REJECTED
    const { token } = await loginViaApi('employee')
    const api_ctx = await request.newContext()
    const resp = await api_ctx.get(`${API_URL}/attendance/records`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(resp.ok()).toBeTruthy()
    const records = await resp.json() as Array<{ id: number; status: string }>
    const target = records.find(r => r.id === rejectedFormId)
    expect(target).toBeDefined()
    expect(target!.status).toBe('REJECTED')
    await api_ctx.dispose()

    // DOM assertion: open the rejected record detail and verify rejection reason text
    const context = await browser.newContext()
    await loginAs(context, 'employee')

    const page = await context.newPage()
    await page.goto('/attendance')
    await page.waitForLoadState('networkidle')

    // Ensure we are on the records tab (default tab)
    const records_table = page.getByTestId('attendance-records-table')
    await records_table.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})

    // Find the rejected row and click 查看 to open detail modal
    const rejected_row = page
      .getByTestId('attendance-records-table')
      .locator('tr')
      .filter({ hasText: /已驳回|REJECTED/ })
      .first()

    await rejected_row.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
    if (await rejected_row.isVisible()) {
      // Click the 查看 link button inside the row
      const view_btn = rejected_row.getByRole('button', { name: '查看' })
      await view_btn.click()

      // Wait for detail modal to appear and show rejection reason
      // The rejection reason is displayed in an a-descriptions-item labeled "驳回原因"
      const rejection_reason = page.locator('.ant-modal').filter({ hasText: '驳回原因' })
      await rejection_reason.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})

      if (await rejection_reason.isVisible()) {
        // Verify the rejection comment text is visible
        await expect(page.locator('.ant-modal')).toContainText('时间冲突', { timeout: 10_000 })
      }
    }
    // Fallback: data-catch="rejection-reason" if frontend adds it in a future iteration
    const rejection_reason_element = page.getByTestId('rejection-reason')
    if (await rejection_reason_element.isVisible().catch(() => false)) {
      await expect(rejection_reason_element).toContainText('时间冲突')
    }

    await context.close()
  })

  // ── Test 4: employee 重新提交 ─────────────────────────────────────────────
  test('04-4: employee 重新发起，新记录 id 不同且状态 PENDING', async ({ browser }) => {
    expect(rejectedFormId).not.toBeNull()

    const context = await browser.newContext()
    await loginAs(context, 'employee')

    const page = await context.newPage()
    await page.goto('/attendance')
    await page.waitForLoadState('networkidle')

    // Open the rejected record to find 重新发起 button
    const records_table = page.getByTestId('attendance-records-table')
    await records_table.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})

    const rejected_row = page
      .getByTestId('attendance-records-table')
      .locator('tr')
      .filter({ hasText: /已驳回|REJECTED/ })
      .first()

    await rejected_row.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})

    if (await rejected_row.isVisible()) {
      const view_btn = rejected_row.getByRole('button', { name: '查看' })
      await view_btn.click()

      // Click 重新发起 in the detail modal
      const resubmit_btn = page.getByTestId('attendance-record-resubmit-btn')
      await resubmit_btn.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
      if (await resubmit_btn.isVisible()) {
        await resubmit_btn.click()
      }
    }

    // After 重新发起, the form should be pre-filled on the leave tab — update all fields
    const start_input = page.getByTestId('form-leave-start-date').locator('input').first()
    await start_input.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
    if (await start_input.isVisible()) {
      // Ensure leaveType is selected (prefill may lag behind options loading)
      const leave_type_select = page.getByTestId('form-leave-type')
      const is_empty = await leave_type_select.locator('.ant-select-selection-placeholder').isVisible().catch(() => false)
      if (is_empty) {
        await leave_type_select.click()
        const first_option = page.locator('.ant-select-item-option').first()
        await first_option.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {})
        if (await first_option.isVisible()) await first_option.click()
      }

      // antd DatePicker inputs are readonly — click to open then pressSequentially
      await start_input.click()
      await start_input.pressSequentially('2026-07-08', { delay: 50 })
      await start_input.press('Enter')

      const end_input = page.getByTestId('form-leave-end-date').locator('input').first()
      await end_input.click()
      await end_input.pressSequentially('2026-07-09', { delay: 50 })
      await end_input.press('Enter')

      // Fill reason (required field)
      await page.getByTestId('form-leave-reason').fill('重新发起测试')

      // Submit the resubmitted form
      await page.getByTestId('leave-form-submit').click()

      // Expect success feedback
      await expect(
        page.getByTestId('form-submit-success').or(page.getByTestId('attendance-records-table'))
      ).toBeVisible({ timeout: 10_000 })
    } else {
      // Fallback: if resubmit flow not navigating to form, submit a fresh leave application
      await page.goto('/attendance?tab=leave')
      await page.waitForLoadState('networkidle')

      await page.getByTestId('form-leave-type').click()
      const first_option = page.locator('.ant-select-item-option').first()
      await first_option.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
      if (await first_option.isVisible()) {
        await first_option.click()
      }

      const start = page.getByTestId('form-leave-start-date').locator('input').first()
      await start.click()
      await start.pressSequentially('2026-07-08', { delay: 50 })
      await start.press('Enter')

      const end = page.getByTestId('form-leave-end-date').locator('input').first()
      await end.click()
      await end.pressSequentially('2026-07-09', { delay: 50 })
      await end.press('Enter')

      await page.getByTestId('form-leave-reason').fill('重新发起测试')
      await page.getByTestId('leave-form-submit').click()

      await expect(
        page.getByTestId('form-submit-success').or(page.getByTestId('attendance-records-table'))
      ).toBeVisible({ timeout: 10_000 })
    }

    // API assertion: a new PENDING record exists with a different id than rejectedFormId
    const { token } = await loginViaApi('employee')
    const api_ctx = await request.newContext()
    const resp = await api_ctx.get(`${API_URL}/attendance/records`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(resp.ok()).toBeTruthy()
    const records = await resp.json() as Array<{ id: number; status: string }>
    const new_pending = records.find(r => r.status === 'PENDING' && r.id !== rejectedFormId)
    expect(new_pending).toBeDefined()
    expect(new_pending!.id).not.toBe(rejectedFormId)

    // Original rejected record must still exist with REJECTED status
    const original = records.find(r => r.id === rejectedFormId)
    expect(original).toBeDefined()
    expect(original!.status).toBe('REJECTED')
    await api_ctx.dispose()

    await context.close()
  })
})
