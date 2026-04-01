# 众维 OA 工作台

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
/home/tzw/OA/
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
│   └── backend/                # 后端 (Spring Boot)
│       └── src/
│           ├── controller/     # 控制器
│           ├── service/        # 服务层
│           ├── entity/         # 实体
│           └── mapper/         # MyBatis 映射
│
├── documentation/              # 项目文档
│   ├── biz/                    # 业务文档
│   │   └── PROJECT.md          # 项目介绍
│   ├── dev/                    # 开发文档
│   │   ├── ARCHITECTURE.md     # 技术架构
│   │   ├── TEST_DESIGN.md      # 测试设计
│   │   └── TODO.md             # 开发进度管理
│   ├── designs/                # UI 设计稿
│   └── README.md               # 文档索引
│
└── test/                       # 测试相关
    ├── reports/                # 测试报告
    └── integration/            # 集成测试
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

## 快速启动

```bash
# 前端
cd app/frontend
yarn install
yarn dev:web              # Web 本地调试
yarn dev:mp-weixin        # 小程序开发模式

# 后端
cd app/backend
mvn spring-boot:run
```

## 测试

```bash
# 前端
cd app/frontend
yarn type-check           # 类型检查
yarn test:web             # 单元测试

# 后端
cd app/backend
mvn test                  # 单元测试
```

## 核心功能模块

- **工作台** - 数据概览、快捷入口、待办事项
- **考勤管理** - 请假/加班申请、审批流程（初审+终审）
- **薪资管理** - 工资条查看、确认、异议、结算
- **项目管理** - 项目列表、施工日志、阶段审批
- **员工管理** - 员工信息、组织架构、权限设置

## 角色权限

| 角色 | 核心权限 |
|------|---------|
| 员工 | 发起请假/加班、查看本人工资条 |
| 劳工 | 在员工基础上，提交施工日志、发起工伤补偿 |
| 项目经理 | 处理项目范围内初审、维护施工日志模板 |
| 财务 | 维护人员与薪资配置、执行结算、导入通讯录 |
| CEO | 管理全局配置、终审审批、配置角色权限 |

## 文档索引

所有文档集中在 `documentation/` 目录，按受众分类：

| 文档 | 路径 | 说明 |
|------|------|------|
| 文档索引 | `documentation/README.md` | 文档中心入口 |
| 项目介绍 | `documentation/biz/PROJECT.md` | 业务背景、目标 |
| 技术架构 | `documentation/dev/ARCHITECTURE.md` | 架构设计、接口规范 |
| 测试设计 | `documentation/dev/TEST_DESIGN.md` | 测试策略、用例 |
| **开发进度** | `documentation/dev/TODO.md` | **前后端进度管理** |

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
