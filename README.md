# 博渊 OA 工作台

企业微信工作台小程序 + Web 管理后台，面向建筑与工程企业的内部办公协同系统。

## 项目架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端层 (Frontend)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  uni-app + Vue 3 + TypeScript                           │   │
│  ├── H5 端: Ant Design Vue                                │   │
│  └── 小程序: Vant Weapp                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         后端层 (Backend)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Spring Boot + MyBatis-Plus + PostgreSQL                │   │
│  │  ├── JWT 认证                                           │   │
│  │  └── RBAC 权限控制                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 目录结构

```
BOYUAN OA/
├── app/                        # 应用代码
│   ├── frontend/               # 前端 (uni-app + Vue 3)
│   │   └── src/
│   │       ├── adapters/       # 平台适配层（JSON配置 + 组件映射）
│   │       ├── components/     # 自定义组件
│   │       │   ├── cross-platform/   # 双端对齐组件
│   │       │   └── customized/       # 定制化组件
│   │       ├── pages/          # 页面
│   │       ├── styles/         # 统一样式
│   │       ├── stores/         # Pinia 状态管理
│   │       └── utils/          # 工具函数
│   │
│   ├── backend/                # 后端 (Spring Boot)
│   │   └── src/
│   │       ├── controller/     # 控制器（HTTP 入口层）
│   │       ├── service/        # 服务层（业务逻辑）
│   │       ├── engine/         # 引擎层（审批流/薪资/签名）
│   │       ├── entity/         # 实体（MyBatis-Plus）
│   │       ├── mapper/         # MyBatis 映射
│   │       ├── aspect/         # AOP（OperationLog 自动记录）
│   │       ├── filter/         # 过滤器（TraceIdFilter）
│   │       └── event/          # 跨模块 ApplicationEvent 定义
│   │
│   └── tests/                  # E2E 测试（Playwright）
│       ├── specs/              # 按角色组织的测试用例
│       └── pages/              # Page Object 封装
│
├── design.md                   # 建筑工程版完整业务设计（角色/权限/审批流/薪资）
├── context.md                  # 历史决策、禁止事项（AI 接手时必读）
│
├── tech_doc/                   # 技术设计文档
│   ├── architecture.md         # 技术架构（设计原则 + 系统架构图 + 模块解耦 + 日志系统）
│   ├── todo.md                 # 唯一开发进度管理入口（按模块顺序）
│   ├── backend_impl.md         # 后端实现细节
│   └── frontend_impl.md        # 前端实现细节
│
├── tools/                      # 运维工具（独立子项目）
│   └── log_analyzer/           # OA 日志分析 GUI 工具（Python）
│       ├── analyzer.py         # 主程序，需 OA_DEPLOY_KEY 认证
│       ├── requirements.txt    # 依赖（tkinterdnd2 可选）
│       ├── .env.example        # 环境变量模板
│       └── README.md           # 使用说明
│
└── test/                       # 测试文档、工具和报告
    ├── test_design.md          # 测试策略、自动化测试系统设计
    └── reports/                # 测试报告
```

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | uni-app + Vue 3 | 3.0 |
| 前端语言 | TypeScript | 5.4 |
| 构建工具 | Vite | 5.2 |
| 状态管理 | Pinia | 2.1 |
| H5 组件库 | Ant Design Vue | 4.2 |
| 小程序组件库 | Vant | 4.9 |
| 后端框架 | Spring Boot | 3.x |
| ORM | MyBatis-Plus | 3.5 |
| 数据库 | PostgreSQL | 15 |

## npm 脚本

所有脚本在 `app/` 目录下执行（`cd app && npm run <script>`）。

### 开发

| 脚本 | 说明 |
|------|------|
| `npm run dev` | **并行启动 H5 前端 + 后端**，单命令完成本地开发环境启动 |
| `npm run dev:mp` | 单独启动小程序编译（监听模式），配合微信开发者工具使用 |
| `npm run dev:backend` | 单独启动后端（Spring Boot dev profile） |

```bash
cd app
npm run dev               # H5 前端 + 后端同时启动
npm run dev:mp            # 小程序编译，微信开发者工具打开 dist/dev/mp-weixin
```

### 构建（生产）

