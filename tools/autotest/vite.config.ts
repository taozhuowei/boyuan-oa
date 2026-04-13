import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isElectron = mode === 'electron'

  return {
    plugins: [
      vue(),
      isElectron && electron([
        {
          entry: 'electron/main.ts',
          onstart: (options) => options.startup(),
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                external: ['electron']
              }
            }
          }
        },
        {
          entry: 'electron/preload.ts',
          onstart: (options) => options.reload(),
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                external: ['electron']
              }
            }
          }
        }
      ])
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    },
    server: {
      port: 1420,
      strictPort: true
    },
    build: {
      outDir: 'dist',
      target: 'chrome120',
      minify: 'esbuild'
    }
  }
})
