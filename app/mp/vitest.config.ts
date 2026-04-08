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
    include: ['src/**/*.{test,spec}.{js,ts}'],
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      include: ['src/utils/**', 'src/stores/**'],
      reportsDirectory: resolve(__dirname, '../../test/reports/frontend-coverage')
    }
  }
})
