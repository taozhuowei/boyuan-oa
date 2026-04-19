import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@shared': resolve(__dirname, '../shared'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['../../test/unit/h5/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['../../test/unit/h5/setup.ts'],
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      include: ['utils/**'],
      reportsDirectory: resolve(__dirname, '../../test/reports/h5-coverage'),
    },
  },
})
