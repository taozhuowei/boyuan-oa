# 博渊 OA 平台 — 文档中心

> **AI / 新开发者导航入口。** 本文件告诉你该读哪个文档、用来做什么。读完本文件，你已经知道去哪里找任何信息了。

---

## 快速上手路径（按顺序读）

```
1. 本文件（README.md）        → 知道文档在哪、分别是干什么的
2. context/CONTEXT.md        → 了解项目当前状态、历史设计决策、禁止事项
3. dev/TODO.md               → 知道当前该做什么，检查点在哪里
4. 按任务需要，查阅下方具体文档
```

**不要跳过前两步。** 许多重要决策（如"Employee 即用户，不存在独立 User 实体"）只记录在 `CONTEXT.md`，不在代码里。

---

## 目录结构

```
documentation/
├── README.md                         ← 本文件，导航入口
│
├── context/                          ← AI 上下文存档（历史会话关键信息）
│   └── CONTEXT.md                   ← 当前最新上下文摘要
│
├── platform/                         ← 博渊 OA 平台层（与具体企业无关）
│   ├── PRODUCT.md                   ← 平台产品定位与能力边界
│   ├── ARCHITECTURE.md              ← 技术架构、实体模型、API 规范
│   ├── IMPLEMENTATION.md            ← 前端实现细节
│   └── UI_DESIGN.md                 ← 平台级 UI 规范（Shell/登录/通用组件）
│
├── presets/                          ← 预置业务方案（按企业/行业分目录）
│   └── construction/                ← 众维建筑工程版（当前唯一客户）
│       ├── ROLE_CONFIG.md           ← 角色与权限配置
│       ├── WORKFLOW_CONFIG.md       ← 审批流、薪资规则、数据保留策略
│       ├── UI_DESIGN.md             ← 所有业务页面布局
│       ├── ORG_CONFIG.md            ← 部门、岗位、组织架构初始配置
│       └── CLIENT_FLOW_CONFIRMATION.md ← 产品手册：每个模块的功能边界与默认配置
│
└── dev/                              ← 开发过程文档
    ├── TODO.md                      ← 唯一进度管理入口（Phase 0–9 任务列表）
    └── TEST_DESIGN.md               ← 测试策略与用例设计
```

---

## context/ — AI 上下文存档

**用途**：记录无法从代码和 git history 推断的信息——历史设计决策、被推翻的方案、特殊约束、禁止事项。AI 接手任务时必读。

| 文档 | 内容 | 何时读 |
|------|------|--------|
| [CONTEXT.md](./context/CONTEXT.md) | 项目状态快照、10 项核心设计决策、禁止事项、前后端文件地图、下一步任务 | **每次新会话开始时** |

> 维护规则：每次完成一个重要设计阶段后，更新 `CONTEXT.md` 的"当前项目状态"和"下一个可执行任务"两节。不需要每次对话都更新——只在决策发生变化时更新。

---

## platform/ — 博渊 OA 平台

**定位**：描述博渊平台本身的能力。与具体企业无关——换一家制造业企业接入博渊，这些文档依然适用。

| 文档 | 内容摘要 | 何时读 |
|------|---------|--------|
| [PRODUCT.md](./platform/PRODUCT.md) | 平台定位、设计原则、标准能力清单、可配置边界、第二家企业接入指南 | 理解产品全貌 |
| [ARCHITECTURE.md](./platform/ARCHITECTURE.md) | 技术选型、三层架构、权限/工作流/表单/薪资引擎设计、28 个实体字段表、API 规范（7.4–7.10）、文件存储决策、签名流程、Excel 导入 | 后端开发、理解数据模型、设计接口 |
| [IMPLEMENTATION.md](./platform/IMPLEMENTATION.md) | 前端代码架构、双端适配层（`adapters/`）、`useComponent` composable、HTTP 层规范、CSS 变量体系 | 前端开发 |
| [UI_DESIGN.md](./platform/UI_DESIGN.md) | Web/MP Shell 结构、登录页、系统管理控制台、待办中心、个人中心、通用组件规范 | 平台级页面开发 |

---

## presets/construction/ — 众维建筑工程版预置方案

**定位**：描述博渊在众维建筑工程有限公司的具体配置。这是平台引擎的配置输入，不是平台能力本身。

> 若接入其他企业，参考 `platform/PRODUCT.md §5`，在 `presets/` 下新建对应行业目录。

| 文档 | 内容摘要 | 何时读 |
|------|---------|--------|
| [CLIENT_FLOW_CONFIRMATION.md](./presets/construction/CLIENT_FLOW_CONFIRMATION.md) | 产品手册：每个模块的功能点、默认配置值、支持/不支持边界 | 快速理解业务逻辑（优先于其他 presets 文档） |
| [ROLE_CONFIG.md](./presets/construction/ROLE_CONFIG.md) | 5 个角色（CEO/PM/Finance/Employee/Worker）定义、功能权限矩阵、数据范围规则、特殊边界说明 | 实现权限判断逻辑、配置种子数据 |
| [WORKFLOW_CONFIG.md](./presets/construction/WORKFLOW_CONFIG.md) | 各业务类型审批流节点、薪资计算公式、窗口期规则、数据保留策略、表单字段定义 | 实现审批引擎、薪资引擎 |
| [UI_DESIGN.md](./presets/construction/UI_DESIGN.md) | 所有业务页面布局（考勤、薪资、项目管理含施工日志/里程碑/仪表盘、员工管理、岗位管理、组织架构） | 前端业务页面开发 |
| [ORG_CONFIG.md](./presets/construction/ORG_CONFIG.md) | 部门结构、岗位定义、初始组织数据 | 配置种子数据、理解组织关系 |

---

## dev/ — 开发过程文档

**定位**：跟踪开发进度和测试策略。不包含设计内容。

| 文档 | 内容摘要 | 何时读 |
|------|---------|--------|
| [TODO.md](./dev/TODO.md) | **唯一进度管理入口**。Phase 0–9 任务列表，每 Phase 有目标、检查点（pass/fail 标准）、前后端任务。优先级标注 [P0]–[P3]。完成一项立即打勾。 | 开始任何开发任务前 |
| [TEST_DESIGN.md](./dev/TEST_DESIGN.md) | 测试策略、单元/集成/E2E 测试用例设计 | 编写测试时 |

---

## 文档维护规范

| 变更类型 | 必须同步更新的文档 |
|---------|----------------|
| 架构/实体/API 变更 | `platform/ARCHITECTURE.md` |
| 审批流/薪资规则/数据保留变更 | `presets/construction/WORKFLOW_CONFIG.md` |
| 权限/角色变更 | `presets/construction/ROLE_CONFIG.md` |
| 新增/修改业务页面 | `presets/construction/UI_DESIGN.md` |
| 功能边界/默认配置变更 | `presets/construction/CLIENT_FLOW_CONFIRMATION.md` |
| 平台能力新增 | `platform/PRODUCT.md` + `platform/ARCHITECTURE.md` |
| 重要设计决策变更 | `context/CONTEXT.md`（更新"当前状态"和"禁止事项"节） |
| 任务完成 | `dev/TODO.md`（打勾，立即提交） |

**禁止在多个文档中重复维护同一内容。** 一处写明，其他地方引用。
