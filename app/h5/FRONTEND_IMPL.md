# H5 前端实现指南

> 技术栈：Nuxt 3 + Vue 3 + Pinia + Ant Design Vue（SPA 模式）

---

## 1. 项目结构

```
app/h5/
├── assets/               # 全局样式（ant-reset.css、app-loading.css）
├── components/
│   └── customized/       # 业务组件（如 CustomizedDevToolbar）
├── composables/          # 组合式函数（usePageConfig 等）
├── layouts/              # Nuxt 布局
├── middleware/
│   └── auth.global.ts    # 全局路由守卫
├── pages/                # 文件系统路由（对应各业务模块）
├── stores/
│   └── user.ts           # Pinia 用户状态
├── types/                # 本地类型声明
├── utils/
│   └── http.ts           # HTTP 请求封装
├── app.vue               # 根组件（ConfigProvider + 中文 locale）
└── nuxt.config.ts        # Nuxt 配置
```

---

## 2. HTTP 层 — `utils/http.ts`

基于 Nuxt `$fetch`（ofetch）封装，职责如下：

- **统一前缀**：所有请求前缀为 `/api`。
- **请求头注入**：
  - `X-Client-Type: web`
  - `Authorization: Bearer <token>`（从 cookie `oa-token` 读取）
- **401 自动处理**：响应状态码为 `401` 时，调用 `useUserStore().logout()` 并跳转到 `/login`（仅在客户端执行，且可通过 `skipAuthRedirect: true` 跳过）。

接口示例：

```ts
export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  skipAuthRedirect?: boolean
}

export async function request<T>(options: RequestOptions): Promise<T>
```

---

## 3. 认证与路由 — `middleware/auth.global.ts`

全局路由中间件，按顺序执行以下逻辑：

1. **系统初始化检查**
   - 首次加载时请求 `/api/setup/status`。
   - 若未初始化（`initialized: false`），重定向到 `/setup`。
   - 使用 `useState('setup-initialized')` 做 SSR 安全的单次缓存。

2. **公开路由放行**
   - `['/login', '/auth/forgot_password', '/setup']` 无需登录。

3. **登录校验**
   - 读取 cookie `oa-token`；不存在则重定向到 `/login`。

4. **基于角色的页面白名单（`PAGE_ACCESS`）**
   - 未在 `PAGE_ACCESS` 中定义的路页面对所有已登录用户开放。
   - 已定义的路由需匹配 `oa-user` cookie 中的 `role` 字段，否则重定向到首页 `/`。

   当前白名单节选：

   | 路由 | 允许角色 |
   |------|----------|
   | `/config` | `ceo` |
   | `/org` | `ceo`, `hr` |
   | `/employees` | `ceo`, `hr`, `finance`, `project_manager`, `department_manager` |
   | `/payroll` | `ceo`, `finance`, `worker`, `employee` |
   | `/projects` | `ceo`, `finance`, `project_manager`, `employee` |

---

## 4. Pinia 用户状态 — `stores/user.ts`

使用 `@pinia/nuxt` 模块，状态持久化通过 **Nuxt `useCookie`** 实现（SSR 安全）。

```ts
export const useUserStore = defineStore('user', () => {
  const tokenCookie = useCookie<string | null>('oa-token', { maxAge: 604800 })
  const userCookie  = useCookie<SessionUser | null>('oa-user', { maxAge: 604800 })
  // ...
})
```

- **cookie 有效期**：`maxAge: 604800`（7 天）。
- **导出成员**：
  - `token` / `userInfo` / `isLoggedIn`（computed）
  - `setSession(token, user)` — 登录后写入
  - `setUserInfo(partial)` — 局部更新用户信息
  - `logout()` — 清空 cookie 并退出

---

## 5. Ant Design Vue

### 5.1 自动导入

通过 `unplugin-vue-components` + `AntDesignVueResolver` 在 `nuxt.config.ts` 中配置：

```ts
vite: {
  plugins: [
    Components({
      resolvers: [AntDesignVueResolver({ importStyle: false })]
    })
  ]
}
```

组件无需手动 import，构建时会自动生成 `components.d.ts`。

### 5.2 中文国际化

`app.vue` 中使用 `a-config-provider` 注入 `zh_CN` locale，并同步设置 `dayjs.locale('zh-cn')`：

```vue
<template>
  <NuxtLoadingIndicator color="#003466" :height="2" />
  <a-config-provider :locale="antdLocale">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </a-config-provider>
  <CustomizedDevToolbar />
</template>

<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
dayjs.locale('zh-cn')
const antdLocale = zhCN
</script>
```

### 5.3 样式重置

`assets/ant-reset.css` 在 `nuxt.config.ts` 的 `css` 数组中全局引入，用于覆盖 Ant Design Vue 的默认样式。

---

## 6. 页面配置组合式函数 — `composables/usePageConfig.ts`

根据路由编码获取页面级字段与按钮权限配置，支持 `sessionStorage` 缓存（仅当前会话有效）。

```ts
export interface PageConfig {
  fields: string[]
  buttons: string[]
}

export function usePageConfig(routeCode: string): {
  config: Ref<PageConfig | null>
  loading: Ref<boolean>
  error: Ref<string | null>
}

export function clearPageConfigCache(routeCode: string): void
```

- **缓存键**：`page-config-${routeCode}`。
- **数据来源**：`/api/page-config/${routeCode}`（通过 `utils/http.ts` 请求，已自动带 `X-Client-Type: web`）。
- **SSR 安全**：读取/写入 `sessionStorage` 前均判断 `typeof window !== 'undefined'`。

---

## 7. Nuxt 配置要点 — `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  ssr: false,                          // SPA 模式，避免 AntD CSS-in-JS 导致的 FOUC
  modules: ['@pinia/nuxt'],
  css: [
    '~/assets/ant-reset.css',          // 样式重置
    '~/assets/app-loading.css',        // JS 执行前的 CSS 加载动画
  ],
  alias: {
    '@shared': resolve(__dirname, '../shared'),
    '@': resolve(__dirname, '.')
  },
  router: {
    options: { strict: false }
  },
  vite: {
    plugins: [
      Components({
        resolvers: [AntDesignVueResolver({ importStyle: false })]
      })
    ],
    build: {
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug', 'console.info']
        }
      }
    }
  },
  routeRules: {
    '/api/**': {
      proxy: `http://localhost:${process.env.SERVER_PORT ?? '8080'}/api/**`
    }
  }
})
```

- **`ssr: false`**：纯客户端渲染，解决 Ant Design Vue 的 CSS-in-JS 在 SSR 下无法生成静态样式的问题。
- **`@shared` 别名**：指向 `app/shared`，共享类型与工具函数。
- **`routeRules`**：开发阶段将 `/api/**` 代理到后端 `localhost:8080`（或 `SERVER_PORT` 环境变量）。
