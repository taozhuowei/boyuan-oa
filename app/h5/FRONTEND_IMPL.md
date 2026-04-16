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


## 测试设计

### 2.2 前端单元测试（Vitest + Vue Test Utils）

覆盖目标：组件渲染、权限过滤、HTTP 层行为、表单校验。

| 组件/模块        | 测试文件                         | 关键断言                                                              |
|----------------|----------------------------------|----------------------------------------------------------------------|
| 登录页           | `LoginPage.spec.ts`              | 成功后 userStore 写入 employeeType/positionId；忘记密码链接可点击       |
| HTTP 层          | `http.spec.ts`                   | 401 自动跳转登录；同 URL 并发请求被防重提交拦截；自动携带 X-Client-Type   |
| 权限过滤          | `permissionUtils.spec.ts`        | OFFICE 角色过滤施工日志/工伤菜单；LABOR 角色可见并不可见 payroll 入口    |
| 忘记密码页        | `ForgotPassword.spec.ts`         | 4步 Step 正确推进；resetToken 写入临时 store；成功后跳转登录页           |
| 签名画板          | `SignatureCanvas.spec.ts`        | getBase64() 返回非空字符串；clear() 清空画布；H5/MP 双端渲染             |
| usePageConfig   | `usePageConfig.spec.ts`          | 同 routeCode 第二次不重复请求（session 缓存）；不同角色返回不同字段配置    |

**示例：HTTP 防重复提交**
```typescript
test('concurrent requests to same URL are deduplicated', async () => {
  const mockApi = vi.fn(() => Promise.resolve({ data: {} }))
  const p1 = request('/api/test', { method: 'POST' })
  const p2 = request('/api/test', { method: 'POST' })
  await Promise.all([p1, p2])
  expect(mockApi).toHaveBeenCalledTimes(1)
})
```

### 执行命令

```bash
# 前端单元测试
cd app/h5 && yarn test

# 前端类型检查
cd app/h5 && yarn type-check
```

## §10 Dev 快捷工具设计

> **目标读者**：开发者在本地测试时使用，尤其是初始化向导、各角色业务流程的快速验证。
>
> **生产安全保证**：所有 Dev 工具均通过两道独立机制防止泄漏到生产环境——前端 `import.meta.env.DEV` 守门（production build 时 Rollup dead-code-elimination 剔除）；后端 `@Profile("dev")` 守门（生产 Spring 不加载，路由物理不存在）。两道机制互相独立，任一均可单独保证安全。

---

### 10.1 测试账号

所有账号密码统一 `123456`，数据写入 `db/data.sql`（dev profile 专用）。

| 账号 | 姓名 | 角色 | 员工类型 | 典型测试场景 |
|------|------|------|----------|-------------|
| `employee.demo` | 张晓宁 | employee（员工） | OFFICE | 提交请假/加班申请，查看工资条 |
| `finance.demo` | 李静 | finance（财务） | OFFICE | 薪资结算、人员档案、导入通讯录 |
| `pm.demo` | 王建国 | project_manager（项目经理） | OFFICE | 审批请假/施工日志，管理项目成员 |
| `ceo.demo` | 陈明远 | ceo（CEO） | OFFICE | 终审审批、系统配置、全局数据总览 |
| `worker.demo` | 赵铁柱 | worker（劳工） | LABOR | 提交施工日志、发起工伤补偿申请 |

---

### 10.2 组件清单

| 组件 | 位置 | 平台 | 用途 |
|------|------|------|------|
| `DevToolbar.vue` | `components/customized/DevToolbar.vue` | H5 + 小程序 | 悬浮按钮，点击展开操作面板（重置向导/跳过向导/快捷登录） |
| `DevLoginPanel.vue` | `components/customized/DevLoginPanel.vue` | H5 | 已存在；登录页内嵌，5个账号一键登录按钮 |
| `DevController.java` | `controller/DevController.java` | 后端 | `@Profile("dev")` 接口，提供 reset-setup 操作 |

---

### 10.3 DevToolbar 详细设计

#### 激活条件

