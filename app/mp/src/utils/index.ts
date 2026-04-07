/**
 * @file 工具函数入口模块 (utils/index.ts)
 * @description 集中导出所有工具函数，作为工具函数的统一出口
 * @responsibility
 *   - 聚合所有业务模块的工具函数
 *   - 提供统一入口供组件导入使用
 *   - 简化导入路径，避免深层路径引用
 */

/**
 * 应用版本号常量
 * @description 标识当前应用的版本，用于版本控制和更新提示
 */
export const version = '1.0.0'

/**
 * 当前开发阶段标识常量
 * @description 用于版本控制和开发进度标识
 */
export const stage = '阶段五：表单审批闭环与工作台体验升级'

// 认证与权限
export * from './access'

// 表单工具
export * from './forms'

// 组织架构
export * from './org'

// 设备检测
export * from './device'
