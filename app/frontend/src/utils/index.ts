/**
 * @file 工具模块入口 (utils/index.ts)
 * @description 集中导出通用工具函数和常量，提供项目共享的基础能力
 * @responsibility
 *   - 定义和导出应用级别的常量（版本号、阶段标识等）
   - 提供通用工具函数供各业务模块复用
 *   - 作为工具库的统一出口，简化导入路径
 * @dependencies
 *   - 无外部依赖，纯工具模块
 * @exports
 *   - version: 应用版本号常量
 *   - stage: 开发阶段标识常量
 * @usage
 *   import { version, stage } from '@/utils'
 */

/**
 * 应用版本号常量
 * @description 标识当前应用的版本，用于版本控制和更新提示
 * @type {string}
 * @example '1.0.0'
 * @usage 可在关于页面显示、接口请求头中携带、日志上报等场景使用
 */
export const version = '1.0.0'

/**
 * 当前开发阶段标识常量
 * @description 用于版本控制和开发进度标识，便于团队协作和里程碑管理
 * @type {string}
 * @example '阶段二：工程基础与启动能力'
 * @responsibility 标识项目当前所处开发阶段，可在控制台、调试信息中展示
 * @usage 开发调试、项目管理、进度汇报
 */
export const stage = '阶段五：表单审批闭环与工作台体验升级'
