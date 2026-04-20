/**
 * C-E2E-13 数字计算与零值校验
 * 验证报销单明细金额求和与 totalAmount 一致时提交成功，
 * 以及 totalAmount 为零值或负数时后端返回 400。
 * 对应 test/e2e/TEST_DESIGN.md §E2E-13
 */
import { test, expect, request } from '@playwright/test'
import { loginViaApi } from '../../tools/fixtures/auth'
import { API_URL } from '../playwright.config'

test.describe('C-E2E-13 数字计算与零值校验', () => {
  // ── Test 13-1: 三行明细金额之和与 totalAmount 一致 ─────────────────────────
  test('13-1: API — 三行明细金额之和与 totalAmount 一致，提交成功返回 200', async () => {
    const { token } = await loginViaApi('employee')
    const api_ctx = await request.newContext()

    try {
      const resp = await api_ctx.post(`${API_URL}/expense`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          expenseType: 'TRAVEL',
          totalAmount: 600,
          items: [
            { itemType: 'TRAVEL', amount: 100, description: '明细A' },
            { itemType: 'MEAL', amount: 200, description: '明细B' },
            { itemType: 'ACCOMMODATION', amount: 300, description: '明细C' },
          ],
        },
      })

      expect(resp.status()).toBe(200)

      // 若响应体包含 totalAmount，验证其值正确
      const body_text = await resp.text()
      if (body_text && body_text.trim().startsWith('{')) {
        const expense_body = JSON.parse(body_text) as Record<string, unknown>
        if (typeof expense_body.totalAmount === 'number') {
          expect(expense_body.totalAmount).toBe(600)
        }
      }
    } finally {
      await api_ctx.dispose()
    }
  })

  // ── Test 13-2: totalAmount=0 提交，返回 400 ────────────────────────────────
  test('13-2: API — totalAmount=0 提交，返回 400 且非 5xx', async () => {
    const { token } = await loginViaApi('employee')
    const api_ctx = await request.newContext()

    try {
      const resp = await api_ctx.post(`${API_URL}/expense`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          expenseType: 'TRAVEL',
          totalAmount: 0,
          items: [{ itemType: 'TRAVEL', amount: 0, description: '零值测试' }],
        },
      })

      const status_code = resp.status()
      // @Positive 约束：totalAmount=0 必须触发 400
      expect(status_code).toBe(400)
      // 确保不是 5xx
      expect(status_code).toBeLessThan(500)
    } finally {
      await api_ctx.dispose()
    }
  })

  // ── Test 13-3: totalAmount 为负数，返回 400 ────────────────────────────────
  test('13-3: API — totalAmount 为负数，返回 400 且非 5xx', async () => {
    const { token } = await loginViaApi('employee')
    const api_ctx = await request.newContext()

    try {
      const resp = await api_ctx.post(`${API_URL}/expense`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          expenseType: 'TRAVEL',
          totalAmount: -100,
          items: [{ itemType: 'TRAVEL', amount: -100, description: '负数测试' }],
        },
      })

      const status_code = resp.status()
      // @Positive 约束：负数必须触发 400
      expect(status_code).toBe(400)
      // 确保不是 5xx
      expect(status_code).toBeLessThan(500)
    } finally {
      await api_ctx.dispose()
    }
  })
})
