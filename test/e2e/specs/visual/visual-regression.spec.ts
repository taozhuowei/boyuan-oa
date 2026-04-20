/**
 * VISUAL-REGRESSION — 页面视觉回归快照测试
 *
 * 职责：为关键页面/状态生成基准截图，防止 UI 意外变更。
 * 快照文件存储在 __snapshots__ 目录，初次运行自动生成基准；
 * 后续运行若差异超过 maxDiffPixelRatio=0.01 则失败。
 *
 * 动态内容（时间戳、未读数、表格行数据）通过 mask 遮罩避免误报。
 */
import { test, expect, loginAs, resetData } from '../../../tools/fixtures/index'

// 统一视口尺寸
test.use({ viewport: { width: 1440, height: 900 } })

/** 截图公共选项：禁用动画，最大像素差 1% */
const SNAP_OPTS = {
  animations: 'disabled' as const,
  maxDiffPixelRatio: 0.01
}

test.describe('VISUAL-REGRESSION 视觉回归快照', () => {
  test.beforeAll(async () => {
    await resetData()
  })

  // ── 快照 1: 登录页默认状态 ───────────────────────────────────────────────────
  test('login-default', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveScreenshot('login-default.png', SNAP_OPTS)
  })

  // ── 快照 2: 登录页错误提示 ───────────────────────────────────────────────────
  test('login-error', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')

    await page.getByTestId('login-username').fill('nobody')
    await page.getByTestId('login-password').fill('wrong')
    await page.getByTestId('login-form-submit').click()

    // 等待错误提示出现（行内 Alert 或 Toast）
    const error_alert = page.getByTestId('login-form-error-alert')
    const error_toast = page.locator('.ant-message-error')
    await Promise.race([
      error_alert.waitFor({ state: 'visible', timeout: 8000 }).catch(() => null),
      error_toast.waitFor({ state: 'visible', timeout: 8000 }).catch(() => null)
    ])

    await expect(page).toHaveScreenshot('login-error.png', SNAP_OPTS)
  })

  // ── 快照 3: 员工角色工作台 ───────────────────────────────────────────────────
  test('workbench-employee', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await loginAs(context, 'employee')
    const page = await context.newPage()

    try {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('workbench-employee.png', {
        ...SNAP_OPTS,
        mask: [
          page.getByTestId('notification-badge-unread'),
          // 动态计数卡片
          page.locator('[data-catch="workbench-card-todos"]'),
          page.locator('[data-catch="workbench-card-active-projects"]'),
          page.locator('[data-catch="workbench-card-total-employees"]')
        ]
      })
    } finally {
      await context.close()
    }
  })

  // ── 快照 4: HR 员工列表（遮罩表格行数据避免行数变化误报）────────────────────
  test('employee-list', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await loginAs(context, 'hr')
    const page = await context.newPage()

    try {
      await page.goto('/employees')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('employee-list.png', {
        ...SNAP_OPTS,
        // 遮罩整个表格体，隔离行数据变动
        mask: [page.locator('.ant-table-tbody')]
      })
    } finally {
      await context.close()
    }
  })

  // ── 快照 5: 请假表单默认状态 ─────────────────────────────────────────────────
  test('leave-form-default', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await loginAs(context, 'employee')
    const page = await context.newPage()

    try {
      await page.goto('/attendance')
      await page.waitForLoadState('networkidle')

      const leave_tab = page.getByTestId('attendance-tab-leave')
      await leave_tab.waitFor({ state: 'visible' })
      await leave_tab.click()

      // 等待提交按钮出现，确认表单已渲染
      await page.getByTestId('leave-form-submit').waitFor({ state: 'visible' })

      await expect(page).toHaveScreenshot('leave-form-default.png', SNAP_OPTS)
    } finally {
      await context.close()
    }
  })

  // ── 快照 6: 请假表单校验错误状态 ─────────────────────────────────────────────
  test('leave-form-validation', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await loginAs(context, 'employee')
    const page = await context.newPage()

    try {
      await page.goto('/attendance')
      await page.waitForLoadState('networkidle')

      const leave_tab = page.getByTestId('attendance-tab-leave')
      await leave_tab.waitFor({ state: 'visible' })
      await leave_tab.click()

      await page.getByTestId('leave-form-submit').waitFor({ state: 'visible' })

      // 空提交触发校验错误
      await page.getByTestId('leave-form-submit').click()
      await page.locator('.ant-form-item-has-error').first().waitFor({ state: 'visible' })

      await expect(page).toHaveScreenshot('leave-form-validation.png', SNAP_OPTS)
    } finally {
      await context.close()
    }
  })

  // ── 快照 7: 员工角色侧边导航栏（仅裁剪侧边栏区域）──────────────────────────
  test('nav-sidebar-employee', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await loginAs(context, 'employee')
    const page = await context.newPage()

    try {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('nav-sidebar-employee.png', {
        ...SNAP_OPTS,
        clip: { x: 0, y: 0, width: 240, height: 900 }
      })
    } finally {
      await context.close()
    }
  })

  // ── 快照 8: 待办列表为空状态 ─────────────────────────────────────────────────
  test('todo-empty', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await loginAs(context, 'employee')
    const page = await context.newPage()

    try {
      await page.goto('/todo')
      await page.waitForLoadState('networkidle')

      // 优先等待明确的空态标记，降级等待表格 placeholder
      const todo_empty = page.getByTestId('todo-empty')
      const table_placeholder = page.locator('.ant-table-placeholder')

      const empty_visible = await todo_empty
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true)
        .catch(() => false)

      if (!empty_visible) {
        await table_placeholder.waitFor({ state: 'visible', timeout: 5000 })
      }

      await expect(page).toHaveScreenshot('todo-empty.png', SNAP_OPTS)
    } finally {
      await context.close()
    }
  })
})