| 脚本 | 说明 |
|------|------|
| `npm run build` | **完整生产构建**：类型检查 → H5 → 小程序（串行，任一失败终止） |
| `npm run build:h5` | 仅构建 H5，代码压缩混淆、剔除所有 console/debug/dev 工具 |
| `npm run build:mp` | 仅构建小程序，同样剔除 dev 工具 |
| `npm run build:backend` | 后端打包（`mvn clean package`） |

```bash
cd app
npm run build             # 完整生产构建（推荐发版前使用）
npm run build:h5          # 仅 H5
npm run build:mp          # 仅小程序
```

> **生产构建保证**：`npm run build:h5` 启用 Terser 压缩混淆，自动 `drop_console`、`drop_debugger`，不输出 source map。Dev 快捷工具（`DevToolbar`）通过 `import.meta.env.DEV` 守门，production build 时被 Rollup dead-code-elimination 完整剔除。

### 类型检查

| 脚本 | 说明 |
|------|------|
| `npm run type-check` | TypeScript 类型检查（`vue-tsc --noEmit`） |

```bash
cd app
npm run type-check        # 类型检查，CI 失败时退出码非零
```

### 部署

| 脚本 | 说明 |
|------|------|
| `npm run deploy:h5` | 构建 H5 后通过 rsync 推送到服务器 |

```bash
# 配置环境变量（复制 app/.env.example 为 app/.env）
OA_DEPLOY_HOST=user@your-server
OA_DEPLOY_PATH=/var/www/oa-h5

cd app
npm run deploy:h5         # build:h5 → rsync 推送
```

### 安装依赖

```bash
cd app
npm run install:all       # 安装前端依赖
```

### 后端单独操作

```bash
cd app/backend
mvn test                  # 后端单元测试
mvn spring-boot:run       # 直接启动（等同于 npm run dev:backend）
```

## 核心功能模块

| 模块 | 说明 | 可差分部署 |
|------|------|-----------|
| 工作台 & 通知 | 数据概览、待办事项、系统通知 | 否（核心） |
| 审批流引擎 | 通用审批流（支持动态路由、skipCondition） | 否（核心） |
| 考勤管理 | 请假/加班申请、自补加班，走审批流 | `modules.attendance` |
| 施工 & 工伤 | 施工日志填报与审批、工伤补偿申请与理赔 | `modules.construction` |
| 薪资管理 | 结算周期、工资条确认、电子签名存证、更正 | `modules.payroll` |
| 项目管理 | 里程碑、进度、汇总报告、Dashboard | `modules.project` |
| 数据生命周期 | 保留策略、到期提醒、清理任务、数据导出 | `modules.data_lifecycle` |
| 员工 & 组织 | 员工档案、部门树、组织架构、岗位薪资配置 | 否（核心） |

## 文档索引

| 文档 | 路径 | 说明 |
|------|------|------|
| 历史决策 | `context.md` | 禁止事项、设计决策（每次新会话必读） |
| 业务设计 | `design.md` | 完整业务规则：角色/权限/审批流/薪资/数据保留 |
| 技术架构 | `tech_doc/architecture.md` | 设计原则、系统架构图、模块解耦、日志系统、引擎设计、API 规范 |
| **开发进度** | `tech_doc/todo.md` | **唯一进度入口，按模块顺序组织** |
| 后端实现 | `tech_doc/backend_impl.md` | 后端包结构、MyBatis-Plus 约定、JWT、引擎实现模式 |
| 前端实现 | `tech_doc/frontend_impl.md` | 适配层、useComponent、HTTP 层、CSS 变量 |
| 测试设计 | `test/test_design.md` | 测试策略、自动化测试系统设计、E2E 用例 |
| 运维工具 | `tools/log_analyzer/README.md` | 日志分析 GUI 工具使用说明 |

## 前端组件开发原则

### 组件分类

| 目录 | 用途 | 示例 |
|------|------|------|
| `adapters/` | 平台适配 | 读取 JSON 配置返回对应平台组件 |
| `components/cross-platform/` | 双端对齐 | Timeline |
| `components/customized/` | 定制扩展 | StatCard, ModuleCard, UserInfo, UserAvatar, Permission |

### 核心原则

1. **优先使用组件库** - Ant Design Vue / Vant 直接导入
2. **禁止无意义封装** - 不创建只是转发 props 的中间层
3. **JSON 配置驱动** - 平台差异通过 JSON 配置解决
4. **组件必要性审查** - 每个组件创建前自问：是否必要？能否复用？
