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
│
├── app/                        # 前端项目 (uni-app + Vue 3)
│   ├── src/                    # 源码目录
│   ├── package.json            # 依赖配置
│   ├── vite.config.ts          # 构建配置
│   └── README.md               # 📖 前端项目说明
│
├── server/                     # 后端项目 (Spring Boot)
│   ├── src/                    # 源码目录
│   ├── pom.xml                 # Maven 配置
│   └── README.md               # 📖 后端项目说明
│
├── docs/                       # 技术文档
│   ├── README.md               # 文档索引
│   ├── ARCHITECTURE.md         # 系统架构设计
│   ├── BACKEND_IMPL.md         # 后端实现细节
│   ├── FRONTEND_IMPL.md        # 前端实现细节
│   ├── TODO.md                 # 开发进度管理
│   ├── CONTEXT.md              # 项目上下文摘要
│   ├── DESIGN.md               # 业务设计文档
│   ├── FRONTEND_IMPL.md        # 前端实现细节
│   ├── BACKEND_IMPL.md         # 后端实现细节
│   └── BUSINESS_REPORT_PRICING_ANALYSIS.md
│
├── test/                       # 测试套件
│   ├── frontend/               # 前端单元测试
│   ├── integration/            # 集成测试
│   ├── run-all.bat             # Windows测试脚本
│   ├── run-all.sh              # Unix测试脚本
│   ├── TEST_DESIGN.md          # 测试策略设计
│   └── README.md               # 📖 测试说明
│
├── tools/                      # 运维工具
│   └── log_analyzer/           # OA日志分析工具
│
├── package.json                # 根目录 workspaces 配置
└── README.md                   # 本文件
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

### 1. 安装依赖

```bash
# 根目录安装所有依赖（使用 Yarn workspaces）
yarn install
```

### 2. 启动开发环境

```bash
# 同时启动后端 + H5 + 小程序
yarn dev
```

### 3. 运行测试

测试作为独立项目运行，不通过 npm 脚本管理：

```bash
# Windows 一键运行所有测试
test\run-all.bat

# Unix/macOS 一键运行所有测试
bash test/run-all.sh
```

详见 [test/README.md](./test/README.md)

### 4. 构建生产包

```bash
# 构建所有（后端 + H5 + 小程序）
yarn build

# 启动生产服务
yarn start
```

## 子项目说明

| 子项目 | 路径 | 说明 |
|--------|------|------|
| **前端** | [`app/`](./app/) | uni-app 跨端应用，支持 H5 和微信小程序，详见 [app/README.md](./app/README.md) |
| **后端** | [`server/`](./server/) | Spring Boot REST API 服务，详见 [server/README.md](./server/README.md) |
| **测试** | [`test/`](./test/) | 前端单元测试、集成测试、测试脚本，详见 [test/README.md](./test/README.md) |
| **文档** | [`docs/`](./docs/) | 技术文档和业务设计文档，详见 [docs/README.md](./docs/README.md) |
| **工具** | [`tools/`](./tools/) | 运维工具和辅助脚本 |

## 文档导航

### 开发必读

| 文档 | 说明 | 读者 |
|------|------|------|
| [docs/TODO.md](./docs/TODO.md) | **开发进度管理入口**，M0-M12 任务列表 | 所有开发者 |
| [docs/CONTEXT.md](./docs/CONTEXT.md) | 项目上下文、核心设计决策 | AI 助手、新成员 |
| [docs/DESIGN.md](./docs/DESIGN.md) | 业务设计：角色/权限/审批流/薪资 | 产品经理、开发者 |

### 技术文档

| 文档 | 说明 |
|------|------|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 系统架构设计 |
| [docs/BACKEND_IMPL.md](./docs/BACKEND_IMPL.md) | 后端实现细节 |
| [docs/FRONTEND_IMPL.md](./docs/FRONTEND_IMPL.md) | 前端实现细节 |
| [test/TEST_DESIGN.md](./test/TEST_DESIGN.md) | 测试策略设计 |

## 工作流规范

1. **开发前**：查看 [docs/TODO.md](./docs/TODO.md) 确认当前任务
2. **开发中**：遵循 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) 的技术规范
3. **提交前**：运行 `bash test/run-all.sh` 确保测试通过

## 许可证

私有项目，未经授权不得使用。
