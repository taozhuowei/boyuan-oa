import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['test/setup.ts'],
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      include: ['utils/**'],
      reportsDirectory: resolve(__dirname, '../../test/reports/h5-coverage')
    }
  }
})
