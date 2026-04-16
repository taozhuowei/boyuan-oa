/**
 * Playwright E2E 配置
 *
 * 职责：定义 E2E 测试的运行环境、并行策略、浏览器和 dev server 配置。
 * 测试用例设计见 TEST_DESIGN.md。
 */
import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8080/api'

export { API_URL }

export default defineConfig({
  testDir: './specs',
  // OA 业务有状态（审批流、薪资周期等），禁止并行避免写冲突
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: BASE_URL,
    // 每个 action 超时 10s（等待元素出现）
    actionTimeout: 10_000,
    // 每个 navigation 超时 30s
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry'
  },
  projects: [
    // Phase 1：仅跑 Chromium，稳定后可加 Firefox / WebKit
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  // dev server 由外部启动（CI 中由 workflow 负责），本地开发时 reuse
  // 若需要自动拉起 H5 dev server，取消注释下方配置：
  // webServer: {
  //   command: 'nuxt dev --cwd ../../app/h5',
  //   url: BASE_URL,
  //   reuseExistingServer: true,
  //   timeout: 120_000
  // }
})
