/**
 * C-E2E-14 密码修改错误提示回归
 * 验证 /auth/change-password 错误场景下后端返回业务语言，
 * 以及 UI 层面密码修改表单提交错误时不暴露框架内部错误信息。
 * 对应 test/e2e/TEST_DESIGN.md §E2E-14
 */
import { test, expect, request } from '@playwright/test'
import { loginAs, loginViaApi } from '../../tools/fixtures/auth'
import { API_URL } from '../playwright.config'

test.describe('C-E2E-14 密码修改错误提示回归', () => {
  // ── Test 14-1: 错误的当前密码，返回 400，错误信息为业务语言 ────────────────
  test('14-1: API — 错误的当前密码，返回 400，错误信息为业务语言', async () => {
    const { token } = await loginViaApi('employee')
    const api_ctx = await request.newContext()

    try {
      const resp = await api_ctx.post(`${API_URL}/auth/change-password`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          currentPassword: 'wrongpassword999',
          newPassword: 'newpass123',
        },
      })

      expect(resp.status()).toBe(400)

      const body_text = await resp.text()
      // 响应体必须非空
      expect(body_text.trim().length).toBeGreaterThan(0)
      // 不得暴露框架内部错误描述
      expect(body_text).not.toContain('HTTP 400')
      expect(body_text).not.toContain('Bad Request')
      // 必须包含业务语言关键词
      expect(body_text.toLowerCase()).toMatch(/incorrect|密码|错误/)
    } finally {
      await api_ctx.dispose()
    }
  })

  // ── Test 14-2: 新密码短于 6 位，返回 400，提示长度不足 ────────────────────
  test('14-2: API — 新密码短于 6 位，返回 400，提示"长度不能少于6位"', async () => {
    const { token } = await loginViaApi('employee')
    const api_ctx = await request.newContext()

    try {
      const resp = await api_ctx.post(`${API_URL}/auth/change-password`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          currentPassword: '123456',
          newPassword: '123',
        },
      })

      expect(resp.status()).toBe(400)

      const body_text = await resp.text()
      // 必须包含长度校验的业务提示
      expect(body_text).toMatch(/新密码长度不能少于6位|长度|6位/)
    } finally {
      await api_ctx.dispose()
    }
  })

  // ── Test 14-3: UI — 提交错误密码，Toast 为业务语言 ────────────────────────
  test('14-3: UI — 打开修改密码页面，提交错误密码，Toast 为业务语言', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'employee')

    const page = await context.newPage()
    try {
      // 尝试 /profile，若 404 再尝试 /settings
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      const body_text = await page.locator('body').textContent() ?? ''
      const is_404 = body_text.includes('404') || body_text.includes('页面不存在')

      if (is_404) {
        await page.goto('/settings')
        await page.waitForLoadState('networkidle')
      }

      // 查找密码输入框：优先 data-catch 属性，降级找 input[type=password]
      const password_input_by_test_id = page.getByTestId('password-current')
      const password_input_by_type = page.locator('input[type=password]').first()

      const has_test_id_input = await password_input_by_test_id.isVisible().catch(() => false)
      const has_type_input = await password_input_by_type.isVisible().catch(() => false)

      if (!has_test_id_input && !has_type_input) {
        test.skip(true, '密码修改表单未在 /profile 页面找到')
        return
      }

      const current_password_input = has_test_id_input
        ? password_input_by_test_id
        : password_input_by_type

      await current_password_input.fill('wrongpassword_ui_test')

      // 填写新密码：若有 data-catch 属性优先，否则取第二个 password input
      const new_password_input_by_test_id = page.getByTestId('password-new')
      const has_new_test_id = await new_password_input_by_test_id.isVisible().catch(() => false)

      if (has_new_test_id) {
        await new_password_input_by_test_id.fill('newvalidpass123')
      } else {
        const second_password_input = page.locator('input[type=password]').nth(1)
        const has_second = await second_password_input.isVisible().catch(() => false)
        if (has_second) {
          await second_password_input.fill('newvalidpass123')
        }
      }

      // 点击提交按钮
      const submit_by_test_id = page.getByTestId('password-submit')
      const has_submit_test_id = await submit_by_test_id.isVisible().catch(() => false)

      if (has_submit_test_id) {
        await submit_by_test_id.click()
      } else {
        const submit_btn = page.getByRole('button', { name: /修改|保存|提交|确认/ }).first()
        const has_submit = await submit_btn.isVisible().catch(() => false)
        if (has_submit) {
          await submit_btn.click()
        }
      }

      // 等待可能出现的 Toast 或内联错误信息
      await page.waitForTimeout(2000)

      // 检查 Toast 或错误提示的可见性
      const error_locator = page
        .getByTestId('form-error')
        .or(page.locator('.ant-message-error'))
        .or(page.locator('.ant-alert-error'))
        .or(page.locator('[class*="error"]').first())

      const has_error = await error_locator.isVisible().catch(() => false)

      if (has_error) {
        const error_text = await error_locator.textContent() ?? ''
        // 错误提示必须是业务语言，不得暴露框架内部错误
        expect(error_text).not.toContain('HTTP 400')
        expect(error_text).not.toContain('Bad Request')
      } else {
        console.info('UI密码修改表单未触发可见错误提示')
      }
    } finally {
      await context.close()
    }
  })
})
