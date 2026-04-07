# 博渊 OA 平台 — 前端实现细节

> **文档职责**：描述博渊前端的代码架构决策、适配层设计、HTTP 层规范、CSS 变量体系、Sysadmin 机制的前端实现，以及配置驱动渲染的运行时工作原理。
>
> **目标读者**：前端开发者、全栈开发者。
>
> **不包含内容**：后端代码结构和引擎实现（见 `backend_impl.md` 和 `architecture.md`）。

---

## 1. 前端代码结构

```
src/
├── adapters/                  # 双端组件适配层
│   ├── index.ts               # 统一导出
│   ├── resolver.ts            # 平台检测 + 组件动态加载
│   └── config/
│       ├── components.json    # 组件名 → H5/MP 来源映射
│       └── props-map.json     # 跨平台 props 映射规则
├── composables/
│   └── useComponent.ts        # 批量并行加载组件的组合式函数
├── components/
│   └── cross-platform/        # 自定义双端兼容组件
│       └── Table/             # MP 端 Table（Vant 无此组件）
├── pages/                     # 各业务页面
├── stores/                    # Pinia 状态管理
│   └── useUserStore.ts        # 用户会话状态
├── utils/
│   ├── http.ts                # 统一 HTTP 请求封装（唯一出口）
│   └── access.ts              # 登录鉴权逻辑（调用 http.ts）
└── styles/
    └── variables.scss         # CSS 变量定义（--oa-* 前缀）
```

---

## 2. 双端组件适配层

前端采用**适配器模式**统一管理 H5（Ant Design Vue）和 MP（Vant）的组件差异，避免业务页面中出现平台判断代码。

### 2.1 工作原理

```
components.json（注册表）
  ↓
resolver.ts（平台检测，动态 import）
  ↓
useComponent()（组合式函数，批量并行加载）
  ↓
业务页面（<component :is="Button"> 方式使用）
```

### 2.2 核心 API

```typescript
// 批量并行加载（推荐，在 script setup 中调用）
const { Button, Card, Table } = useComponent(['Button', 'Card', 'Table'])

// 单个异步加载
const Button = await getComponent('Button')
```

### 2.3 components.json 示例

```json
{
  "Button": {
    "h5": { "source": "ant-design-vue", "name": "Button" },
    "mp": { "source": "vant", "name": "Button" }
  },
  "Table": {
    "h5": { "source": "ant-design-vue", "name": "Table" },
    "mp": { "source": "@/components/cross-platform/Table", "name": "Table" }
  },
  "Textarea": {
    "h5": { "source": "ant-design-vue", "name": "Textarea" },
    "mp": { "source": "vant", "name": "Field" }
  }
}
```

### 2.4 使用原则

- **业务页面主体（列表、表格、表单）**：使用适配层加载组件
- **登录页、系统初始化向导等纯输入页面**：直接使用 uni-app 原生元素（`input`、`view`），确保立即渲染，不受适配层异步加载影响
- **新增组件**：先在 `components.json` 注册，再在页面中调用

---

## 3. HTTP 层规范

所有 HTTP 请求**统一通过 `utils/http.ts` 的 `request()` 函数**，禁止各模块自行封装请求逻辑。

### 3.1 http.ts 标准能力

```typescript
// 自动携带 X-Client-Type: web | mp
// 自动附加 Bearer Token（从 userStore 读取）
// 401 自动跳转登录页
// 请求失败自动显示 toast 错误提示
// loading 状态管理（防重复提交）
```

### 3.2 违规模式（禁止）

```typescript
// ✗ 禁止在各模块自建 request
// access.ts 和 forms.ts 中的私有 request() 函数是存量技术债，待迁移
```

---

## 4. CSS 变量体系

统一使用 `--oa-*` 前缀的 CSS 自定义属性，定义于 `styles/variables.scss`，通过 `:root` 全局导出。

### 4.1 变量清单

```scss
// 主色
--oa-primary:        #003466   // 深海军蓝
--oa-primary-light:  #e6f0f7

// 文字
--oa-text-primary:   rgba(0,0,0,0.85)
--oa-text-secondary: rgba(0,0,0,0.65)
--oa-text-tertiary:  rgba(0,0,0,0.45)

// 边框 / 背景
--oa-border:         #d9d9d9
--oa-border-split:   #f0f0f0
--oa-bg:             #f5f5f5

// 功能色
--oa-success:        #52c41a
--oa-warning:        #faad14
--oa-error:          #ff4d4f

// 圆角
--oa-radius-sm:  4px
--oa-radius-md:  8px
--oa-radius-lg:  12px
--oa-radius-xl:  16px
```

### 4.2 使用规范

- 所有新页面和组件**只使用 `--oa-*` 变量**，禁止硬编码颜色值
- 组件库覆盖（`--ant-color-primary`、`--van-primary-color` 等）统一在 `App.vue` 中对齐到 `--oa-primary`
- 禁止创建第二套变量体系

---

## 5. 状态管理

### 5.1 useUserStore

```typescript
// 存储用户会话信息
interface UserStore {
  token: string | null
  userInfo: {
    username: string
    displayName: string
    role: string          // 'sysadmin' | 'ceo' | 'finance' | ...
    roleName: string
    department: string
  } | null

  setSession(token: string, user: UserInfo): void
  logout(): void
}
```

### 5.2 会话持久化

Token 和 userInfo 持久化到本地存储（`uni.setStorage`），App 启动时自动恢复。Token 失效（401）时自动清除并跳转登录页。

---

## 6. 登录与路由分发

登录后前端根据 `role` 判断跳转目标：

```typescript
const result = await loginWithAccount({ username, password })
userStore.setSession(result.token, result.user)

if (result.user.role === 'sysadmin') {
  uni.redirectTo({ url: '/pages/setup/index' })   // 系统管理控制台
} else {
  uni.redirectTo({ url: '/pages/index/index' })   // 业务工作台
}
```

**禁止设计"角色选择"步骤**。现有 `pages/role/index.vue` 是角色 CRUD 管理页（CEO/财务专用），不是登录跳转目标。

---

## 7. Sysadmin 前端机制

### 7.1 初始化状态检测

Sysadmin 登录后，页面挂载时调用 `GET /setup/status`：

```typescript
// pages/setup/index.vue
onMounted(async () => {
  const status = await request('/setup/status')
  if (!status.initialized) {
    // 强制进入向导模式，不可跳过
    currentStep.value = status.nextStep
    mode.value = 'wizard'
  } else {
    mode.value = 'dashboard'
  }
})
```

### 7.2 页面隔离

- Sysadmin 页面（`pages/setup/`）使用独立的极简 Layout，**不包含** `{LeftNav}` 和 `{TopBar}`
- 路由守卫：非 sysadmin 角色访问 `/pages/setup/*` 时自动重定向到 `/pages/index/index`

---

## 8. 配置驱动渲染

### 8.1 按需动态拉取

```
前端进入页面 → 携带 routeCode 和 X-Client-Type 请求页面配置
→ GET /page-config/{routeCode}
→ Session 内缓存配置
→ 后端推送版本变更时前端清除缓存
```

### 8.2 工作台聚合加载

工作台采用混合加载策略：

```
首屏：GET /workbench/summary
  → 返回：待办数量、薪资状态、在建项目数、近期到期提醒
  → 后端缓存 60 秒

详细列表：进入对应页面时按需懒加载
  → 不在工作台首屏请求，避免阻塞渲染
```
