import net from 'node:net'
import { defineConfig } from 'vite'
import { resolve } from 'path'
import uni from '@dcloudio/vite-plugin-uni'

const preferredPort = Number(process.env.PORT ?? 4173)
const isProd = process.env.NODE_ENV === 'production'

function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const tryPort = (port: number) => {
      const probe = net.createServer()

      probe.unref()
      probe.once('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          tryPort(port + 1)
          return
        }

        reject(error)
      })

      probe.once('listening', () => {
        const address = probe.address()
        const resolvedPort = typeof address === 'object' && address ? address.port : port

        probe.close((closeError) => {
          if (closeError) {
            reject(closeError)
            return
          }

          resolve(resolvedPort)
        })
      })

      probe.listen(port, '0.0.0.0')
    }

    tryPort(startPort)
  })
}

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const port = await findAvailablePort(preferredPort)

  return {
    plugins: [
      uni.default ? uni.default() : uni()
    ],
    css: {
      preprocessorOptions: {
        scss: {
          // 使用 Dart Sass 现代编译器 API，消除 legacy-js-api 弃用警告
          api: 'modern-compiler'
        }
      }
    },
    server: {
      port,
      open: true,
      host: '0.0.0.0',
      strictPort: false
    },
    build: {
      sourcemap: !isProd,
      minify: isProd ? 'terser' : false,
      terserOptions: isProd ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.warn']
        },
        mangle: true
      } : undefined
    },
    define: {
      __DEV__: !isProd,
      __PROD__: isProd
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@shared': resolve(__dirname, '../shared')
      }
    }
  }
})
