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
├── app/                        # 前端项目 (uni-app + Vue 3)
│   ├── src/
│   │   ├── adapters/           # 平台适配层（JSON配置 + 组件映射）
│   │   ├── components/         # 自定义组件
│   │   │   ├── cross-platform/ # 双端对齐组件
│   │   │   └── customized/     # 定制化组件
│   │   ├── pages/              # 页面
│   │   ├── styles/             # 统一样式
│   │   ├── stores/             # Pinia 状态管理
│   │   └── utils/              # 工具函数
│   ├── scripts/                # 脚本工具
│   └── package.json
│
├── server/                     # 后端项目 (Spring Boot)
│   ├── src/
│   │   ├── controller/         # 控制器（HTTP 入口层）
│   │   ├── service/            # 服务层（业务逻辑）
│   │   ├── entity/             # 实体（MyBatis-Plus）
│   │   ├── mapper/             # MyBatis 映射
│   │   ├── dto/                # 数据传输对象
│   │   ├── security/           # 安全相关（JWT、过滤器）
│   │   └── resources/          # 配置文件、SQL脚本
│   └── pom.xml
│
├── docs/                       # 技术文档
│   ├── ARCHITECTURE.md         # 系统架构设计
│   ├── BACKEND_IMPL.md         # 后端实现细节
│   ├── FRONTEND_IMPL.md        # 前端实现细节
│   ├── TODO.md                 # 开发进度管理（必读）
│   ├── CONTEXT.md              # AI上下文摘要
│   ├── DESIGN.md               # 业务设计文档
│   └── BUSINESS_REPORT_PRICING_ANALYSIS.md  # 商业报告
│
├── test/                       # 测试目录
│   ├── frontend/               # 前端单元测试
│   ├── integration/            # 集成测试
│   ├── run-all.bat             # Windows测试脚本
│   ├── run-all.sh              # Unix测试脚本
│   └── TEST_DESIGN.md          # 测试设计文档
│
├── tools/                      # 运维工具
│   └── log_analyzer/           # OA日志分析工具（Python）
│
└── package.json                # 根目录 workspaces 配置
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

## 快速开始

### 安装依赖

```bash
# 根目录安装所有依赖（使用 workspaces）
yarn install
```

### 开发模式

```bash
# 启动前端开发服务器（H5）
yarn dev:web

# 启动微信小程序开发
yarn dev:mp-weixin

# 启动后端服务
yarn dev:backend
```

### 构建

```bash
# 构建前端（H5）
yarn build:web

# 构建前端（微信小程序）
yarn build:mp-weixin

# 构建后端
yarn build:backend
```

### 测试

```bash
# 运行所有测试
yarn test

# 单独运行前端测试
yarn test:frontend

# 单独运行后端测试
yarn test:backend

# 运行集成测试
yarn test:integration
```

### 数据库初始化

```bash
# 初始化数据库（需要 PostgreSQL）
yarn db:init
```

## 文档导航

| 文档 | 说明 |
|------|------|
| [docs/TODO.md](./docs/TODO.md) | **开发进度管理入口**，M0-M12 任务列表 |
| [docs/CONTEXT.md](./docs/CONTEXT.md) | 项目上下文摘要，AI 和新成员必读 |
| [docs/DESIGN.md](./docs/DESIGN.md) | 业务设计文档，角色/权限/审批流/薪资规则 |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 技术架构设计 |
| [docs/BACKEND_IMPL.md](./docs/BACKEND_IMPL.md) | 后端实现细节 |
| [docs/FRONTEND_IMPL.md](./docs/FRONTEND_IMPL.md) | 前端实现细节 |

## 工作流规范

1. **开发前**：查看 [docs/TODO.md](./docs/TODO.md) 确认当前任务
2. **开发中**：遵循 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) 的技术规范
3. **提交前**：运行 `yarn test` 确保测试通过

## 许可证

私有项目，未经授权不得使用。
