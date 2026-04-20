/**
 * E2E 数据重置 fixture
 *
 * 职责：每个 spec 文件执行前调用 POST /api/dev/reset，将业务数据截断至初始种子状态。
 * 保留参照数据（账号、角色、部门、项目、审批流定义等）。
 */
import { request as playwrightRequest } from '@playwright/test'

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8080/api'

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
    await ctx.post(`${API_URL}/dev/skip-setup`)
  } finally {
    await ctx.dispose()
  }
}
