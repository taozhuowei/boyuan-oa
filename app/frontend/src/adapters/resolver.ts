/**
 * 平台适配层解析器
 * 读取 JSON 配置，根据平台返回对应组件
 */

import type { Component } from 'vue'
import componentsConfig from './config/components.json'
import propsMapConfig from './config/props-map.json'

// 平台类型
export type Platform = 'h5' | 'mp'

// 组件配置项
export interface ComponentConfig {
  source: string
  name: string
}

// 获取当前平台
export function getPlatform(): Platform {
  // #ifdef H5
  return 'h5'
  // #endif
  // #ifdef MP-WEIXIN || APP-PLUS
  return 'mp'
  // #endif
  return 'h5' // 默认 H5
}

// 获取组件
export async function getComponent(name: string): Promise<Component | null> {
  const platform = getPlatform()
  const config = (componentsConfig as Record<string, Record<Platform, ComponentConfig>>)[name]

  if (!config) {
    console.warn(`[Adapters] Component "${name}" not found in config`)
    return null
  }

  const { source, name: componentName } = config[platform]

  // 如果是本地组件路径
  if (source.startsWith('@/')) {
    const module = await import(/* @vite-ignore */ source.replace('@/', '../'))
    return module[componentName] || module.default
  }

  // 第三方组件库
  try {
    const module = await import(/* @vite-ignore */ source)
    return module[componentName]
  } catch (error) {
    console.error(`[Adapters] Failed to load component "${name}" from "${source}":`, error)
    return null
  }
}

// 转换 props
export function mapProps(componentName: string, props: Record<string, any>): Record<string, any> {
  const platform = getPlatform()
  const componentPropsMap = (propsMapConfig as Record<string, Record<Platform, Record<string, any>>>)[componentName]

  if (!componentPropsMap) {
    return props
  }

  const platformMap = componentPropsMap[platform]
  if (!platformMap) {
    return props
  }

  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(props)) {
    const mapping = platformMap[key]

    if (mapping === null) {
      // 该平台不支持此属性，跳过
      continue
    }

    if (mapping === undefined) {
      // 无映射，保持原属性名
      result[key] = value
    } else if (typeof mapping === 'string') {
      // 属性名映射
      result[mapping] = value
    } else if (typeof mapping === 'object') {
      // 值映射
      const targetKey = platformMap[key] ? key : key
      result[targetKey] = mapping[value] !== undefined ? mapping[value] : value
    }
  }

  return result
}

// 同步获取组件（用于条件编译场景）
export function getComponentSync(name: string): Component | null {
  const platform = getPlatform()
  const config = (componentsConfig as Record<string, Record<Platform, ComponentConfig>>)[name]

  if (!config) {
    console.warn(`[Adapters] Component "${name}" not found in config`)
    return null
  }

  return null // 同步获取需要条件编译处理，在 index.ts 中实现
}
