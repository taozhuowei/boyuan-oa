/**
 * @file 状态管理入口模块 (stores/index.ts)
 * @description 集中导出所有Pinia状态管理模块，作为状态管理的统一出口
 * @responsibility
 *   - 聚合所有业务模块的状态管理store
 *   - 提供统一入口供组件导入使用
 *   - 简化导入路径，避免深层路径引用
 * @dependencies
 *   - ./user: 用户状态管理模块，包含用户信息、登录状态等
 * @exports 从./user模块导出的所有内容（包括useUserStore等）
 * @usage
 *   import { useUserStore } from '@/stores'
 */

/**
 * 导出用户状态管理模块的所有导出内容
 * @description 包括useUserStore组合式函数、用户状态类型定义等
 * @see ./user.ts 用户模块详细实现
 */
export * from './user'
