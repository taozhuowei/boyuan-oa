/**
 * CI 动画禁用 fixture（opt-in）
 *
 * 职责：向页面注入全局 CSS，将所有 transition/animation 时长强制为 0，
 * 消除动画带来的断言竞态。仅用于不需要验证动效本身的测试。
 *
 * 用法：在 test.extend fixture 中标记 auto: false，需要的 spec 显式使用。
 */
import { Page } from '@playwright/test'

export async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0ms !important;
        animation-delay: 0ms !important;
        transition-duration: 0ms !important;
        transition-delay: 0ms !important;
      }
    `
  })
}
