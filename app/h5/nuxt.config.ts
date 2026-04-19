import { resolve } from 'path'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false, // SPA mode: eliminates FOUC caused by AntD CSS-in-JS not being available in SSR HTML
  modules: ['@pinia/nuxt'],
  css: [
    '~/assets/ant-reset.css', // Local copy avoids Vite @fs path issue on Windows with spaces in dir name
    '~/assets/app-loading.css', // CSS-only initial spinner — visible before JS executes
  ],
  alias: {
    '@shared': resolve(__dirname, '../shared'),
    '@': resolve(__dirname, '.'),
  },
  router: {
    options: {
      strict: false,
    },
  },
  vite: {
    plugins: [
      Components({
        resolvers: [AntDesignVueResolver({ importStyle: false })],
      }),
    ],
    build: {
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug', 'console.info'],
        },
      },
    },
  },
  routeRules: {
    '/api/**': { proxy: `http://localhost:${process.env.SERVER_PORT ?? '8080'}/api/**` },
  },
})
