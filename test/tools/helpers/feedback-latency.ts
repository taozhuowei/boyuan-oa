/**
 * 反馈延迟测量工具
 *
 * 职责：测量用户操作到首个视觉反馈之间的延迟（毫秒）。
 * 通过冻结网络请求隔离客户端响应，确保测量的是 DOM 状态变化，
 * 而非服务端响应时间。
 */
import { Page, expect } from '@playwright/test'

export interface FeedbackLatencyOptions {
  /** 触发操作的元素选择器 */
  triggerSelector: string
  /** 预期出现的 loading 指示器选择器 */
  loadingSelector: string
  /** 要拦截冻结的 API URL 模式 */
  interceptUrl: string
  /** 反馈延迟阈值（ms），超过则测试失败，默认 100ms */
  thresholdMs?: number
}

/**
 * 点击触发元素，测量 loading 指示器出现的延迟。
 * 网络请求被冻结，确保测量的是纯客户端状态变化速度。
 * @returns 实际延迟毫秒数
 */
export async function measureFeedbackLatency(
  page: Page,
  options: FeedbackLatencyOptions
): Promise<number> {
  const threshold = options.thresholdMs ?? 100

  // 冻结网络请求，不让服务端响应干扰 loading 状态测量
  let unfreezeResolve: () => void
  await page.route(options.interceptUrl, async (route) => {
    await new Promise<void>(resolve => { unfreezeResolve = resolve })
    await route.continue()
  })

  const clickTimeHandle = await page.evaluateHandle(() => performance.now())
  await page.click(options.triggerSelector)

  // 轮询等待 loading 指示器出现，间隔 10ms
  let latencyMs: number | null = null
  const deadline = Date.now() + threshold + 500

  while (Date.now() < deadline) {
    const visible = await page.isVisible(options.loadingSelector)
    if (visible) {
      latencyMs = await page.evaluate(
        (startTime) => performance.now() - startTime,
        await clickTimeHandle.jsonValue() as number
      )
      break
    }
    await page.waitForTimeout(10)
  }

  // 解冻请求
  unfreezeResolve!()
  await page.unroute(options.interceptUrl)

  if (latencyMs === null) {
    throw new Error(`Loading indicator "${options.loadingSelector}" never appeared within ${threshold + 500}ms`)
  }

  expect(latencyMs, `Feedback latency ${latencyMs.toFixed(1)}ms exceeds threshold ${threshold}ms`).toBeLessThanOrEqual(threshold)
  return latencyMs
}
