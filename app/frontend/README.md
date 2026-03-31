# OA 前端项目

企业 OA 系统前端，基于 uni-app 的跨端解决方案，一套代码同时支持 H5 和微信小程序。

## 核心架构原则

> **JSON 映射是唯一的组件来源**

所有组件（无论是组件库还是自定义组件）必须通过 `adapters/config/components.json` 注册。外部代码**不直接导入**任何组件，统一通过适配层获取。

```typescript
// ✅ 正确：通过适配层获取组件
import { getComponent } from '@/adapters'
const Button = await getComponent('Button')

// ❌ 错误：直接导入组件库（违反架构原则）
import { Button } from 'ant-design-vue'
```

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| uni-app | 3.0 | 跨端框架，支持 H5/小程序/App |
| Vue | 3.5 | 前端框架，Composition API |
| TypeScript | 5.4 | 类型安全 |
| Vite | 5.2 | 构建工具 |
| Pinia | 2.1 | 状态管理 |
| Ant Design Vue | 4.2 | H5 端底层组件库 |
| Vant | 4.9 | 小程序端底层组件库 |
| Vitest | 1.5 | 单元测试 |
| SCSS | - | 样式预处理器 |

## 目录结构

```
src/
├── adapters/                # 平台适配层（唯一组件来源）
│   ├── config/
│   │   ├── components.json  # 组件映射配置（核心）
│   │   └── props-map.json   # 属性映射配置
│   ├── resolver.ts          # 配置解析器
│   └── index.ts             # 统一导出
│
├── components/              # 自定义组件（跨平台封装）
│   ├── Card/                # 卡片组件
│   ├── Timeline/            # 时间轴组件
│   ├── Table/               # 表格组件
│   ├── StatCard/            # 统计卡片
│   └── ModuleCard/          # 模块入口卡片
│
├── composables/             # 组合式函数
│   └── useComponent.ts      # 组件获取组合式函数
│
├── styles/                  # 统一样式
│   ├── variables.scss       # SCSS 变量
│   ├── antd-override.scss   # Ant Design 样式覆盖
│   └── vant-override.scss   # Vant 样式覆盖
│
├── pages/                   # 页面
│   ├── index/               # 工作台首页
│   ├── login/               # 登录页
│   ├── role/                # 角色选择页
│   ├── attendance/          # 考勤管理
│   ├── payroll/             # 薪资管理
│   ├── projects/            # 项目管理
│   └── employees/           # 员工管理
│
├── stores/                  # Pinia 状态管理
│   ├── index.ts             # 状态管理入口
│   └── user.ts              # 用户状态管理
│
├── utils/                   # 工具函数
│   ├── access.ts            # 认证与权限工具
│   ├── device.ts            # 设备尺寸检测
│   ├── forms.ts             # 表单工具
│   ├── org.ts               # 组织架构工具
│   └── index.ts             # 工具函数入口
│
├── App.vue                  # 应用根组件
├── main.ts                  # 应用入口
├── pages.json               # 页面路由配置
└── manifest.json            # 应用配置
```

## 架构设计

### 分层职责

```
┌─────────────────────────────────────────────────────────┐
│  外部代码（页面/组件）                                     │
│  ─────────────────────                                   │
│  import { getComponent } from '@/adapters'               │
│  const Button = await getComponent('Button')             │
│                                                          │
│  💡 只关心：获取组件并使用                                │
│  💡 不关心：Button 是 AntD、Vant 还是自定义组件           │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  适配层（Adapters）                                       │
│  ─────────────────                                       │
│  1. 读取 components.json 获取配置                        │
│  2. 根据平台（H5/MP）确定 source                          │
│  3. 动态导入并返回组件                                    │
│                                                          │
│  💡 只关心：按配置返回正确的组件                          │
│  💡 不关心：组件具体是什么、怎么实现                      │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  JSON 映射（唯一来源）                                    │
│  ─────────────────────                                   │
│  {                                                       │
│    "Button": {                                           │
│      "h5": { "source": "ant-design-vue", "name": "Button" }, │
│      "mp": { "source": "vant", "name": "Button" }          │
│    },                                                    │
│    "Timeline": {                                         │
│      "h5": { "source": "ant-design-vue", "name": "Timeline" }, │
│      "mp": { "source": "@/components/Timeline", "name": "Timeline" } │
│    }                                                     │
│  }                                                       │
│                                                          │
│  💡 唯一职责：记录什么组件在什么平台对应什么底层组件       │
└─────────────────────────────────────────────────────────┘
```

