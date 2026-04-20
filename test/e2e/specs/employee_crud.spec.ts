/**
 * C-E2E-07 员工管理 CRUD
 *
 * 覆盖场景：
 *   test 1 — API：CEO 创建新员工，断言返回 id 和 employeeNo 非空
 *   test 2 — UI：HR 在 /employees 列表页可见新创建的员工
 *   test 3 — API：CEO 停用员工，断言停用后登录被拒绝（401/403）
 *
 * 设计说明：
 *   - POST /employees 和 PATCH /employees/:id/status 均需 CEO 权限。
 *   - employee 表不随 /dev/reset 清除，属保留表。test 1 通过 beforeAll reset 确保
 *     业务数据干净，但 employee 条目本身无法重置，故不依赖固定 username 而是用 response.id。
 *   - 新员工默认密码为 "123456"，login username = employeeNo（系统生成，如 EMP20260401xx）。
 *   - employee_id 和 employee_no 通过模块级变量在各 test 间共享。
 */
import { test, expect, request } from '@playwright/test'
import { loginAs, loginViaApi } from '../../tools/fixtures/auth'
import { resetData } from '../../tools/fixtures/reset'
import { API_URL } from '../playwright.config'

/** 跨 test 共享：新创建员工的 DB id */
let employee_id = -1
/** 跨 test 共享：新创建员工系统生成的工号（用于登录测试） */
let employee_no = ''
/** 时间戳后缀确保 phone 唯一（phone 字段有 UNIQUE 约束，employee 表在 reset 中保留） */
const PHONE_SUFFIX = Date.now().toString().slice(-8)

test.beforeAll(async () => {
  await resetData()
})

test.describe('C-E2E-07 员工管理 CRUD', () => {
  // ── test 1：API — CEO 创建新员工 ─────────────────────────────────────────────

  test('07-1: CEO 通过 API 创建新员工，返回 id 非空', async () => {
    const { token: ceo_token } = await loginViaApi('ceo')
    const api_ctx = await request.newContext()

    try {
      const create_resp = await api_ctx.post(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${ceo_token}` },
        data: {
          name: 'E2E测试员工',
          phone: `139${PHONE_SUFFIX}`,
          roleCode: 'employee',
          gender: 'MALE',
          employeeType: 'OFFICE',
          departmentId: 1,
          entryDate: '2026-01-01'
        }
      })

      if (create_resp.ok()) {
        const body = await create_resp.json() as { id: number; employeeNo: string }
        employee_id = body.id
        employee_no = body.employeeNo ?? ''
        expect(employee_id).toBeGreaterThan(0)
        expect(employee_no.length).toBeGreaterThan(0)
      } else {
        const err_text = await create_resp.text()
        throw new Error(`创建员工失败（${create_resp.status()}）: ${err_text}`)
      }
    } finally {
      await api_ctx.dispose()
    }
  })

  // ── test 2：UI — HR 在员工列表可见新员工 ─────────────────────────────────────

  test('07-2: HR 在 /employees 页面列表中可见新创建的员工', async ({ browser }) => {
    test.skip(employee_id <= 0, 'test 1 未成功创建员工，跳过 UI 验证')

    const context = await browser.newContext()
    await loginAs(context, 'hr')

    const page = await context.newPage()
    try {
      await page.goto('/employees')
      await page.waitForLoadState('networkidle')

      // 断言：列表页可见，不报 500
      await expect(page.locator('body')).not.toContainText('500')

      // 优先通过 data-catch="employee-name" 文本定位
      const name_cells = page.getByTestId('employee-name')
      const cell_count = await name_cells.count()

      if (cell_count > 0) {
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
    } finally {
      await context.close()
    }
  })

  // ── test 3：API — 停用员工，验证停用后无法登录 ───────────────────────────────

  test('07-3: CEO 停用员工后，被停用账号登录返回 401 或 403', async () => {
    test.skip(employee_id <= 0, 'test 1 未成功创建员工，跳过停用验证')

    const { token: ceo_token } = await loginViaApi('ceo')
    const api_ctx = await request.newContext()

    try {
      // Step 1：停用员工（仅 CEO 有权限；PATCH /employees/:id/status）
      const disable_resp = await api_ctx.patch(`${API_URL}/employees/${employee_id}/status`, {
        headers: { Authorization: `Bearer ${ceo_token}` },
        data: { accountStatus: 'DISABLED' }
      })
      expect([200, 204]).toContain(disable_resp.status())

      // Step 2：验证停用后登录被拒绝（employee_no 是系统生成的工号，默认密码 123456）
      const login_resp = await api_ctx.post(`${API_URL}/auth/login`, {
        data: {
          username: employee_no,
          password: '123456'
        }
      })
      expect([401, 403]).toContain(login_resp.status())
    } finally {
      await api_ctx.dispose()
    }
  })
})
