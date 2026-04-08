import { resolve } from 'path'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  css: ['ant-design-vue/dist/reset.css'],
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
  }
})
