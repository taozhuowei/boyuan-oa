/**
 * 统一 Playwright test fixture 扩展
 *
 * 职责：扩展 @playwright/test 的 test 对象，注入项目专用 fixture。
 * 所有 spec 应从本文件导入 { test, expect }，而非直接从 @playwright/test。
 *
 * 可用 fixture：
 * - noAnimations：opt-in，禁用全页动画（适用于不需要验证动效的 spec）
 * - scanA11y：在当前页面状态执行 axe 扫描，blocking 违规直接失败
 */
import { test as base, expect } from '@playwright/test'
import { disableAnimations } from './disable-animations'
import { assertNoA11yViolations } from './axe'

type OaFixtures = {
  /** 禁用全页动画（opt-in，非 auto） */
  noAnimations: void
  /** 执行 axe 无障碍扫描，可指定 CSS 选择器缩小范围 */
  scanA11y: (scope?: string) => Promise<void>
}

export const test = base.extend<OaFixtures>({
  noAnimations: [
    async ({ page }, use) => {
      await disableAnimations(page)
      await use()
    },
    { auto: false }
  ],

  scanA11y: async ({ page }, use) => {
    await use((scope?: string) => assertNoA11yViolations(page, scope))
  }
})

export { expect }
export { waitForAntTransition } from './animation'
export { loginAs, loginViaApi } from './auth'
export { resetData } from './reset'
export type { RoleKey } from './auth'
