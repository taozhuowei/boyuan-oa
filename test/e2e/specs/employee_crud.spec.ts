/**
 * C-E2E-07 员工管理 CRUD
 *
 * 覆盖场景：
 *   test 1 — API：HR 创建新员工，断言返回 id 非空
 *   test 2 — UI：HR 在 /employees 列表页可见新创建的员工
 *   test 3 — API：HR 停用员工，断言停用后登录被拒绝（401/403）
 *
 * 设计说明：
 *   - 创建员工时 username 使用 e2e_test_user，若已存在（重复 username）则 409。
 *     test 1 对 409 进行降级处理：尝试从列表接口查找已有员工。
 *   - test 3 停用后通过 POST /auth/login 验证登录失败，是停用功能的最直接证明。
 *   - employeeId 和 employee_username 通过模块级变量在各 test 间共享。
 */
import { test, expect, request } from '@playwright/test'
import { loginAs, loginViaApi } from '../fixtures/auth'
import { resetData } from '../fixtures/reset'
import { API_URL } from '../playwright.config'

/** 跨 test 共享：新创建员工的 ID */
let employee_id = -1
/** 跨 test 共享：新创建员工的用户名 */
const employee_username = 'e2e_test_user'
/** 跨 test 共享：新创建员工的密码 */
const employee_password = '123456'

test.beforeAll(async () => {
  await resetData()
})

test.describe('C-E2E-07 员工管理 CRUD', () => {
  // ── test 1：API — HR 创建新员工 ──────────────────────────────────────────────

  test('07-1: HR 通过 API 创建新员工，返回 id 非空', async () => {
    const { token: hr_token } = await loginViaApi('hr')
    const api_ctx = await request.newContext()

    const create_resp = await api_ctx.post(`${API_URL}/employees`, {
      headers: { Authorization: `Bearer ${hr_token}` },
      data: {
        name: 'E2E测试员工',
        username: employee_username,
        phone: '13900000099',
        password: employee_password,
        roleCode: 'employee',
        gender: 'MALE',
        employeeType: 'REGULAR'
      }
    })

    if (create_resp.ok()) {
      const body = await create_resp.json() as { id: number; username: string }
      employee_id = body.id
      expect(employee_id).toBeGreaterThan(0)
      expect(body.username).toBe(employee_username)
    } else if (create_resp.status() === 409) {
      // username 已存在，通过列表接口查找员工 ID
      console.warn('[C-E2E-07] POST /employees 返回 409，username 已存在，尝试从列表获取 id')
      const list_resp = await api_ctx.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${hr_token}` }
      })
      if (list_resp.ok()) {
        const employees = await list_resp.json() as Array<{ id: number; username: string }>
        const existing = employees.find((e) => e.username === employee_username)
        if (existing) {
          employee_id = existing.id
          expect(employee_id).toBeGreaterThan(0)
        }
      }
    } else {
      // 其他 4xx/5xx — 真正失败，不允许降级；throw 使 test 立即以失败退出
      const err_text = await create_resp.text()
      throw new Error(`创建员工失败（${create_resp.status()}）: ${err_text}`)
    }

    if (employee_id <= 0) {
      await api_ctx.dispose()
      test.fail(true, '409 且无法从列表获取已有员工 ID，测试数据状态异常')
      return
    }

    await api_ctx.dispose()
  })

  // ── test 2：UI — HR 在员工列表可见新员工 ─────────────────────────────────────

  test('07-2: HR 在 /employees 页面列表中可见新创建的员工', async ({ browser }) => {
    test.skip(employee_id <= 0, 'test 1 未成功创建员工，跳过 UI 验证')

    const context = await browser.newContext()
    await loginAs(context, 'hr')

    const page = await context.newPage()
    await page.goto('/employees')
    await page.waitForLoadState('networkidle')

    // 断言：列表页可见，不报 500
    await expect(page.locator('body')).not.toContainText('500')

    // 优先通过 data-catch="employee-name" 文本定位
    const name_cells = page.getByTestId('employee-name')
    const cell_count = await name_cells.count()

    if (cell_count > 0) {
      // 找到至少一个 employee-name 元素，在其中查找 E2E测试员工
      const target = name_cells.filter({ hasText: 'E2E测试员工' })
      const target_count = await target.count()
      if (target_count > 0) {
        await expect(target.first()).toBeVisible()
      } else {
        // 可能列表分页，通过全文本搜索
        await expect(page.locator('body')).toContainText('E2E测试员工')
      }
    } else {
      // 无 data-catch，直接通过文本内容断言
      await expect(page.locator('body')).toContainText('E2E测试员工')
    }

    await context.close()
  })

  // ── test 3：API — 停用员工，验证停用后无法登录 ───────────────────────────────

  test('07-3: HR 停用员工后，被停用账号登录返回 401 或 403', async () => {
    test.skip(employee_id <= 0, 'test 1 未成功创建员工，跳过停用验证')

    const { token: hr_token } = await loginViaApi('hr')
    const api_ctx = await request.newContext()

    // Step 1：停用员工
    const disable_resp = await api_ctx.post(`${API_URL}/employees/${employee_id}/disable`, {
      headers: { Authorization: `Bearer ${hr_token}` }
    })
    // 停用接口：200 成功，204 成功无内容；400/404 则说明员工状态异常
    expect([200, 204]).toContain(disable_resp.status())

    // Step 2：验证停用后登录被拒绝
    // 直接调用 /auth/login（不走 dev-login 旁路），使用标准认证
    const login_resp = await api_ctx.post(`${API_URL}/auth/login`, {
      data: {
        username: employee_username,
        password: employee_password
      }
    })
    // 停用账号登录：期望 401（Unauthorized）或 403（Forbidden）
    // 后端 UserDetailsService 应抛出 DisabledException → Spring Security → 401
    expect([401, 403]).toContain(login_resp.status())

    await api_ctx.dispose()
  })
})