```typescript
// 组件顶层，无需平台判断
const is_dev = import.meta.env.DEV  // production build 时恒为 false，整块被 tree-shake
```

`v-if="is_dev"` 包裹整个组件根元素。`yarn build`（Vite production mode）输出时，Rollup 识别 `import.meta.env.DEV === false` 为死代码并完整删除，不需要 `#ifdef` 条件编译。

#### 平台差异

H5 和小程序均呈现为**右下角固定悬浮按钮**，点击展开操作面板，样式一致，体验对齐。

| 平台 | 悬浮按钮 | 展开面板 | 实现方式 |
|------|---------|---------|---------|
| H5 | 右下角圆形按钮「DEV」 | 向上弹出操作卡片 | `position: fixed; bottom: 24px; right: 24px` |
| 小程序 | 右下角圆形按钮「DEV」 | 向上弹出操作列表 | `position: fixed`（小程序支持）+ `v-show` 切换 |

两端均默认**收起**，点击展开/收起切换，避免遮挡正文内容。

#### 三个功能入口

**① 一键重置初始化向导**

```
点击 → 确认弹窗（"确认重置？系统将回到未初始化状态"）
     → 确认 → POST /dev/reset-setup
             → 成功：清空 userStore session → 跳转 /pages/setup/index
             → 失败：Toast 展示错误信息
```

**② 一键跳过初始化向导**

```
点击 → POST /dev/reset-setup（重置为未初始化）
     → POST /setup/init（填入预设测试数据，见下方 payload）
     → 成功：Toast "初始化完成" → 跳转登录页
```

预设 init payload：

```json
{
  "companyName": "众维建筑工程有限公司",
  "ceoEmployeeNo": "ceo.demo",
  "ceoPassword": "123456",
  "departments": ["综合管理部", "财务管理部", "项目一部", "运营管理部", "施工一部"],
  "approvalFlows": "DEFAULT"
}
```

**③ 快捷登录（5个测试账号）**

| 按钮标签 | 账号 | 角色 |
|---------|------|------|
| 员工登录 | `employee.demo` | employee |
| 财务登录 | `finance.demo` | finance |
| PM 登录 | `pm.demo` | project_manager |
| CEO 登录 | `ceo.demo` | ceo |
| 劳工登录 | `worker.demo` | worker |

密码统一 `123456`。点击后复用 `loginWithAccount()`，登录成功后跳转工作台，失败后显示错误提示。

H5 端此功能由 `DevLoginPanel.vue` 实现（已存在），DevToolbar 在小程序端复制同样的按钮列表。

---

### 10.5 Dev 工具使用场景

| 测试场景 | 推荐操作 | 步骤 |
|---------|---------|------|
| 测试初始化向导全流程 | 一键重置 | 点击"重置向导" → 走向导5步 → 验证完成后入口锁定 |
| 快速进入业务测试 | 一键跳过 + 快捷登录 | 点击"跳过向导" → 选择目标角色登录 → 直接进入业务页面 |
| 验证某角色权限 | 快捷登录 | 点击对应角色按钮，无需手动输入账号密码 |
| 复现 bug 后验证修复 | 快捷登录 + 业务操作 | 登录对应角色 → 复现操作路径 → 确认 bug 消失 |
| 验证向导锁定机制 | 完成初始化后直接访问 `/pages/setup/index` | 应跳转登录页，且后端返回 403 |

---

### 10.6 生产构建验证清单

以下检查在每次 `npm run build` 后执行，确保 Dev 工具完全剔除：

- [ ] `dist/build/h5/` 中所有 JS 文件搜索 `reset-setup`，结果为空
- [ ] `dist/build/h5/` 中所有 JS 文件搜索 `DevToolbar`，结果为空
- [ ] `dist/build/mp-weixin/` 中所有 JS 文件搜索 `reset-setup`，结果为空
- [ ] 以 `spring.profiles.active=prod` 启动后端，`POST /dev/reset-setup` 返回 404
- [ ] H5 生产页面 DOM 中不存在 `dev-toolbar` 相关元素

---