### 使用方式

#### 1. 基础使用（异步获取）

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getComponent, mapProps } from '@/adapters'

const Button = ref(null)
const Input = ref(null)

onMounted(async () => {
  Button.value = await getComponent('Button')
  Input.value = await getComponent('Input')
})

const handleClick = () => {
  console.log('clicked')
}
</script>

<template>
  <component :is="Input" placeholder="请输入" />
  <component :is="Button" type="primary" @click="handleClick">
    提交
  </component>
</template>
```

#### 2. 使用组合式函数（推荐）

```vue
<script setup lang="ts">
import { useComponent } from '@/composables/useComponent'

const { Button, Input, Card } = useComponent(['Button', 'Input', 'Card'])
</script>

<template>
  <component :is="Card" title="表单">
    <component :is="Input" placeholder="请输入" />
    <component :is="Button" type="primary">提交</component>
  </component>
</template>
```

#### 3. Props 映射

当同一 props 在不同平台需要不同值时，使用 `mapProps`：

```typescript
import { getComponent, mapProps } from '@/adapters'

const Button = await getComponent('Button')

// 统一写法
const buttonProps = mapProps('Button', {
  type: 'primary',
  size: 'large'
})

// H5 结果: { type: 'primary', size: 'large' }
// MP 结果: { type: 'primary', size: 'large' }（自动转换）
```

### 添加新组件流程

1. **在 `components.json` 中注册映射**

```json
{
  "MyComponent": {
    "h5": { "source": "ant-design-vue", "name": "MyComponent" },
    "mp": { "source": "@/components/MyComponent", "name": "MyComponent" }
  }
}
```

2. **（可选）在 `props-map.json` 中添加属性映射**

```json
{
  "MyComponent": {
    "h5": { "type": "type", "size": "size" },
    "mp": { "type": "type", "size": "size" }
  }
}
```

3. **在代码中使用**

```typescript
const MyComponent = await getComponent('MyComponent')
```

## 样式系统

项目使用 **SCSS 变量** 实现主题统一管理：

```scss
// styles/variables.scss
$oa-primary: #003466;
$oa-success: #52c41a;
$oa-warning: #faad14;
$oa-error: #f5222d;

// 文字色
$oa-text-primary: rgba(0, 0, 0, 0.85);
$oa-text-secondary: rgba(0, 0, 0, 0.65);

// 圆角
$oa-radius-sm: 4px;
$oa-radius-md: 8px;
$oa-radius-lg: 12px;

// 同时导出 CSS 变量
:root {
  --oa-primary: #{$oa-primary};
  --oa-success: #{$oa-success};
  // ...
}
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
| 类/组件 | `PascalCase` | `UserStore`, `StatCard` |
| 常量 | `UPPER_SNAKE_CASE` | `API_BASE_URL` |
| 文件/目录 | `snake_case` | `user_store.ts`, `components/` |

### 组件获取规范

```typescript
// ✅ 正确：通过适配层获取
import { getComponent } from '@/adapters'
const Button = await getComponent('Button')

// ✅ 正确：使用组合式函数批量获取
import { useComponent } from '@/composables/useComponent'
const { Button, Input } = useComponent(['Button', 'Input'])

// ❌ 错误：直接导入组件库
import { Button } from 'ant-design-vue'

// ❌ 错误：直接导入自定义组件
import Button from '@/components/Button.vue'
```

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
yarn vitest run src/components/Button.spec.ts
```

测试文件命名：`*.spec.ts` 或 `*.test.ts`

## 注意事项

1. **唯一来源原则**：所有组件必须通过 `getComponent()` 获取，禁止直接导入
2. **配置优先**：新增组件先在 `components.json` 中注册映射
3. **平台差异**：通过 `props-map.json` 解决属性名/值差异
4. **存储兼容**：使用 uni-app 存储 API (`uni.getStorageSync`)，H5 环境自动降级到 localStorage
