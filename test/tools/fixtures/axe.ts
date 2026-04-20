/**
 * axe-core 无障碍扫描封装
 *
 * 职责：封装 @axe-core/playwright，提供统一的扫描接口。
 * critical/serious 违规须阻断测试；moderate/minor 记录为警告。
 *
 * 安装：yarn add -D @axe-core/playwright
 */
import { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

export interface AxeResult {
  blocking: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']
  warnings: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']
}

/**
 * 对当前页面执行 WCAG 2.x AA 扫描。
 * @param page Playwright Page
 * @param include CSS 选择器，限定扫描范围（默认全页）
 */
export async function runAxe(page: Page, include?: string): Promise<AxeResult> {
  let builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    // AntD portal 元素（下拉、tooltip）渲染在 body 末尾，继承 theme token，
    // 颜色对比检查会误报，排除这些容器。
    .exclude('.ant-select-dropdown')
    .exclude('.ant-tooltip')
    .exclude('.ant-message')
    .exclude('.ant-notification')

  if (include) {
    builder = builder.include(include)
  }

  const results = await builder.analyze()

  const blocking = results.violations.filter(
    v => v.impact === 'critical' || v.impact === 'serious'
  )
  const warnings = results.violations.filter(
    v => v.impact === 'moderate' || v.impact === 'minor'
  )

  return { blocking, warnings }
}

/**
 * 断言页面无阻断级别无障碍违规。
 * warnings 仅打印到 console，不中断测试。
 */
export async function assertNoA11yViolations(page: Page, include?: string): Promise<void> {
  const { blocking, warnings } = await runAxe(page, include)

  for (const w of warnings) {
    console.warn(
      `[axe:${w.impact}] ${w.id} — ${w.description}\n` +
      `  nodes: ${w.nodes.map(n => n.target.join(', ')).slice(0, 2).join(' | ')}`
    )
  }

  if (blocking.length > 0) {
    const msg = blocking.map(v =>
      `[${v.impact?.toUpperCase()}] ${v.id} (${v.tags.filter(t => t.startsWith('wcag')).join(', ')})\n` +
      `  ${v.description}\n` +
      `  nodes: ${v.nodes.map(n => n.html).slice(0, 2).join('\n  ')}`
    ).join('\n\n')
    throw new Error(`Accessibility violations:\n\n${msg}`)
  }
}
