# OA 前端项目

企业 OA 系统前端，基于 uni-app 的跨端解决方案，一套代码同时支持 H5 和微信小程序。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| uni-app | 3.0 | 跨端框架，支持 H5/小程序/App |
| Vue | 3.5 | 前端框架，Composition API |
| TypeScript | 5.4 | 类型安全 |
| Vite | 5.2 | 构建工具 |
| Pinia | 2.1 | 状态管理 |
| Ant Design Vue | 4.2 | H5 端 UI 组件库 |
| Vant | 4.9 | 小程序端 UI 组件库 |
| Vitest | 1.5 | 单元测试 |
| SCSS | - | 样式预处理器 |

## 目录结构

```
src/
├── components/
│   ├── ui-kit/              # 跨端统一组件库 (OA UI Kit)
│   │   ├── components/      # 基础组件 (OaButton, OaInput 等)
│   │   ├── adapters/        # 平台适配器 (Ant Design / Vant 属性映射)
│   │   ├── styles/          # 主题样式变量
│   │   └── types/           # 组件类型定义
│   └── ui/                  # 业务 UI 组件
│       ├── Icon.vue         # 图标组件
│       ├── Badge.vue        # 标签组件
│       ├── Button.vue       # 自定义按钮
│       ├── Empty.vue        # 空状态组件
│       ├── Panel.vue        # 面板组件
│       ├── ListItem.vue     # 列表项组件
│       ├── StatCard.vue     # 统计卡片组件
│       ├── ModuleCard.vue   # 模块卡片组件
│       └── Timeline.vue     # 时间线组件
├── pages/                   # 页面
│   ├── index/               # 工作台首页
│   ├── login/               # 登录页
│   ├── role/                # 角色选择页
│   ├── attendance/          # 考勤管理
│   ├── payroll/             # 薪资管理
│   ├── projects/            # 项目管理
│   └── employees/           # 员工管理
├── stores/                  # Pinia 状态管理
│   ├── index.ts             # 状态管理入口
│   └── user.ts              # 用户状态管理
├── utils/                   # 工具函数
│   ├── access.ts            # 认证与权限工具
│   ├── device.ts            # 设备尺寸检测
│   ├── forms.ts             # 表单工具
│   ├── org.ts               # 组织架构工具
│   └── index.ts             # 工具函数入口
├── App.vue                  # 应用根组件
├── main.ts                  # 应用入口
├── pages.json               # 页面路由配置
└── manifest.json            # 应用配置
```

## 跨端架构设计

### OA UI Kit 组件封装层

项目采用**统一组件封装策略**，通过 uni-app 条件编译实现 H5 和小程序的自动切换：

```
┌─────────────────────────────────────────────────────────┐
│                    业务页面代码                          │
│              (使用 OaButton, OaInput 等)                 │
└─────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
     ┌─────▼─────┐                   ┌─────▼─────┐
     │   #ifdef H5  │                   │ #ifdef MP   │
     │              │                   │             │
     │ Ant Design   │                   │    Vant     │
     │    Vue       │                   │             │
     └──────────────┘                   └─────────────┘
```

**示例：**
```vue
<template>
  <!-- 这段代码在 H5 渲染为 a-button，在小程序渲染为 van-button -->
  <oa-button type="primary" @click="handleClick">
    确认
  </oa-button>
</template>

<script setup lang="ts">
import { OaButton } from '@/components/ui-kit'
</script>
```

### 适配器层设计

适配器层负责平台特定的属性映射，与组件解耦：

```typescript
// adapters/button.ts
export function useAntButtonAdapter(props: ButtonProps) {
  // H5 端属性映射
  const adaptedType = computed(() => /* ... */)
  return { adaptedType }
}

export function useVantButtonAdapter(props: ButtonProps) {
  // 小程序端属性映射
  const vantType = computed(() => /* ... */)
  return { vantType }
}
```

组件中使用：
```vue
<script setup>
import { useAntButtonAdapter, useVantButtonAdapter } from '../../adapters/button'
const { adaptedType } = useAntButtonAdapter(props)
const { vantType } = useVantButtonAdapter(props)
</script>
```

### 样式系统

项目使用 **CSS 变量** 实现主题统一管理：

```scss
// 主色调
--oa-primary: #1890ff;
--oa-success: #52c41a;
--oa-warning: #faad14;
--oa-error: #f5222d;

// 文字色
--oa-text: rgba(0, 0, 0, 0.85);
--oa-text-secondary: rgba(0, 0, 0, 0.65);

// 圆角
--oa-border-radius-sm: 2px;
--oa-border-radius-md: 4px;
--oa-border-radius-lg: 8px;
```

## 启动命令

```bash
# 安装依赖
yarn install

# Web 端开发
yarn dev:web

# 微信小程序开发
yarn dev:mp-weixin

# 构建 Web 端
yarn build:web

# 构建微信小程序
yarn build:mp-weixin

# 运行单元测试
yarn test:web

# TypeScript 类型检查
yarn type-check
```

## 开发规范

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量 | `snake_case` | `user_name`, `is_loading` |
| 函数 | `camelCase` | `getUserInfo`, `handleSubmit` |
| 类/组件 | `PascalCase` | `UserStore`, `OaButton` |
| 常量 | `UPPER_SNAKE_CASE` | `API_BASE_URL` |
| 文件/目录 | `snake_case` | `user_store.ts`, `components/` |

### 组件开发规范

1. **优先使用 OA UI Kit**：业务代码应使用 `OaButton`、`OaInput` 等封装组件，而非直接引用 Ant Design 或 Vant
2. **Props 类型定义**：所有组件必须定义 Props 接口
3. **事件命名**：使用 `kebab-case`，如 `@update:modelValue`
4. **样式隔离**：使用 `scoped` 或 CSS Modules

### 状态管理规范

```typescript
// 使用 Composition API 风格
export const useUserStore = defineStore('user', () => {
  // State
  const token = ref('')

  // Getters
  const isLoggedIn = computed(() => Boolean(token.value))

  // Actions
  const setSession = (t: string) => { token.value = t }

  return { token, isLoggedIn, setSession }
})
```

## 测试

项目使用 Vitest + @vue/test-utils 进行单元测试：

```bash
# 运行所有测试
yarn test:web

# 运行特定文件
yarn vitest run src/components/ui/Button.spec.ts
```

测试文件命名：`*.spec.ts` 或 `*.test.ts`

## 注意事项

1. **条件编译**：跨端差异使用 `/* #ifdef H5 */` 或 `/* #ifdef MP-WEIXIN */` 处理
2. **API 降级**：网络请求优先调用后端 API，失败时自动降级到本地 Mock 数据
3. **存储兼容**：使用 uni-app 存储 API (`uni.getStorageSync`)，H5 环境自动降级到 localStorage
