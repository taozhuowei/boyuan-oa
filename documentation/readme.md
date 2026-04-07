# 博渊 OA 平台 — 文档中心

> **AI / 新开发者导航入口。** 本文件告诉你该读哪个文档、用来做什么。读完本文件，你已经知道去哪里找任何信息了。

---

## 快速上手路径（按顺序读）

```
1. 本文件（readme.md）         → 知道文档在哪、分别是干什么的
2. context/context.md         → 了解项目当前状态、历史设计决策、禁止事项
3. tech/todo.md               → 知道当前该做什么，检查点在哪里
4. 按任务需要，查阅下方具体文档
```

**不要跳过前两步。** 许多重要决策（如"Employee 即用户，不存在独立 User 实体"）只记录在 `context.md`，不在代码里。

---

## 目录结构

```
documentation/
├── readme.md                         ← 本文件，导航入口
│
├── context/                          ← AI 上下文存档（历史会话关键信息）
│   └── context.md                   ← 当前最新上下文摘要
│
├── tech/                             ← 技术文档（架构/实现/进度/测试）
│   ├── architecture.md              ← 技术架构：设计原则、系统架构图、引擎设计、模块解耦、日志系统、实体模型、API 规范
│   ├── todo.md                      ← 唯一进度管理入口（按模块顺序 M0–M11）
│   ├── test_design.md               ← 测试策略、自动化测试系统设计、E2E 用例
│   ├── frontend_impl.md             ← 前端实现细节（适配层/HTTP层/状态管理）
│   └── backend_impl.md              ← 后端实现细节（包结构/引擎实现/定时任务）
│
└── design.md                         ← 建筑工程版业务设计（角色/权限/审批流/薪资/数据保留/组织预置）

（注）运维工具文档位于项目根目录 tools/log_analyzer/README.md
```

---

## context/ — AI 上下文存档

**用途**：记录无法从代码和 git history 推断的信息——历史设计决策、被推翻的方案、特殊约束、禁止事项。AI 接手任务时必读。

| 文档 | 内容 | 何时读 |
|------|------|--------|
| [context.md](./context/context.md) | 项目状态快照、核心设计决策、禁止事项、前后端文件地图、下一步任务 | **每次新会话开始时** |

> 维护规则：每次完成一个重要设计阶段后，更新 `context.md` 的"当前项目状态"和"下一个可执行任务"两节。不需要每次对话都更新——只在决策发生变化时更新。

---

## tech/ — 技术文档

**定位**：技术架构、实现约定、开发进度、测试设计。

| 文档 | 内容摘要 | 何时读 |
|------|---------|--------|
| [architecture.md](./tech/architecture.md) | 设计原则、系统架构图（预置层/核心层/集成层/业务模块层）、引擎设计、实体字段表、API 规范、文件存储、签名架构、Excel 导入、模块解耦架构、日志系统、可配置边界、多企业预置方案 | 后端开发、理解数据模型、设计接口 |
| [backend_impl.md](./tech/backend_impl.md) | 后端包结构、MyBatis-Plus 约定、JWT 实现、统一响应格式、权限 AOP、StorageService 抽象、引擎实现模式、定时任务、Sysadmin 初始化机制 | 后端开发 |
| [frontend_impl.md](./tech/frontend_impl.md) | 前端代码架构、双端适配层（`adapters/`）、`useComponent` composable、HTTP 层规范、CSS 变量体系 | 前端开发 |
| [todo.md](./tech/todo.md) | **唯一进度管理入口**。按模块顺序（M0–M11），每模块含依赖说明、检查点、前后端任务 | 开始任何开发任务前 |
| [test_design.md](./tech/test_design.md) | 测试策略、工具选型（REST Assured + Playwright）、自动化测试系统设计、日志驱动复现流程 | 编写测试时 |

---

## 建筑工程版业务文档

**定位**：描述博渊在众维建筑工程有限公司的具体配置与业务设计。

| 文档 | 内容摘要 | 何时读 |
|------|---------|--------|
| [design.md](./design.md) | 建筑工程版完整业务设计：角色定义、功能权限矩阵、审批流配置、薪资规则、数据保留策略、组织架构预置 | 实现权限逻辑、审批/薪资引擎，配置种子数据前必读 |

---

## 文档维护规范

| 变更类型 | 必须同步更新的文档 |
|---------|----------------|
| 架构/实体/API 变更 | `tech/architecture.md` |
| 后端包结构/约定/引擎实现变更 | `tech/backend_impl.md` |
| 前端适配层/HTTP层/状态管理变更 | `tech/frontend_impl.md` |
| 审批流/薪资规则/数据保留/权限/角色/组织架构变更 | `design.md` |
| 平台能力/架构变更 | `tech/architecture.md` |
| 重要设计决策变更 | `context/context.md`（更新"当前状态"和"禁止事项"节） |
| 任务完成 | `tech/todo.md`（打勾，立即提交） |
| 日志格式/字段变更 | `tech/architecture.md §13` + `tools/log_analyzer/README.md` |
| Dev 快捷工具设计变更 | `tech/test_design.md §10` |
| npm 脚本新增/变更 | 根目录 `README.md`（npm 脚本章节） |

**禁止在多个文档中重复维护同一内容。** 一处写明，其他地方引用。
