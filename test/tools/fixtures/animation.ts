/**
 * AntD 动效等待工具
 *
 * 职责：等待 Ant Design Vue 过渡动画完全结束，避免断言竞态。
 * AntD 组件在过渡期间会附加 -enter-active / -leave-active class，
 * 本工具轮询直到这些 class 消失，再执行后续断言。
 */
import { Page, Locator } from '@playwright/test'

/**
 * 等待 AntD 过渡动画完成。
 * targetState='visible'：等待元素出现且无进行中的过渡 class。
 * targetState='hidden'：等待元素从 DOM 中隐藏。
 */
export async function waitForAntTransition(
  page: Page,
  locator: Locator,
  targetState: 'visible' | 'hidden',
  timeout = 3000
): Promise<void> {
  if (targetState === 'visible') {
    await locator.waitFor({ state: 'visible', timeout })
    await page.waitForFunction(
      (el) => {
        if (!el) return false
        const classes = Array.from((el as Element).classList)
        return !classes.some(c => c.endsWith('-enter-active') || c.endsWith('-leave-active'))
      },
      await locator.elementHandle(),
      { timeout }
    )
  } else {
    await locator.waitFor({ state: 'hidden', timeout })
  }
}
