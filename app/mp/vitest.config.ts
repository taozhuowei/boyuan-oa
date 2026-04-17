import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  // 允许 vitest 访问 app/mp 之外（如 ../../test/unit/mp/）的测试文件与依赖
  server: {
    fs: {
      strict: false,
      allow: [resolve(__dirname, '../..')]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, '../shared'),
      // 强制 pinia 解析到同一物理路径，避免测试文件跨目录导致的双实例问题
      pinia: resolve(__dirname, '../node_modules/pinia/dist/pinia.mjs')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // MP 自身测试 + shared 纯函数测试（shared 无独立运行环境，借用 mp 的 alias 运行）
    include: [
      '../../test/unit/mp/**/*.{test,spec}.{js,ts}',
      '../../test/unit/shared/**/*.{test,spec}.{js,ts}'
    ],
    setupFiles: ['../../test/unit/mp/setup.ts'],
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      include: ['src/utils/**', 'src/stores/**', '../shared/utils/**'],
      reportsDirectory: resolve(__dirname, '../../test/reports/mp-coverage')
    }
  }
})
