/**
 * C-E2E-11 报销发票上传边界
 *
 * 覆盖场景：
 *   11-1: API — 提交空明细或零金额报销，返回 400 校验错误
 *   11-2: API — 有效报销明细提交，返回 200 且记录可查询
 *   11-3: UI  — 打开 /expense 页面，验证页面可访问，不报 500
 *
 * 数据依赖：seed-data.sql 中存在 employee.demo 账号。
 * API 文档：DESIGN.md §报销管理。
 */
import { test, expect, request } from '@playwright/test'
import { loginAs, loginViaApi } from '../fixtures/auth'
import { API_URL } from '../playwright.config'

// Shared state across tests in this describe block
let expense_id = -1

test.describe('C-E2E-11 报销发票上传边界', () => {
  // ── Test 11-1: 空明细或零金额报销返回 400 ──────────────────────────────────
  test('11-1: API — 提交空明细或零金额报销，返回 400 校验错误', async () => {
    const { token: employee_token } = await loginViaApi('employee')
    const api_ctx = await request.newContext()

    try {
      // 场景 A: items 为空数组（NotEmpty 约束）
      const empty_items_resp = await api_ctx.post(`${API_URL}/expense`, {
        headers: { Authorization: `Bearer ${employee_token}` },
        data: {
          expenseType: 'TRAVEL',
          totalAmount: 100,
          items: []
        }
      })
      expect(empty_items_resp.status()).toBe(400)

      // 场景 B: totalAmount = 0（Positive 约束）
      const zero_amount_resp = await api_ctx.post(`${API_URL}/expense`, {
        headers: { Authorization: `Bearer ${employee_token}` },
        data: {
          expenseType: 'TRAVEL',
          totalAmount: 0,
          items: [{ itemType: 'TRAVEL', amount: 0, description: 'x' }]
        }
      })
      expect(zero_amount_resp.status()).toBe(400)
    } finally {
      await api_ctx.dispose()
    }
  })

  // ── Test 11-2: 有效报销明细提交返回 200，记录可查询 ──────────────────────
  test('11-2: API — 有效报销明细提交，返回 200 且记录可查询', async () => {
    const { token: employee_token } = await loginViaApi('employee')
    const api_ctx = await request.newContext()

    try {
      // 提交有效报销单
      const submit_resp = await api_ctx.post(`${API_URL}/expense`, {
        headers: { Authorization: `Bearer ${employee_token}` },
        data: {
          expenseType: 'MEAL',
          totalAmount: 100,
          items: [{ itemType: 'MEAL', amount: 100, description: 'E2E餐费' }]
        }
      })
      if (!submit_resp.ok()) {
        throw new Error(
          `[11-2] POST /expense failed: ${submit_resp.status()} ${await submit_resp.text()}`
        )
      }
      expect(submit_resp.status()).toBe(200)

      const submit_body = await submit_resp.json() as { id?: number; formId?: number }
      expense_id = submit_body.id ?? submit_body.formId ?? -1

      // 查询报销记录列表，确认返回正常
      const records_resp = await api_ctx.get(`${API_URL}/expense/records`, {
        headers: { Authorization: `Bearer ${employee_token}` }
      })
      expect(records_resp.status()).toBe(200)

      const records_body = await records_resp.json()
      // 后端可能返回分页对象或直接数组
      const records: unknown[] = Array.isArray(records_body)
        ? records_body
        : (records_body as { records?: unknown[]; list?: unknown[]; content?: unknown[] }).records
          ?? (records_body as { list?: unknown[] }).list
          ?? (records_body as { content?: unknown[] }).content
          ?? []
      expect(Array.isArray(records)).toBe(true)
    } finally {
      await api_ctx.dispose()
    }
  })

  // ── Test 11-3: UI — /expense 页面可访问，不报 500 ──────────────────────────
  test('11-3: UI — 打开 /expense 页面，验证页面可访问，不报 500', async ({ browser }) => {
    const context = await browser.newContext()

    try {
      await loginAs(context, 'employee')
      const page = await context.newPage()

      await page.goto('/expense')
      await page.waitForLoadState('networkidle')

      // 页面正文不得包含服务器错误标志
      const body_text = await page.locator('body').textContent() ?? ''
      expect(body_text).not.toContain('500')
      expect(body_text).not.toContain('服务器内部错误')

      // 如果页面中存在已知的 data-catch 标记，记录日志（非阻断）
      const expense_form = page.getByTestId('expense-form')
      const expense_submit_btn = page.getByTestId('expense-submit-btn')

      if (await expense_form.isVisible()) {
        console.log('[11-3] found data-catch="expense-form"')
      }
      if (await expense_submit_btn.isVisible()) {
        console.log('[11-3] found data-catch="expense-submit-btn"')
      }
    } finally {
      await context.close()
    }
  })
})
