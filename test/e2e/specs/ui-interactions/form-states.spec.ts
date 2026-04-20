/**
 * UI-FORM-STATES — AntD 表单状态交互测试
 *
 * 职责：验证表单的加载状态、校验错误呈现、错误清除和必填提示行为。
 * 覆盖场景：
 *   1. leave-submit-btn-loading       — 提交时按钮呈现 ant-btn-loading 状态
 *   2. leave-form-validation-empty-submit — 空提交触发必填校验错误
 *   3. leave-form-error-clears-on-input   — 填入内容后对应 Form.Item 错误消失
 *   4. employee-create-name-required      — 员工创建弹窗中姓名必填校验
 */
import { test, expect, loginAs, resetData } from '../../../tools/fixtures/index'

test.describe('UI-FORM-STATES 表单状态测试', () => {
  test.beforeAll(async () => {
    await resetData()
  })

  // ── 测试 1: 请假提交时按钮进入 loading 状态 ──────────────────────────────────
  test('leave-submit-btn-loading', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'employee')
    const page = await context.newPage()

    try {
      await page.goto('/attendance')
      await page.waitForLoadState('networkidle')

      // 切换到请假子页签
      const leave_tab = page.getByTestId('attendance-tab-leave')
      await leave_tab.waitFor({ state: 'visible' })
      await leave_tab.click()

      // 等待表单出现
      await page.getByTestId('leave-form-submit').waitFor({ state: 'visible' })

      // 拦截 POST 请假接口，延迟 1500ms 后返回成功（模拟慢网）
      await page.route('**/api/attendance/leave', async route => {
        await new Promise<void>(resolve => setTimeout(resolve, 1500))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 9999, status: 'PENDING' })
        })
      })

      // 填写原因字段（最小必填）
      const reason_textarea = page.getByTestId('form-leave-reason').locator('textarea').first()
      await reason_textarea.fill('E2E loading 测试')

      // 点击提交并立即断言 loading 状态
      await page.getByTestId('leave-form-submit').click()

      // 断言按钮在响应到达前有 ant-btn-loading class
      await expect(page.getByTestId('leave-form-submit')).toHaveClass(/ant-btn-loading/, {
        timeout: 800
      })

      // 等待响应完成后按钮不再有 loading class
      await expect(page.getByTestId('leave-form-submit')).not.toHaveClass(/ant-btn-loading/, {
        timeout: 5000
      })
    } finally {
      await context.close()
    }
  })

  // ── 测试 2: 空提交触发必填校验 ────────────────────────────────────────────────
  test('leave-form-validation-empty-submit', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'employee')
    const page = await context.newPage()

    try {
      await page.goto('/attendance')
      await page.waitForLoadState('networkidle')

      const leave_tab = page.getByTestId('attendance-tab-leave')
      await leave_tab.waitFor({ state: 'visible' })
      await leave_tab.click()

      await page.getByTestId('leave-form-submit').waitFor({ state: 'visible' })

      // 直接提交空表单，触发前端校验
      await page.getByTestId('leave-form-submit').click()

      // 至少一处 Form.Item 应进入错误状态
      await expect(page.locator('.ant-form-item-has-error').first()).toBeVisible({ timeout: 5000 })
    } finally {
      await context.close()
    }
  })

  // ── 测试 3: 填写内容后原因字段错误消失 ────────────────────────────────────────
  test('leave-form-error-clears-on-input', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'employee')
    const page = await context.newPage()

    try {
      await page.goto('/attendance')
      await page.waitForLoadState('networkidle')

      const leave_tab = page.getByTestId('attendance-tab-leave')
      await leave_tab.waitFor({ state: 'visible' })
      await leave_tab.click()

      await page.getByTestId('leave-form-submit').waitFor({ state: 'visible' })

      // 空提交先触发校验
      await page.getByTestId('leave-form-submit').click()
      await expect(page.locator('.ant-form-item-has-error').first()).toBeVisible({ timeout: 5000 })

      // 填写请假原因字段
      const reason_textarea = page.getByTestId('form-leave-reason').locator('textarea').first()
      await reason_textarea.fill('休假')

      // 定位包裹 reason textarea 的最近 .ant-form-item 元素
      const reason_form_item = page.getByTestId('form-leave-reason').locator(
        'xpath=ancestor::div[contains(@class,"ant-form-item")][1]'
      )

      // 该 Form.Item 不再有错误 class
      await expect(reason_form_item).not.toHaveClass(/ant-form-item-has-error/, { timeout: 3000 })
    } finally {
      await context.close()
    }
  })

  // ── 测试 4: 员工创建弹窗中姓名必填校验 ────────────────────────────────────────
  test('employee-create-name-required', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'hr')
    const page = await context.newPage()

    try {
      await page.goto('/employees')
      await page.waitForLoadState('networkidle')

      // 打开创建弹窗
      await page.getByTestId('employee-create-btn').click()
      await page.locator('.ant-modal-content').waitFor({ state: 'visible' })

      // 不填写姓名直接保存
      await page.getByTestId('employee-save-btn').click()

      // 包裹 name input 的 Form.Item 应有错误 class
      const name_form_item = page.getByTestId('employee-name-input').locator(
        'xpath=ancestor::div[contains(@class,"ant-form-item")][1]'
      )
      await expect(name_form_item).toHaveClass(/ant-form-item-has-error/, { timeout: 5000 })
    } finally {
      // 关闭弹窗后再销毁 context
      await page.keyboard.press('Escape')
      await context.close()
    }
  })
})
