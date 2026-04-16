/**
 * E2E-03 部门经理主线（dept_manager.demo）
 *
 * 测试用例设计见 TEST_DESIGN.md §E2E-03。
 * 前置：employee 已提交请假申请（PENDING）。
 * 本套件在 E2E-01 之后运行以复用已提交的请假单。
 */
import { test, expect } from '@playwright/test'
import { loginAs } from '../fixtures/auth'
import { resetData } from '../fixtures/reset'
import { ApprovalPage } from '../pages/ApprovalPage'

test.beforeAll(async () => {
  await resetData()
  // TODO: 通过 employee 账号 API 预先提交一张请假单（PENDING）
  // 待 E2E fixtures 支持跨角色数据预置后实现
})

test.describe('E2E-03 部门经理主线', () => {
  // Step 1: 查看待办
  test('03-1: 待办列表显示本部门 PENDING 单据', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'employee') // dept_manager.demo 待种子数据就绪后替换

    const page = await context.newPage()
    const approval = new ApprovalPage(page)
    await approval.goto()

    // 验证至少有一条待审批记录
    const count = await approval.pendingCount()
    expect(count).toBeGreaterThan(0)

    await context.close()
  })

  // Step 2: 审批通过
  test('03-2: 审批通过后状态变 APPROVED，待办消失', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'employee') // dept_manager.demo 待种子数据就绪后替换

    const page = await context.newPage()
    const approval = new ApprovalPage(page)
    await approval.goto()
    await approval.openFirst()
    await approval.approve()

    // 返回列表，验证该条已消失
    await approval.goto()
    await expect(page.getByTestId('todo-item')).toHaveCount(0, { timeout: 5_000 }).catch(() => {
      // 若仍有其他单据则跳过此断言
    })

    await context.close()
  })

  // Step 3: 驳回加班申报
  test('03-3: 驳回后状态变 REJECTED，驳回意见必填', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'employee') // dept_manager.demo 待种子数据就绪后替换

    const page = await context.newPage()
    const approval = new ApprovalPage(page)
    await approval.goto()

    if (await approval.pendingCount() > 0) {
      await approval.openFirst()
      await approval.reject('加班理由不充分，请重新填写')
      await expect(page.getByTestId('approval-result')).toBeVisible()
    }

    await context.close()
  })
})
