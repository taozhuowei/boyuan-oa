import { resolve } from 'path'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,  // SPA mode: eliminates FOUC caused by AntD CSS-in-JS not being available in SSR HTML
  modules: ['@pinia/nuxt'],
  css: ['~/assets/ant-reset.css'],  // Local copy avoids Vite @fs path issue on Windows with spaces in dir name
  alias: {
    '@shared': resolve(__dirname, '../shared'),
    '@': resolve(__dirname, '.')
  },
  router: {
    options: {
      strict: false
    }
  },
  vite: {
    plugins: [
      Components({
        resolvers: [AntDesignVueResolver({ importStyle: false })]
      })
    ]
  },
  routeRules: {
    '/api/**': { proxy: 'http://localhost:8080/api/**' }
  }
})
