# 博渊 OA 前端

企业微信工作台小程序 + Web 管理后台的前端应用。面向建筑与工程企业的内部办公协同系统。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| uni-app | 3.0 | 跨平台应用框架 |
| Vue | 3.5 | 前端框架 |
| TypeScript | 5.4 | 开发语言 |
| Vite | 5.2 | 构建工具 |
| Pinia | 2.1 | 状态管理 |
| Ant Design Vue | 4.2 | H5 组件库 |
| Vant | 4.9 | 小程序组件库 |

## 目录结构

```
app/
├── src/
│   ├── adapters/           # 平台适配层（JSON配置 + 组件映射）
│   │   ├── components/     # 跨平台组件（Col/Row）
│   │   └── config/         # 组件映射配置
│   │
│   ├── components/         # 自定义组件
│   │   ├── cross-platform/ # 双端对齐组件
│   │   │   ├── FileUpload/
│   │   │   ├── SignatureCanvas/
│   │   │   ├── Steps/
│   │   │   ├── Table/
│   │   │   └── Timeline/
│   │   └── customized/     # 定制化组件
│   │       ├── ApprovalTimeline.vue
│   │       ├── ChangePhoneModal.vue
│   │       ├── DevLoginPanel.vue
│   │       ├── ModuleCard.vue
│   │       ├── Permission.vue
│   │       ├── StatCard.vue
│   │       ├── UserAvatar.vue
│   │       └── UserInfo.vue
│   │
│   ├── composables/        # 组合式函数
│   │   └── useComponent.ts # 跨端组件加载器
│   │
│   ├── layouts/            # 布局组件
│   │   └── AppShell.vue    # 应用外壳
│   │
│   ├── pages/              # 页面
│   │   ├── index/          # 首页工作台
│   │   ├── login/          # 登录页
│   │   ├── employees/      # 员工管理
│   │   ├── org/            # 组织架构
│   │   ├── positions/      # 岗位管理
│   │   ├── projects/       # 项目管理
│   │   ├── attendance/     # 考勤管理
│   │   ├── payroll/        # 薪资管理
│   │   ├── role/           # 角色权限
│   │   ├── todo/           # 待办事项
│   │   └── config/         # 系统配置
│   │
│   ├── stores/             # Pinia 状态管理
│   │   ├── index.ts
│   │   └── user.ts         # 用户状态（token + 员工信息）
│   │
│   ├── styles/             # 统一样式
│   │   └── variables.scss  # SCSS 变量
│   │
│   └── utils/              # 工具函数
│       ├── http.ts         # HTTP 请求（唯一出口）
│       ├── access.ts       # 权限相关
│       ├── device.ts       # 设备检测
│       ├── forms.ts        # 表单工具
│       ├── org.ts          # 组织架构工具
│       └── index.ts
│
├── scripts/                # 脚本工具
│   └── screenshot_pages.cjs
│
├── index.html              # 入口 HTML
├── package.json            # 依赖配置
├── tsconfig.json           # TypeScript 配置
├── vite.config.ts          # Vite 配置
├── vitest.config.ts        # 单元测试配置
└── vitest.integration.config.ts  # 集成测试配置
```

## 快速开始

```bash
# 安装依赖（在根目录执行）
yarn install

# 启动开发环境（后端 + H5 + 小程序，在根目录执行）
yarn dev

# 仅启动 H5 前端（需后端已在 8080 运行）
yarn dev:h5

# 仅启动小程序前端（需后端已在 8080 运行）
yarn dev:mp

# 构建生产包（在根目录执行）
yarn build
```

### 运行测试

```bash
# 前端单元测试（在 app/ 目录执行）
../node_modules/.bin/vitest run

# 前后端集成测试（需后端服务在 localhost:8080，在 app/ 目录执行）
../node_modules/.bin/vitest run --config vitest.integration.config.ts
```

## 开发规范

### 跨端组件使用

页面必须通过 `useComponent()` 加载跨端组件，禁止硬编码组件库名称：

```typescript
import { useComponent } from '@/composables/useComponent'

const { Button, Table } = useComponent()
```

### HTTP 请求

所有 HTTP 请求统一通过 `src/utils/http.ts` 导出：

```typescript
import http from '@/utils/http'

const { data } = await http.get('/api/employees')
```

### 样式变量

使用 `variables.scss` 中定义的变量：

```scss
@import '@/styles/variables.scss';

.my-class {
  color: $primary-color;
}
```

## 更多文档

- [前端实现细节](../docs/FRONTEND_IMPL.md)
- [适配层设计](../docs/FRONTEND_IMPL.md#适配层)
- [业务设计文档](../docs/DESIGN.md)
