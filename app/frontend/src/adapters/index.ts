/**
 * 平台适配层统一导出
 *
 * 使用示例：
 * ```ts
 * import { getComponent, mapProps, getPlatform } from '@/adapters'
 *
 * const Button = await getComponent('Button')
 * const adaptedProps = mapProps('Button', { type: 'primary' })
 * ```
 */

export { getComponent, getComponentSync, mapProps, getPlatform } from './resolver'

// 重新导出配置类型（供类型声明使用）
export type { ComponentConfig, Platform } from './resolver'
