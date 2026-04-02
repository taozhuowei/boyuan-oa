# 博渊 OA 平台 — 文档中心

> 本文档中心集中管理博渊项目的所有文档，按**内容层次**分目录存放，而非按受众分类。
>
> **核心分类原则**：`platform/` 描述博渊平台本身是什么、怎么做的；`presets/` 描述某家企业要配置什么；`dev/` 记录开发过程中的测试策略和进度。

---

## 目录结构

```
documentation/
├── README.md                         ← 本文件，文档总索引
│
├── platform/                         ← 博渊 OA 平台层
│   ├── PRODUCT.md                   ← 平台产品设计
│   ├── ARCHITECTURE.md              ← 平台技术架构
│   ├── IMPLEMENTATION.md            ← 前端实现细节
│   └── UI_DESIGN.md                 ← 平台级 UI 设计规范
│
├── presets/                          ← 预置业务方案
│   └── construction/                ← 建筑工程版（众维当前配置）
│       ├── ROLE_CONFIG.md           ← 角色与权限配置
│       ├── WORKFLOW_CONFIG.md       ← 工作流与业务规则
│       └── UI_DESIGN.md             ← 业务模块页面设计
│
└── dev/                              ← 开发过程文档
    ├── TEST_DESIGN.md               ← 测试策略与用例
    └── TODO.md                      ← 开发进度管理
```

---

## platform/ — 博渊 OA 平台

**定位**：描述博渊平台本身的产品能力、技术架构和实现方式。与具体业务无关——换一家制造业企业来使用博渊，这些文档依然适用。

| 文档 | 职责 | 目标读者 |
|------|------|---------|
| [PRODUCT.md](./platform/PRODUCT.md) | 平台定位、设计原则、标准能力清单、可配置边界、第二家企业接入指南 | 产品负责人、实施顾问 |
| [ARCHITECTURE.md](./platform/ARCHITECTURE.md) | 技术选型、分层架构、引擎设计（权限/工作流/表单/薪资）、通用数据模型、API 规范 | 架构师、后端开发者 |
| [IMPLEMENTATION.md](./platform/IMPLEMENTATION.md) | 前端代码架构、双端适配层、HTTP 层规范、CSS 变量体系、Sysadmin 前端机制 | 前端开发者 |
| [UI_DESIGN.md](./platform/UI_DESIGN.md) | Web/MP Shell 结构、登录页、系统管理控制台、待办中心、个人中心、组件规范 | 前端开发者、UI 设计师 |

---

## presets/construction/ — 建筑工程版预置方案

**定位**：描述博渊在众维建筑工程有限公司的具体配置方案。这是平台引擎的配置输入，不是平台本身的能力。

> 若要为其他企业接入博渊，参考 `platform/PRODUCT.md §5` 新建 `presets/{行业}/` 目录。

| 文档 | 职责 | 目标读者 |
|------|------|---------|
| [ROLE_CONFIG.md](./presets/construction/ROLE_CONFIG.md) | 5 个角色定义、功能权限矩阵（按模块）、数据范围、权限边界特殊说明 | 产品经理、后端开发者（权限引擎配置参考） |
| [WORKFLOW_CONFIG.md](./presets/construction/WORKFLOW_CONFIG.md) | 各业务类型审批流与状态机、薪资计算公式、预结算校验规则、数据保留策略、表单字段定义 | 产品经理、后端开发者（种子数据参考） |
| [UI_DESIGN.md](./presets/construction/UI_DESIGN.md) | 工作台（各角色视图）、考勤、薪资、项目管理、员工管理、角色管理、数据管理页面布局 | 前端开发者、UI 设计师 |

---

## dev/ — 开发过程文档

**定位**：跨越平台层和预置层的开发过程管理文档，不包含设计内容。

| 文档 | 职责 | 目标读者 |
|------|------|---------|
| [CONTEXT.md](./dev/CONTEXT.md) | **AI 上下文摘要**，项目状态快照、重要设计决策、禁止事项、下一步任务 | 接手任务的 AI / 新开发者 |
| [TEST_DESIGN.md](./dev/TEST_DESIGN.md) | 测试策略、各层级测试用例设计（单元/集成/E2E） | QA、开发者 |
| [TODO.md](./dev/TODO.md) | **唯一进度管理入口**，前后端开发任务列表与完成状态 | 开发者 |

---

## 文档维护规范

1. **架构变更**时同步更新 `platform/ARCHITECTURE.md`
2. **业务规则变更**时同步更新 `presets/construction/WORKFLOW_CONFIG.md` 或 `ROLE_CONFIG.md`
3. **新增业务页面**时同步更新 `presets/construction/UI_DESIGN.md`
4. **平台能力新增**时同步更新 `platform/PRODUCT.md` 和 `platform/ARCHITECTURE.md`
5. **进度统一在 `dev/TODO.md` 管理**，完成一项立即打勾
6. **禁止在多个文档中重复维护同一内容**，通过引用建立关联
