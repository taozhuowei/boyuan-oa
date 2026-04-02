# 博渊 OA — AI 上下文摘要

> **用途**：防止 AI 上下文丢失。接手任务的 AI 或新会话应首先阅读本文件，再读 `TODO.md` 确认当前进度，最后按需深入具体文档。
>
> **维护规范**：每次重要设计变更后同步更新本文件。不记录代码实现细节——那些在代码里。

---

## 1. 项目一句话定位

**博渊 OA** 是面向中小型建筑施工企业的内部管理平台（首个客户：众维建筑工程有限公司，约 200 人）。引擎+配置分离架构：平台引擎（`platform/`）通用，业务配置（`presets/construction/`）为众维定制。

---

## 2. 当前项目状态（2026-04-02）

### 总体进度

**文档设计阶段基本完成，代码处于骨架状态，Phase 0 尚未开始。**

| 层 | 状态 | 说明 |
|----|------|------|
| 文档 | ✅ 完整 | 所有设计文档已定稿，见下方文档地图 |
| 前端 | 🟡 骨架 | 7 个页面 UI 框架已建，全是 mock 数据，HTTP 层已统一（`http.ts`），无真实接口调用 |
| 后端 | 🟡 骨架 | 16 个 Controller 骨架，仅少数 Service 实现，`schema.sql` 只有 `sys_user`+`sys_role` 两张表，其余全内存 mock |
| 数据库 | ❌ 未建 | 30 张业务表的 DDL 尚未写入 `schema.sql` |

### 当前应做的事

开始 **Phase 0（工程基础）**，对应任务在 `dev/TODO.md §Phase 0`。核心阻塞项：
1. 补全 `app/backend/src/main/resources/db/schema.sql`（30 张表 DDL）
2. 补全 `data.sql`（5 个测试账号种子数据）
3. `app/frontend/src/utils/access.ts` 和 `forms.ts` 中的私有 request 函数迁移到 `http.ts`

---

## 3. 文档地图

| 文档 | 内容 | 优先阅读场景 |
|------|------|------------|
| `documentation/platform/ARCHITECTURE.md` | 技术架构、所有实体字段表、API 规范（7.4–7.10）、文件存储决策、签名流程、Excel 导入 | 后端开发、理解数据模型 |
| `documentation/platform/PRODUCT.md` | 平台定位、功能边界、可配置项清单 | 理解产品全貌 |
| `documentation/platform/IMPLEMENTATION.md` | 前端代码架构、双端适配层、组件注册机制 | 前端开发 |
| `documentation/platform/UI_DESIGN.md` | Shell 结构、登录页、通用页面规范 | 平台级 UI |
| `documentation/presets/construction/ROLE_CONFIG.md` | 5 个角色定义、功能权限矩阵、数据范围规则 | 实现权限判断逻辑 |
| `documentation/presets/construction/WORKFLOW_CONFIG.md` | 审批流定义、薪资计算公式、窗口期规则、数据保留策略 | 实现审批/薪资引擎 |
| `documentation/presets/construction/UI_DESIGN.md` | 所有业务页面布局：考勤、薪资、项目、员工、岗位、组织架构 | 前端页面开发 |
| `documentation/presets/construction/CLIENT_FLOW_CONFIRMATION.md` | 产品手册：每个模块的功能点、默认配置、支持/不支持边界 | 快速理解业务逻辑 |
| `documentation/dev/TODO.md` | **唯一进度入口**，Phase 0–9 任务列表和检查点 | 开始工作前必读 |
| `documentation/dev/TEST_DESIGN.md` | 测试策略、各层用例设计 | 写测试时参考 |

---

## 4. 重要设计决策（避免被推翻）

### 4.1 实体模型：Employee = 用户

- `User` 表**已废弃**，不存在独立的 User 实体
- `Employee` 既是员工档案也是系统账号：`employeeNo` 作为登录用户名，`passwordHash` 存 bcrypt 哈希
- CEO 是 `roleCode=ceo` + 对应 CEO 岗位的普通员工，不是特殊账号
- Sysadmin 是独立系统账号，**不在** `employee` 表中，单独维护（初始化用，业务不涉及）

### 4.2 权限引擎：三条独立线

