/**
 * C-E2E-01 请假审批完整流程
 * employee 提交请假 → dept_manager 审批通过 → employee 验证状态 APPROVED
 * 对应 test/e2e/TEST_DESIGN.md §E2E-09
 */
import { test, expect, request } from '@playwright/test'
import { loginAs, loginViaApi } from '../../tools/fixtures/auth'
import { resetData } from '../../tools/fixtures/reset'
import { API_URL } from '../playwright.config'

// Shared state across tests within this describe block
let submittedFormId: number | null = null

test.beforeAll(async () => {
  await resetData()
})

test.describe('C-E2E-01 请假审批完整流程', () => {
  // ── Test 1: employee 提交请假申请 ─────────────────────────────────────────
  test('01-1: employee 提交请假申请，状态变 PENDING', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'employee')

    const page = await context.newPage()

    // Navigate to attendance page and switch to leave tab
    await page.goto('/attendance')
    await page.waitForLoadState('networkidle')

    const leave_tab = page.getByTestId('attendance-tab-leave')
    if (await leave_tab.isVisible()) {
      await leave_tab.click()
    }

    // Select leave type (first available option in the dropdown)
    await page.getByTestId('form-leave-type').click()
    // Wait for dropdown options and select the first one
    const first_option = page.locator('.ant-select-item-option').first()
    await first_option.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
    if (await first_option.isVisible()) {
      await first_option.click()
    }

    // antd DatePicker inputs are readonly — must click first then pressSequentially
    const start_date_input = page.getByTestId('form-leave-start-date').locator('input').first()
    await start_date_input.click()
    await start_date_input.pressSequentially('2026-06-01', { delay: 50 })
    await start_date_input.press('Enter')

    const end_date_input = page.getByTestId('form-leave-end-date').locator('input').first()
    await end_date_input.click()
    await end_date_input.pressSequentially('2026-06-02', { delay: 50 })
    await end_date_input.press('Enter')

    // Fill reason via data-catch="form-leave-reason"
    await page.getByTestId('form-leave-reason').fill('E2E测试请假申请')

    // Submit
    await page.getByTestId('leave-form-submit').click()

    // Expect success feedback (form-submit-success toast, or redirect to records tab)
    await expect(
      page.getByTestId('form-submit-success').or(page.getByTestId('attendance-records-table'))
    ).toBeVisible({ timeout: 10_000 })

    // API assertion: find the newly created PENDING record and store its id
    const { token } = await loginViaApi('employee')
    const api_ctx = await request.newContext()
    const resp = await api_ctx.get(`${API_URL}/attendance/records`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(resp.ok()).toBeTruthy()
    const records = await resp.json() as Array<{ id: number; status: string; formData?: Record<string, unknown> }>
    const pending = records.find(r => r.status === 'PENDING')
    expect(pending).toBeDefined()
    submittedFormId = pending!.id
    await api_ctx.dispose()

    await context.close()
  })

  // ── Test 2: dept_manager 审批通过 ─────────────────────────────────────────
  test('01-2: dept_manager 审批通过，操作成功', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'dept_manager')

    const page = await context.newPage()
    await page.goto('/todo')
    await page.waitForLoadState('networkidle')

    // There must be at least one pending item
    const todo_item = page.getByTestId('todo-item').first()
    await expect(todo_item).toBeVisible({ timeout: 10_000 })

    // Click the detail button to open the approval modal
    const detail_btn = todo_item.getByRole('button', { name: '查看审批' })
    await detail_btn.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {
      // Fallback: click the row itself if detail btn not separately locatable
    })
    if (await detail_btn.isVisible()) {
      await detail_btn.click()
    } else {
      await todo_item.click()
    }

    // Wait for approval modal to open and fill comment
    const comment_input = page.getByTestId('approval-comment')
    await comment_input.waitFor({ state: 'visible', timeout: 10_000 })
    await comment_input.fill('同意')

    // Click approve button
    await page.getByTestId('approval-approve-btn').click()

    // Expect success feedback: approval-result alert appears after modal closes
    await expect(page.getByTestId('approval-result')).toBeVisible({ timeout: 10_000 })
    const result_text = await page.getByTestId('approval-result').textContent()
    expect(result_text).toMatch(/审批通过|通过/)

    await context.close()
  })

  // ── Test 3: employee 验证最终状态 APPROVED ────────────────────────────────
  test('01-3: employee 验证记录状态变为 APPROVED', async ({ browser }) => {
    // Skip DOM assertion gracefully if form id was not captured
    expect(submittedFormId).not.toBeNull()

    // LEAVE flow has two nodes: dept_manager (node 1) + CEO (node 2).
    // After test 01-2, status is APPROVING. CEO must approve to reach APPROVED.
    const { token: ceo_token } = await loginViaApi('ceo')
    const api_ctx = await request.newContext()
    const ceo_approve = await api_ctx.post(`${API_URL}/forms/${submittedFormId}/approve`, {
      headers: { Authorization: `Bearer ${ceo_token}` },
      data: { comment: '同意' }
    })
    expect(ceo_approve.ok()).toBeTruthy()

    // API assertion: record status must be APPROVED
    const { token } = await loginViaApi('employee')
    const resp = await api_ctx.get(`${API_URL}/attendance/records`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(resp.ok()).toBeTruthy()
    const records = await resp.json() as Array<{ id: number; status: string }>
    const target = records.find(r => r.id === submittedFormId)
    expect(target).toBeDefined()
    expect(target!.status).toBe('APPROVED')
    await api_ctx.dispose()

    // DOM assertion: navigate to attendance records tab and verify status text
    const context = await browser.newContext()
    await loginAs(context, 'employee')

    const page = await context.newPage()
    await page.goto('/attendance')
    await page.waitForLoadState('networkidle')

    // Wait for records table to load
    const table = page.getByTestId('attendance-records-table')
    await table.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})

    // Find a row whose status tag text contains "已通过" or "APPROVED"
    const approved_row = page.getByTestId('attendance-records-table')
      .locator('tr')
      .filter({ hasText: /已通过|APPROVED/ })
    await expect(approved_row.first()).toBeVisible({ timeout: 10_000 })

    await context.close()
  })
})
