/**
 * E2E 数据重置 fixture
 *
 * 职责：每个 spec 文件执行前调用 POST /api/dev/reset，将业务数据截断至初始种子状态。
 * 保留参照数据（账号、角色、部门、项目、审批流定义等）。
 *
 * 用法：在 spec 文件中通过 test.beforeAll(resetData) 或作为 auto fixture 使用。
 */
import { request as playwrightRequest } from '@playwright/test'
import { API_URL } from '../playwright.config'

/**
 * 调用 dev reset 端点，失败时抛出以中止测试套件。
 * 仅在 dev profile 下有效（生产环境此路由不存在）。
 */
export async function resetData(): Promise<void> {
  const ctx = await playwrightRequest.newContext()
  try {
    const response = await ctx.post(`${API_URL}/dev/reset`)
    if (!response.ok()) {
      throw new Error(`[resetData] POST /dev/reset failed: ${response.status()} ${await response.text()}`)
    }
    // Restore initialized=true so auth middleware does not redirect to /setup.
    // Required because e2e_08_setup_wizard.spec.ts calls /dev/reset-setup which sets initialized=false.
    // The H2 in-memory DB persists across test runs within the same server session.
    await ctx.post(`${API_URL}/dev/skip-setup`)
  } finally {
    await ctx.dispose()
  }
}