```
① 能做什么操作  →  role.permissionCodes（RBAC，按钮/接口级）
② 看到哪些模块  →  position.featureFlags（岗位特性标志，菜单级）
③ 看到多大范围  →  roleCode → dataScope 静态映射（GLOBAL/DEPARTMENT/PROJECT/SELF）
```

三条线独立，不互相推导。`employeeType`（OFFICE/LABOR）由 `position.employeeCategory` 自动同步，不参与权限计算。

### 4.3 岗位（Position）与角色（Role）的区别

| | Role（角色） | Position（岗位） |
|--|---|---|
| 定义 | 操作权限集合 | 职务类型，含薪资规则/假期配置/社保/特性标志 |
| 示例 | ceo、finance、project_manager | 项目经理、混凝土工、行政专员 |
| 关系 | 员工可有一个角色 | 员工必须绑定一个岗位；岗位有默认角色 |

一个岗位绑定一个默认角色，但员工的角色可以由 CEO 单独调整（如临时代理）。

### 4.4 审批流：工伤动态路由

`ApprovalFlowNode` 有 `skipCondition` JSON 字段：

```json
{ "type": "SUBMITTER_ROLE_MATCH", "roleCode": "project_manager" }
```

引擎推进时，若提交人 roleCode == 配置值，当前节点标记 `SKIPPED`，跳到下一节点。用途：PM 提交工伤时跳过 PM 审批节点，直达 CEO。

### 4.5 薪资结算：窗口期模型（取代4项硬阻断）

- 默认 **7 天窗口期**（CEO 可提前关闭）
- 只有 2 项强制前置检查：① 无未处理的异议/更正 ② 无未完成的薪资计算任务
- 窗口期内员工可提交异议；窗口关闭后数据锁定，不再接受异议
- 未响应加班通知、未完成工伤审核等—→窗口期关闭时按规则自动处理，不阻塞结算

### 4.6 加班通知：三路径模型

```
路径1（标准）：CEO/PM 发通知 → 员工确认/拒绝 → 记入薪资
路径2（自报）：员工自报加班 → CEO/PM 审批 → 记入薪资
路径3（溯源）：已发生的加班，主管补录通知 → 员工追认
```

三条路径均写入 `overtime_notification` + `overtime_response` 表。

### 4.7 签名流程（顺序不可颠倒）

```
1. 阅读工资确认协议（如已配置）— 协议版本号与员工 lastAgreementVersion 比对，有新版本必须重读
2. 首次：Canvas 手写签名 → 上传 → 绑定员工ID → 设置独立 PIN
3. 后续：展示签名预览 + 意图声明 → 输入 PIN → 生成 PayrollConfirmation + 存证 PDF
```

协议版本变更时，员工下次签署前必须重读，否则后端拒绝签署请求。

### 4.8 施工日志：模板 + 里程碑 + 汇总报告

- **工作项模板**：项目级，PM/CEO 维护，员工提交日志时从模板选择工作项（可自由填数量）
- **项目里程碑**：PM 创建抽象节点，每日工人提交日志时选择当前进度状态（ON_TRACK/AT_RISK/DELAYED）
- **汇总报告**：PM 在所有日志审批完成后触发生成，选择可视化组件（折线图/里程碑时间轴/工作量表），填写 PM 备注，提交后通知 CEO，归档
- **CEO 仪表盘**：实时展示工作量折线图（可下钻到具体日期）、里程碑进度、工作项汇总

### 4.9 文件存储决策

**服务器本地文件系统（非数据库 BLOB）**

```
/uploads/{业务类型}/{yyyy-MM}/{UUID}.{ext}
```

理由：200 人内网 OA，BLOB 存储导致备份膨胀和 I/O 问题；FS + `AttachmentMeta` 元数据是标准模式，未来迁移 MinIO/OSS 只需替换 `StorageService` 实现。

### 4.10 Excel 员工导入：两阶段流程

```
POST /employees/import/preview  → 校验，返回逐行错误列表 + sessionToken
POST /employees/import/apply    → 携带 sessionToken，批量建档+建账号
```

Excel 模板必须字段：`employeeNo`、`name`、`positionCode`、`departmentName`、`entryDate`、`phone`（可选：`levelCode`、`directSupervisorNo`、`remark`）

---

## 5. 前端代码关键文件

