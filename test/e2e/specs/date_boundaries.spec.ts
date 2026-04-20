/**
 * C-E2E-12 表单日期边界
 * 验证请假结束日早于开始日、加班结束时间早于开始时间时后端行为，
 * 以及 /attendance 页面在 employee 角色下无 500 错误。
 * 对应 test/e2e/TEST_DESIGN.md §E2E-12
 */
import { test, expect, request } from '@playwright/test'
import { loginAs, loginViaApi } from '../../tools/fixtures/auth'
import { API_URL } from '../playwright.config'

test.describe('C-E2E-12 表单日期边界', () => {
  // ── Test 12-1: 请假结束日早于开始日 ────────────────────────────────────────
  test('12-1: API — 请假结束日早于开始日，后端拒绝或接受（记录实际行为）', async () => {
    const { token } = await loginViaApi('employee')
    const api_ctx = await request.newContext()

    try {
      const resp = await api_ctx.post(`${API_URL}/attendance/leave`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          formType: 'LEAVE',
          formData: {
            leaveType: 'ANNUAL',
            startDate: '2026-06-10',
            endDate: '2026-06-01',
            reason: 'E2E日期边界测试',
          },
        },
      })

      const status_code = resp.status()

      // 5xx 是不可接受的 — 业务错误必须用 4xx 表达
      expect(status_code).toBeLessThan(500)
      expect(status_code).toBeGreaterThanOrEqual(200)

      if (status_code === 400) {
        const body_text = await resp.text()
        // 错误响应必须是业务语言，不得暴露框架内部错误
        expect(body_text).not.toContain('HTTP 400')
        expect(body_text).not.toContain('Bad Request')
      } else if (status_code === 200) {
        // 后端未校验日期顺序，由前端处理 — 此行为可接受
        console.info('后端未校验日期顺序，由前端处理')
      }
    } finally {
      await api_ctx.dispose()
    }
  })

  // ── Test 12-2: 加班结束时间早于开始时间 ────────────────────────────────────
  test('12-2: API — 加班结束时间早于开始时间，后端拒绝或接受（记录实际行为）', async () => {
    const { token } = await loginViaApi('employee')
    const api_ctx = await request.newContext()

    try {
      const resp = await api_ctx.post(`${API_URL}/attendance/overtime`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          formType: 'OVERTIME',
          formData: {
            overtimeType: 'WEEKDAY',
            startTime: '2026-06-10T18:00:00',
            endTime: '2026-06-10T17:00:00',
            reason: 'E2E加班时间边界测试',
          },
        },
      })

      const status_code = resp.status()

      // 5xx 是不可接受的 — 业务错误必须用 4xx 表达
      expect(status_code).toBeLessThan(500)
      expect(status_code).toBeGreaterThanOrEqual(200)

      if (status_code === 400) {
        const body_text = await resp.text()
        // 错误响应必须是业务语言，不得暴露框架内部错误
        expect(body_text).not.toContain('HTTP 400')
        expect(body_text).not.toContain('Bad Request')
      } else if (status_code === 200) {
        // 后端未校验时间顺序，由前端处理 — 此行为可接受
        console.info('后端未校验加班时间顺序，由前端处理')
      }
    } finally {
      await api_ctx.dispose()
    }
  })

  // ── Test 12-3: employee 打开 /attendance 无 500 错误 ───────────────────────
  test('12-3: UI — employee 打开 /attendance，页面无 500 错误', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'employee')

    const page = await context.newPage()
    try {
      await page.goto('/attendance')
      await page.waitForLoadState('networkidle')

      const body_text = await page.locator('body').textContent() ?? ''
      expect(body_text).not.toContain('500')
      expect(body_text).not.toContain('服务器内部错误')
    } finally {
      await context.close()
    }
  })
})
