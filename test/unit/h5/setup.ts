/**
 * H5 单元测试全局 setup
 *
 * 职责：每个测试前清空 localStorage，防止跨测试状态污染。
 * H5 端无 uni 全局对象，无需额外 mock。
 */
import { beforeEach } from 'vitest'

beforeEach(() => {
  localStorage.clear()
})