| 文件 | 说明 |
|------|------|
| `app/frontend/src/utils/http.ts` | 唯一 HTTP 请求出口，自动携带 `X-Client-Type`、401 跳转、防重复提交、错误 toast |
| `app/frontend/src/composables/useComponent.ts` | 并发加载多个跨端组件的 composable，用 `Promise.all` 替代串行 await |
| `app/frontend/src/adapters/config/components.json` | 跨端组件注册表（H5 → AntD、MP → Vant 的映射） |
| `app/frontend/src/adapters/resolver.ts` | 运行时组件解析器，读 `components.json` 动态 import |
| `app/frontend/src/stores/user.ts` | Pinia 用户状态，存 token + 员工基本信息 |
| `app/frontend/src/utils/access.ts` | 权限工具函数（判断 permissionCode / dataScope） |

**所有页面必须用 `useComponent` composable 加载跨端组件，禁止在页面中直接硬编码 AntD 或 Vant 组件名。**

---

## 6. 后端代码现状（骨架）

- **Controller 层**（16个）：骨架已建，大多数返回硬编码 mock 数据或 `TODO` 注释
- **Service 层**：只有少数有实际实现（`AuthService` 部分实现，`PayrollService` mock）
- **Entity 层**：`Employee`、`Department`、`Project`、`FormRecord`、`PayrollCycle`、`PayrollSlip`、`Role` 7 个实体类存在，其余待建
- **Mapper 层**：仅 `EmployeeMapper` 有基础方法，其余待建
- **schema.sql**：只有 `sys_user` + `sys_role`，**30 张业务表 DDL 全部缺失**（Phase 0 最高优先级）
- **注意**：`UserController` 仍存在（来自初始代码），实际应合并到 `EmployeeController`，后续 Phase 2 重构时处理

---

## 7. 已确认的技术约束

- **Spring Boot 3 + Java 17**，ORM 用 MyBatis-Plus（逻辑删除 + 自动填充）
- **PostgreSQL**（非 MySQL），开发环境用 H2 兼容模式（`schema.sql` 注意语法差异）
- **uni-app + Vue 3 + Vite**，编译目标：H5（PC/平板/手机浏览器）+ 企业微信小程序
- H5 组件库：Ant Design Vue 4.x；小程序组件库：Vant 4.9.x
- 主色调：`#003466`（深蓝），CSS 变量：`--ant-color-primary` / `--van-primary-color`
- JWT Bearer Token 认证，所有请求携带 `Authorization: Bearer {token}`
- `X-Client-Type: web | mp` 请求头，后端据此返回不同配置

---

## 8. 暂时延后的功能（P3，勿提前实现）

- 企业微信 OAuth 登录（`/auth/wework` 当前返回 501）
- 企业微信通讯录批量导入（当前用 mock 数据）
- 企业微信应用消息推送（待 corpId/agentId/secret 就绪）
- e签宝 CA 对接（`EsignSignatureProvider`，当前只有 `LocalSignatureProvider`）
- `GET /workbench/summary` 接口缓存层（直接查 DB，不加 Redis）

---

## 9. 禁止事项（从历史讨论中提炼）

- **禁止创建独立 `User` 实体**，员工即用户
- **禁止将 employeeType 参与权限计算**，employeeType 只是薪资/假期的分类标签，从岗位 employeeCategory 自动同步
- **禁止将薪资结算前置检查扩展超过 2 项**（窗口期内的异议和未完成计算任务），其他状态不阻塞结算
- **禁止文件存二进制到数据库**，一律走 FS + AttachmentMeta
- **禁止页面硬编码 AntD/Vant 组件**，必须走适配层 `components.json`
- **禁止在 `access.ts` 或 `forms.ts` 中创建私有 request 函数**，全部走 `http.ts`

---

## 10. 下一个可执行任务

按 `dev/TODO.md Phase 0` 顺序执行：

```
后端：写 schema.sql（30张表DDL）
后端：写 data.sql（5个测试账号）
后端：补全 EmployeeMapper / ProjectMapper / DepartmentMapper
后端：ApprovalFlowNode 实体加 skipCondition 字段
前端：access.ts 和 forms.ts 迁移到 http.ts
前端：getComponentSync 补充条件编译实现
```

所有任务完成后，执行 Phase 0 检查点（4 项 pass 条件），再进入 Phase 1。
