/**
 * @file 应用入口模块 (main.ts)
 * @description 创建Vue SSR应用实例，挂载Pinia状态管理，是uni-app应用的启动入口
 * @responsibility
 *   - 创建Vue SSR应用实例
 *   - 初始化并注册Pinia状态管理库
 *   - 导出createApp函数供uni-app框架调用
 * @dependencies
 *   - vue: Vue3核心库，提供createSSRApp函数
 *   - pinia: Vue官方状态管理库，提供createPinia函数
 *   - ./App.vue: 应用根组件
 * @exports createApp: 创建应用实例的工厂函数
 */

import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 组件库全局样式 — 按平台条件导入，避免在 SCSS 中使用已弃用的 @import 语法
// #ifdef H5
import 'ant-design-vue/dist/reset.css'
// #endif
// #ifdef MP-WEIXIN || APP-PLUS
import 'vant/lib/index.css'
// #endif

/**
 * 创建应用实例工厂函数
 * @description 初始化Vue SSR应用并注册Pinia状态管理
 * @responsibility
 *   - 使用createSSRApp创建支持服务端渲染的Vue应用实例
 *   - 创建Pinia状态管理实例并注册到Vue应用
 *   - 返回应用实例和Pinia实例供外部使用
 * @designIntent
 *   - SSR支持：使用createSSRApp确保应用在服务端和客户端都能正确渲染
 *   - 状态管理：Pinia在整个应用生命周期内可用，支持跨组件状态共享
 *   - 模块化：工厂函数模式便于测试和复用
 * @returns {Object} 包含app和pinia两个属性的对象
 *   - app: Vue应用实例，可用于注册全局插件、组件等
 *   - pinia: Pinia状态管理实例，用于状态操作
 */
export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()

  app.use(pinia)

  return {
    app,
    pinia
  }
}
