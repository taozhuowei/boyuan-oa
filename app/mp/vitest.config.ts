import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, '../shared')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // MP 自身测试 + shared 纯函数测试（shared 无独立运行环境，借用 mp 的 alias 运行）
    include: [
      'test/**/*.{test,spec}.{js,ts}',
      '../shared/test/**/*.{test,spec}.{js,ts}'
    ],
    setupFiles: ['test/setup.ts'],
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      include: ['src/utils/**', 'src/stores/**', '../shared/utils/**'],
      reportsDirectory: resolve(__dirname, '../../test/reports/mp-coverage')
    }
  }
})
