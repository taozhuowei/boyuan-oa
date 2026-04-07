import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

/**
 * Vitest 配置 — 前端单元测试
 *
 * 包含：
 *   - app/frontend/src/** 内的测试（AppShell.test.ts 等原有测试）
 *   - test/frontend/**    外部测试目录（access/forms/org/stores 等）
 *
 * 运行：cd app/frontend && npx vitest run
 */
export default defineConfig({
  plugins: [vue()],
  // 允许 Vite 访问项目根目录之外的文件（test/frontend/ 在 app/frontend/ 上两级）
  server: {
    fs: {
      strict: false,
      allow: [resolve(__dirname, '../..')]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // pinia 安装在 workspace 根 app/node_modules/，外部测试文件（test/frontend/）
      // 无法通过标准 node_modules 向上查找到此位置，需显式 alias
      'pinia': resolve(__dirname, '../node_modules/pinia')
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
    // setupFiles 因项目路径含空格（BOYUAN OA）触发 Vite URL 编码 bug，改为各测试文件内联 setup
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      include: ['src/utils/**', 'src/stores/**'],
      reportsDirectory: resolve(__dirname, '../../test/reports/frontend-coverage')
    }
  }
})
