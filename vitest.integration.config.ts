import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/integration/**/*.{test,spec}.{js,ts}'],
    reporters: ['verbose'],
    testTimeout: 30000
  }
})
