/**
 * C-E2E-03 加班申报审批流程
 *
 * 覆盖场景：
 *   test 1 — UI：employee 在加班申报 tab 填写时间，验证时长自动计算显示；
 *             通过 API 直接提交，断言 /attendance/records 有 PENDING 记录
 *   test 2 — API：dept_manager 通过 /forms/{id}/approve 审批通过，
 *             断言记录状态变为 APPROVING 或 APPROVED
 *
 * 设计说明：
 *   - 加班申报（/attendance/overtime）为"正常申报"，直接写入系统，通知上级，
 *     无需审批流（DESIGN §7.3）。
 *   - 加班补申报（/attendance/overtime-self-report）才走审批流，由 employee 提交，
 *     直系上级（dept_manager）为第一审批节点（审批流 id=2 节点1 DIRECT_SUPERVISOR）。
 *   - test 1 UI 仅验证时长自动计算的 DOM 显示逻辑，然后用 API 创建可审批的记录。
 *   - OvertimeTab 的时长显示元素没有 data-catch，用文本内容或 CSS 定位。
 */
import { test, expect, request } from '@playwright/test'
import { loginAs, loginViaApi } from '../fixtures/auth'
import { resetData } from '../fixtures/reset'
import { API_URL } from '../playwright.config'

/** 跨 test 共享：加班补申报的表单记录 ID */
let overtime_form_id = -1

test.beforeAll(async () => {
  await resetData()
})

test.describe('C-E2E-03 加班申报审批流程', () => {
  // ── test 1：UI 时长自动计算 + API 创建可审批记录 ───────────────────────────

  test('03-1: 填写开始/结束时间后时长自动计算显示，API 提交补申报记录为 PENDING', async ({ browser }) => {
    // ── Part A：UI 验证时长自动计算 ──
    const context = await browser.newContext()
    await loginAs(context, 'employee')
    const page = await context.newPage()

    // 导航到考勤管理，切换到加班申报 Tab
    await page.goto('/attendance?tab=overtime')
    await page.waitForLoadState('networkidle')

    // 等待 OvertimeTab 渲染（key="overtime"），包含 a-time-picker
    const time_pickers = page.locator('.ant-picker')
    await time_pickers.first().waitFor({ state: 'visible', timeout: 15_000 })

    // 填写加班日期（DatePicker）
    const date_picker_input = page.locator('.ant-picker-input input').first()
    await date_picker_input.fill('2026-06-01')
    await date_picker_input.press('Escape')

    // 填写开始时间 09:00（time-picker）
    const time_inputs = page.locator('.ant-picker-input input')
    // attendance/index.vue 中 overtime tab 渲染三个 picker：date、startTime、endTime
    // 取第 2 个（index 1）为 startTime picker input
    const start_time_input = time_inputs.nth(1)
    await start_time_input.fill('09:00')
    await start_time_input.press('Escape')

    // 填写结束时间 13:00（index 2）
    const end_time_input = time_inputs.nth(2)
    await end_time_input.fill('13:00')
    await end_time_input.press('Escape')

    // 时长显示：OvertimeTab 通过 computed overtime_duration 渲染 <span>
    // 内容格式为 "4 小时" 或 "X 小时 Y 分钟"
    // 等待时长计算结果出现（非 null 且不含"请先选择"）
    const duration_span = page.locator('span').filter({ hasText: /小时/ })
    // 允许计算延迟，最多等 5s
    await expect(duration_span.first()).toBeVisible({ timeout: 5_000 })
    const duration_text = await duration_span.first().textContent()
    expect(duration_text).toBeTruthy()
    expect(duration_text).toMatch(/\d+\s*小时/)

    await context.close()

    // ── Part B：API 创建加班补申报（走审批流）──
    const { token: employee_token } = await loginViaApi('employee')
    const api_ctx = await request.newContext()

    const submit_resp = await api_ctx.post(`${API_URL}/attendance/overtime-self-report`, {
      headers: { Authorization: `Bearer ${employee_token}` },
      data: {
        formType: 'OVERTIME',
        formData: {
          date: '2026-06-01',
          startTime: '09:00',
          endTime: '13:00',
          overtimeType: 'WEEKDAY',
          attachmentIds: []
        },
        remark: 'C-E2E-03 加班补申报测试'
      }
    })

    expect(submit_resp.ok()).toBeTruthy()
    const submit_body = await submit_resp.json() as { id: number; status: string }
    overtime_form_id = submit_body.id
    expect(overtime_form_id).toBeGreaterThan(0)
    expect(submit_body.status).toBe('PENDING')

    // GET /attendance/records 验证记录存在且状态为 PENDING
    const records_resp = await api_ctx.get(`${API_URL}/attendance/records`, {
      headers: { Authorization: `Bearer ${employee_token}` }
    })
    expect(records_resp.ok()).toBeTruthy()
    const records = await records_resp.json() as Array<{ id: number; status: string; formType: string }>
    const overtime_record = records.find((r) => r.id === overtime_form_id)
    expect(overtime_record).toBeDefined()
    expect(overtime_record!.status).toBe('PENDING')

    await api_ctx.dispose()
  })

  // ── test 2：dept_manager 审批通过 ────────────────────────────────────────

  test('03-2: dept_manager 审批加班补申报，状态变为 APPROVING 或 APPROVED', async () => {
    test.skip(overtime_form_id <= 0, '前置 test 1 未成功创建加班补申报记录，跳过审批验证')

    const { token: dept_manager_token } = await loginViaApi('dept_manager')
    const api_ctx = await request.newContext()

    // dept_manager 审批通过（FormController /forms/{id}/approve，DEPARTMENT_MANAGER 有权限）
    const approve_resp = await api_ctx.post(`${API_URL}/forms/${overtime_form_id}/approve`, {
      headers: { Authorization: `Bearer ${dept_manager_token}` },
      data: { comment: 'C-E2E-03 部门经理审批通过' }
    })

    expect(approve_resp.ok()).toBeTruthy()
    const approve_body = await approve_resp.json() as { id: number; status: string }
    // 第一节点（直系上级）审批后，状态为 APPROVING（仍有后续节点）或 APPROVED（单节点流程）
    expect(['APPROVING', 'APPROVED']).toContain(approve_body.status)

    // 再次通过 GET /attendance/records 确认状态已更新（employee 视角）
    const { token: employee_token } = await loginViaApi('employee')
    const records_resp = await api_ctx.get(`${API_URL}/attendance/records`, {
      headers: { Authorization: `Bearer ${employee_token}` }
    })
    expect(records_resp.ok()).toBeTruthy()
    const records = await records_resp.json() as Array<{ id: number; status: string }>
    const updated = records.find((r) => r.id === overtime_form_id)
    expect(updated).toBeDefined()
    expect(['APPROVING', 'APPROVED']).toContain(updated!.status)

    await api_ctx.dispose()
  })
})
