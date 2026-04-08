import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

/**
 * 前后端集成测试 Vitest 配置（镜像 test/integration/vitest.config.ts）
 *
 * 实际测试文件位于 test/integration/
 * 此文件放在 app/ 以便 vitest 能正确解析 node_modules（Yarn workspace）
 *
 * 运行方式：
 *   cd app && npx vitest run --config vitest.integration.config.ts
 *
 * 前提：后端服务在 http://localhost:8080 运行，未运行时所有用例自动跳过
 */
export default defineConfig({
  // 允许访问 app/ 之外的测试文件（test/integration/ 在 app/ 上一级）
  server: {
    fs: {
      strict: false,
      allow: [resolve(__dirname, '..')]
    }
  },
  test: {
    name: 'api-integration',
    environment: 'node',
    globals: true,
    // 使用相对路径避免 Vitest glob 在含空格绝对路径上匹配失败
    include: ['../test/integration/**/*.test.ts'],
    reporters: ['verbose'],
    testTimeout: 10000
  }
})
