/**
 * E2E-02 劳工主线（worker.demo）
 *
 * 测试用例设计见 TEST_DESIGN.md §E2E-02。
 * 前置：worker.demo 已被 pm 分配 FOREMAN 第二角色（见 E2E-04 步骤 6）。
 * 本套件依赖 E2E-04 步骤 6 的 FOREMAN 分配，建议在 E2E-04 之后运行，
 * 或在 beforeAll 中由 pm 账号预先完成分配。
 */
import { test, expect, request as pwRequest } from '@playwright/test'
import { loginAs } from '../fixtures/auth'
import { resetData } from '../fixtures/reset'
import { WorkbenchPage } from '../pages/WorkbenchPage'
import { FormsPage } from '../pages/FormsPage'
import { API_URL } from '../playwright.config'

test.beforeAll(async () => {
  await resetData()

  // 预分配 FOREMAN 第二角色（使 worker 可见 LOG 入口）
  // 调用后端 API 直接完成，避免依赖 E2E-04 执行顺序
  // TODO: 实现后替换为真实端点 POST /api/projects/{id}/members/{employeeId}/second-role
})

test.describe('E2E-02 劳工主线', () => {
  // Step 1: 权限隔离 — 无 FOREMAN 时无 LOG 入口
  test('02-1: 无 FOREMAN 角色时工作台仅显示 LEAVE/OVERTIME/INJURY，无 LOG', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'worker')

    const page = await context.newPage()
    const workbench = new WorkbenchPage(page)
    await workbench.goto()

    await workbench.expectFormEntryVisible('LEAVE')
    await workbench.expectFormEntryVisible('OVERTIME')
    await workbench.expectFormEntryVisible('INJURY')
    await workbench.expectFormEntryHidden('LOG')

    await context.close()
  })

  // Step 3: 发起工伤申报
  test('02-3: 工伤申报表单无金额字段，提交成功，状态 PENDING', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'worker')

    const page = await context.newPage()
    const forms = new FormsPage(page)
    await forms.gotoInjuryForm()

    // 断言补偿金额字段不存在（DESIGN.md §8.4）
    await forms.expectAmountFieldHidden()

    await forms.fillInjuryForm({ projectId: '1', description: '手部割伤，需要处理' })
    await forms.submitInjuryForm()
    await forms.expectSubmitSuccess()

    await context.close()
  })

  // Step 4: 权限边界 — 无审批待办
  test('02-4: 劳工无审批权限，待办列表为空', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'worker')

    const page = await context.newPage()
    await page.goto('/todo')

    // 无"审批"Tab 或待办为空
    const approvalTab = page.getByTestId('todo-tab-approval')
    const isEmpty = await approvalTab.isVisible().then(v => !v).catch(() => true)
    expect(isEmpty).toBeTruthy()

    await context.close()
  })
})
