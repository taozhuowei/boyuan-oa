import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

/**
 * Vitest 配置 — 前端单元测试
 *
 * 包含：
 *   - app/src/** 内的测试（AppShell.test.ts 等）
 *   - test/frontend/**  外部测试目录（access/forms/org/stores 等）
 *
 * 运行：cd app && npx vitest run
 *
 * 注意：
 *   - server.fs.strict=false 解决 Vite 在路径含空格（BOYUAN OA）时无法加载外部文件的 bug
 *   - pinia alias 解决 Yarn workspace hoisting 导致外部测试文件无法解析 pinia 的问题
 *   - setupFiles 不使用，因路径含空格触发 Vite URL 编码 bug；改为各测试文件内联 setup
 */
export default defineConfig({
  plugins: [vue()],
  // 允许 Vite 访问项目根目录之外的文件（test/frontend/ 在 app/ 上一级）
  server: {
    fs: {
      strict: false,
      allow: [resolve(__dirname, '../..')]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // pinia 由 Yarn workspace 安装到根 node_modules/，外部测试文件无法向上找到它，需显式 alias
      'pinia': resolve(__dirname, '../../node_modules/pinia'),
      // shared 类型目录，供 app/mp 和 test/frontend 共享
      '@shared': resolve(__dirname, '../shared')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // 同时扫描 src/ 内和根目录 test/frontend/ 下的测试文件
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      '../../test/frontend/**/*.{test,spec}.{js,ts}'
    ],
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      include: ['src/utils/**', 'src/stores/**'],
      reportsDirectory: resolve(__dirname, '../../test/reports/frontend-coverage')
    }
  }
})
