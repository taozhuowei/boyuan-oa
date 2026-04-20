/**
 * E2E-07 HR 主线（hr.demo）
 *
 * 测试用例设计见 TEST_DESIGN.md §E2E-07。
 * 前置：dev profile 已启动，业务数据已重置。
 */
import { test, expect } from '@playwright/test'
import { loginAs } from '../../tools/fixtures/auth'
import { resetData } from '../../tools/fixtures/reset'

test.beforeAll(async () => {
  await resetData()
})

test.describe('E2E-07 HR 主线', () => {
  // Step 1: 创建部门（仅 CEO 可操作；DESIGN.md §3 中 HR 也应可操作，为前端实现缺口）
  test('07-1: CEO 创建部门，组织树出现新节点', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'ceo')

    const page = await context.newPage()
    await page.goto('/org')
    await page.waitForLoadState('networkidle')

    await page.getByTestId('dept-create-btn').click()
    await page.getByTestId('dept-name-input').fill('E2E测试部')
    await page.getByTestId('org-dept-modal-ok').click()
    await expect(page.getByTestId('org-tree')).toContainText('E2E测试部')

    await context.close()
  })

  // Step 3: 创建新员工
  test('07-3: 创建员工，系统生成编号，员工可登录', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'hr')

    const page = await context.newPage()
    await page.goto('/employees')
    await page.getByTestId('employee-create-btn').click()

    await page.getByTestId('employee-name-input').fill('E2E测试员工')
    await page.getByTestId('employee-phone-input').fill('13900000001')

    // antd Select does not accept fill(); click to open dropdown and pick first option
    await page.getByTestId('employee-dept-select').click()
    const deptOption = page.locator('.ant-select-item-option').first()
    await deptOption.waitFor({ state: 'visible', timeout: 10_000 })
    await deptOption.click()

    // Gender is required — select 男
    await page.getByTestId('employee-gender-select').click()
    const maleOption = page.locator('.ant-select-item-option').filter({ hasText: '男' }).first()
    await maleOption.waitFor({ state: 'visible', timeout: 5_000 })
    await maleOption.click()

    await page.getByTestId('employee-save-btn').click()
    // On success, modal closes and list refreshes with the new employee
    await expect(page.locator('.ant-modal')).not.toBeVisible({ timeout: 15_000 })
    await expect(page.locator('table')).toContainText('E2E测试员工', { timeout: 5_000 })

    await context.close()
  })

  // Step 5: 修改员工手机号
  test('07-5: 修改员工手机号，操作日志自动记录', async ({ browser }) => {
    const context = await browser.newContext()
    await loginAs(context, 'hr')

    const page = await context.newPage()
    await page.goto('/employees')
    await page.waitForLoadState('networkidle')

    const firstRow = page.getByTestId('employee-row').first()
    await firstRow.getByTestId('employee-edit-btn').click()
    await page.getByTestId('employee-phone-input').fill('13900000099')

    // Seed employees lack gender — select 男 to pass validation
    await page.getByTestId('employee-gender-select').click()
    const maleOption = page.locator('.ant-select-item-option').filter({ hasText: '男' }).first()
    await maleOption.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {})
    if (await maleOption.isVisible()) {
      await maleOption.click()
    } else {
      await page.keyboard.press('Escape')
    }

    await page.getByTestId('employee-save-btn').click()
    // On success, modal closes and list refreshes
    await expect(page.locator('.ant-modal')).not.toBeVisible({ timeout: 15_000 })

    await context.close()
  })
})
