/**
 * 平台适配层解析器
 *
 * 职责：根据平台（H5 / 小程序）动态加载对应 UI 组件库的组件。
 *
 * 设计说明：
 * - 第三方组件库（ant-design-vue / vant）使用 #ifdef 条件编译 + 字面量 import()
 *   保证 Vite 能静态分析并正确处理模块路径，避免 bare specifier 问题。
 * - 本地 @/ 组件使用 @vite-ignore 动态 import，路径在浏览器端可通过相对 URL 解析。
 * - 所有加载均有 try/catch，单个组件失败不会影响其他组件。
 * - 第三方库只加载一次，结果缓存到模块级 Promise。
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

// ─── 第三方组件库懒加载（字面量 import，Vite 可静态分析） ───────────────────

/** 组件库映射：{ 库名 → 模块导出对象 } */
let _libCachePromise: Promise<Record<string, Record<string, unknown>>> | null = null

/** 同步组件缓存：getComponent 异步加载后写入，getComponentSync 从此读取 */
const _syncCache: Record<string, Component | null> = {}

function _loadThirdPartyLibs(): Promise<Record<string, Record<string, unknown>>> {
  const cache: Record<string, Record<string, unknown>> = {}

  // #ifdef H5
  // 使用字面量字符串，让 Vite 正确处理 ant-design-vue 模块路径
  return import('ant-design-vue').then((m) => {
    cache['ant-design-vue'] = m as unknown as Record<string, unknown>
    return cache
  }).catch(() => cache)
  // #endif

  // #ifdef MP-WEIXIN || APP-PLUS
  return import('vant').then((m) => {
    cache['vant'] = m as unknown as Record<string, unknown>
    return cache
  }).catch(() => cache)
  // #endif

  return Promise.resolve(cache) // 兜底：不应执行到这里
}

async function _getLib(source: string): Promise<Record<string, unknown>> {
  if (!_libCachePromise) {
    _libCachePromise = _loadThirdPartyLibs()
  }
  const libs = await _libCachePromise
  return libs[source] ?? {}
}

// ─── 公共 API ────────────────────────────────────────────────────────────────

/**
 * 获取组件
 * 数据流：组件名 → components.json 查平台配置 → 动态加载模块 → 返回组件定义
 */
export async function getComponent(name: string): Promise<Component | null> {
  const platform = getPlatform()
  const config = (componentsConfig as Record<string, Record<Platform, ComponentConfig>>)[name]

  if (!config) {
    console.warn(`[Adapters] Component "${name}" not found in config`)
    return null
  }

  const { source, name: componentName } = config[platform]

  try {
    if (source.startsWith('@/')) {
      // 本地组件：@vite-ignore 路径在浏览器端通过相对 URL 正常解析
      const module = await import(/* @vite-ignore */ source.replace('@/', '../'))
      return (module[componentName] ?? module.default) as Component | null
    }

    // 第三方组件库：从缓存中取（首次触发懒加载）
    const lib = await _getLib(source)
    const component = lib[componentName]
    if (!component) {
      console.warn(`[Adapters] "${componentName}" not found in "${source}"`)
    }
    const resolved = (component as Component) ?? null
    _syncCache[name] = resolved  // 写入同步缓存
    return resolved
  } catch (error) {
    console.error(`[Adapters] Failed to load "${name}" from "${source}":`, error)
    _syncCache[name] = null
    return null
  }
}

/**
 * 转换 props（跨平台 prop 名称映射）
 * 数据流：原始 props → props-map.json 查映射规则 → 返回适配后的 props
 */
export function mapProps(componentName: string, props: Record<string, unknown>): Record<string, unknown> {
  const platform = getPlatform()
  const componentPropsMap = (propsMapConfig as Record<string, Record<Platform, Record<string, unknown>>>)[componentName]

  if (!componentPropsMap) return props

  const platformMap = componentPropsMap[platform]
  if (!platformMap) return props

  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(props)) {
    const mapping = platformMap[key]

    if (mapping === null) continue // 该平台不支持此属性

    if (mapping === undefined) {
      result[key] = value // 无映射，保持原属性名
    } else if (typeof mapping === 'string') {
      result[mapping] = value // 属性名映射
    } else if (typeof mapping === 'object') {
      result[key] = (mapping as Record<string, unknown>)[value as string] ?? value // 值映射
    }
  }

  return result
}

/**
 * 同步获取组件
 * 数据流：组件名 → _syncCache（由 getComponent 异步加载后写入）→ 返回组件
 * 注：首次调用时组件可能尚未加载，返回 null；
 *     useComponent 的 onMounted 完成后缓存即可用。
 */
export function getComponentSync(name: string): Component | null {
  /* #ifdef H5 */
  return _syncCache[name] ?? null
  /* #endif */
  /* #ifdef MP-WEIXIN || APP-PLUS */
  return _syncCache[name] ?? null
  /* #endif */
  return null
}
