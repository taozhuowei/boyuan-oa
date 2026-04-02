# 博渊 OA 平台 — 技术架构文档

> **文档职责**：描述博渊平台的技术选型、系统架构、各引擎设计模型、核心数据模型和 API 规范。
>
> **目标读者**：后端架构师、技术负责人。
>
> **不包含内容**：具体代码实现细节（见 `IMPLEMENTATION.md`）；建筑工程版业务数据模型（见 `presets/construction/`）。

---

## 目录

1. [系统架构](#1-系统架构)
2. [技术栈](#2-技术栈)
3. [分层架构](#3-分层架构)
4. [模块划分](#4-模块划分)
5. [引擎设计](#5-引擎设计)
6. [核心数据模型](#6-核心数据模型)
7. [API 设计规范](#7-api-设计规范)
8. [文件存储](#8-文件存储)
9. [电子签名架构](#9-电子签名架构)
10. [员工档案 Excel 导入](#10-员工档案-excel-导入)
11. [企业微信接入（预留）](#11-企业微信接入预留)

---

## 1. 系统架构

```
┌─────────────────┐     ┌─────────────────┐
│  企业微信工作台   │     │   Web 浏览器     │
│    小程序        │     │ (PC/平板/手机)   │
└────────┬────────┘     └────────┬────────┘
         └───────────┬───────────┘
                     ▼
            ┌─────────────────┐
            │  uni-app 前端    │
            │  (Vue 3 + Vite) │
            │  配置驱动渲染    │
            └────────┬────────┘
                     │ REST API  X-Client-Type: web | mp
                     ▼
            ┌─────────────────┐
            │  Spring Boot    │
            │  平台引擎层      │
            │  + 业务配置层    │
            └────────┬────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌──────────┐
    │PostgreSQL│ │ 服务器文件│ │ 企业微信  │
    │  主数据  │ │  系统存储 │ │   API    │
    └─────────┘ └─────────┘ └──────────┘
```

---

## 2. 技术栈

| 层               | 技术                    | 版本 / 说明                      |
|------------------|-------------------------|----------------------------------|
| 前端框架          | uni-app + Vue 3 + Vite  | 编译到小程序 + H5                |
| 前端组件库（H5）  | Ant Design Vue 4.x      | PC/平板/手机浏览器               |
| 前端组件库（MP）  | Vant 4.9.x              | 企业微信小程序                   |
| 后端框架          | Spring Boot 3           | Java 17                          |
| 安全              | Spring Security + JWT   | Bearer Token，bcrypt 密码加密    |
| ORM               | MyBatis-Plus            | 逻辑删除、自动填充               |
| 数据库            | PostgreSQL              | 主数据 + 索引                    |
| 文件存储          | 服务器本地文件系统        | 原始文件存 FS，元数据存 DB（见§8）|

---

## 3. 分层架构

```
┌────────────────────────────────────────────────────┐
│  配置层（Config Layer）                              │
│  角色权限 / 审批流定义 / 岗位规则 / 薪资规则 / 保留策略│
│  由 Sysadmin 初始化 + CEO 日常维护                   │
└──────────────────────────┬─────────────────────────┘
                           │ 配置读取
┌──────────────────────────▼─────────────────────────┐
│  引擎层（Engine Layer）                              │
│  权限引擎 / 工作流引擎 / 表单引擎 / 薪资引擎          │
│  通知引擎 / 签名引擎 / 数据生命周期引擎               │
└──────────────────────────┬─────────────────────────┘
                           │ 引擎调用
┌──────────────────────────▼─────────────────────────┐
│  业务运行层（Business Runtime Layer）                │
│  REST API / 业务状态机 / 事件发布 / 数据持久化        │
└────────────────────────────────────────────────────┘
```

---

## 4. 模块划分

| 模块域       | 职责                                                      | 核心类                                                          |
|-------------|-----------------------------------------------------------|----------------------------------------------------------------|
| 身份与组织   | 员工账号/档案、岗位/等级、部门、项目、组织架构               | `AuthController` `EmployeeController` `PositionController`     |
| 系统管理     | Sysadmin 初始化、公司配置、账号重置                         | `SetupController` `SystemController`                           |
| 配置域       | 菜单路由、审批流定义、角色权限、薪资规则、数据保留策略         | `PageConfigController` `ApprovalFlowController` `RoleController` |
| 考勤业务域   | 请假/加班通知/自补加班/工伤补偿，审批记录                    | `AttendanceController` `OvertimeNotificationController`        |
| 施工日志域   | 日志填报/审批/追溯驳回、工作项模板、里程碑、汇总报告、Dashboard | `WorkLogController` `WorkItemTemplateController` `ProjectController` |
| 薪资域       | 工资周期、窗口期、工资单、工资项、更正单、工资确认协议         | `PayrollController` `PayrollWindowPeriodController`            |
| 签名域       | 手写签名绑定、协议确认、工资条签署、存证 PDF 生成            | `SignatureController` `EvidenceService`                        |
| 通知域       | 系统内通知、到期提醒、企业微信推送（预留）                    | `NotificationController` `NotificationService`                 |
| 保留清理域   | 到期提醒、清理任务、备份导出                                 | `CleanupScheduler` `BackupController`                          |

---

## 5. 引擎设计

### 5.1 权限引擎

权限由**三条独立的线**共同控制，相互不干扰：

```
① 操作权限 = role.permissionCodes
   ─ 存储于 RolePermission 表，Key 为 (roleCode, permissionCode)
   ─ 决定"能做什么操作"（审批/结算/配置/…）

② 功能入口 = position.featureFlags
   ─ 决定"能看到哪些模块"（requiresConstructionLog / hasPerformanceBonus / …）
   ─ 由岗位携带，登录时随员工档案下发

③ 数据范围 = 由 roleCode 静态映射
   ─ CEO / finance       → GLOBAL（全局可见）
   ─ project_manager     → PROJECT（本项目成员）
   ─ employee / worker   → SELF（本人数据）
```

> **注意**：旧设计将"员工类型"和"部门范围"纳入权限计算，新架构中已拆分：
> 员工类型由岗位决定，部门不作为数据范围维度（建筑版无部门隔离需求）。

**菜单动态下发**：后端根据 `roleCode` + `positionId` 构建菜单树和功能按钮列表，通过 `GET /page-config/{routeCode}` 下发，前端无硬编码路由权限。

---

### 5.2 工作流引擎

每种业务类型对应一个审批流定义（`ApprovalFlowDef`），由有序节点列表组成：

```
ApprovalFlowDef  { businessType, nodes[] }
ApprovalFlowNode { nodeOrder, nodeName, approverType, approverRef, skipCondition? }

approverType:
  DIRECT_SUPERVISOR  → 取提交人的 directSupervisorId 链（最常用）
  ROLE               → 指定 roleCode 的持有者
  DESIGNATED         → 指定具体员工 ID

skipCondition（可选，用于动态路由）:
  { "type": "SUBMITTER_ROLE_MATCH", "roleCode": "project_manager" }
  → 若提交人 roleCode == 配置值，当前节点标记 SKIPPED，跳到下一节点
```

状态流转：
```
提交 → PENDING
     → 节点1审批 → APPROVING
     → 节点N审批 → APPROVED
                 → REJECTED（可重新发起，历史保留）
APPROVED → ARCHIVED

施工日志特殊状态：
ARCHIVED → RECALLED（CEO 追溯驳回，劳工须重新提交）
```

约束：
- 当前版本不支持条件分支和并行会签
- 流程变更仅对新提交单据生效，不影响在途单据
- 所有审批操作写入 `OperationLog`，不受数据保留策略删除

---

### 5.3 表单引擎

```
GET /page-config/{routeCode}?clientType=web|mp
→ 返回：字段列表、校验规则、选项列表、操作按钮配置、数据绑定规则

GET /forms/config?formType={type}
→ 返回：表单字段、审批流节点预览、附件配置
```

前端内置容器组件（`FormContainer` `ListContainer` `DetailContainer`），接收配置 JSON 并渲染，无硬编码业务字段。Session 内缓存，后端版本变更时自动清除。

---

### 5.4 薪资引擎

```
算薪输入：
  岗位/等级/个人覆盖 → 基本工资、加班倍率、请假扣款比例
  考勤记录（窗口期锁定后）→ 实际出勤天数
  加班通知归档记录 → 加班补贴
  请假审批结果 → 扣款（含追溯请假）
  工伤补偿 → 财务指定入账月份
  绩效奖金 → 岗位默认/个人覆盖（需CEO审批）
  社保处理方式 → 公司代缴（分险种扣款）或并入工资（合计补贴）

算薪流程：
  窗口期开启（周期结束后自动）
  → 数据确认（员工补录/PM补发通知）
  → 窗口期关闭（自动到期或CEO提前关闭）
  → 2项强制检查（窗口期已关闭 + 全员档案已配置）
  → 正式结算（周期锁定）
  → 工资单发布 → 员工签名确认
  → 更正申请（CEO审批解锁）→ 重算 → 新版本发布

多版本：每次更正生成新版本（version 递增），历史版本保留，不可篡改
```

---

## 6. 核心数据模型

> **通用字段规范**：所有实体均包含 `created_at TIMESTAMP`（创建时间）、`updated_at TIMESTAMP`（最后修改时间）、`deleted BOOLEAN DEFAULT FALSE`（MyBatis-Plus 逻辑删除）。下表中省略这三个字段。

---

### 6.1 员工与组织

#### `Employee` — 员工档案（兼账号）

> 账号与档案合并，员工即系统用户。`employeeNo` 作为登录用户名。
> Sysadmin 是独立系统管理账号，不存入此表。
> `employeeType` 由所属岗位 `position.employeeCategory` 自动同步，不可手动修改。

| 字段                  | 类型                   | 说明                                          |
|---------------------|------------------------|-----------------------------------------------|
| `id`                | UUID PK                | 主键                                          |
| `employeeNo`        | VARCHAR(20) UNIQUE     | 工号，同时作为登录用户名                        |
| `passwordHash`      | VARCHAR(60)            | bcrypt 加密密码                               |
| `name`              | VARCHAR(50)            | 姓名                                          |
| `phone`             | VARCHAR(20)            | 手机号                                        |
| `email`             | VARCHAR(100)           | 邮箱（可选）                                  |
| `positionId`        | UUID FK → Position     | 所属岗位，决定薪资规则和功能入口               |
| `levelId`           | UUID FK → PositionLevel NULL | 等级（可选），覆盖岗位默认薪资/假期        |
| `roleCode`          | VARCHAR FK → Role      | 操作权限角色（默认取 position.defaultRoleCode）|
| `employeeType`      | ENUM(OFFICE, LABOR)    | 由岗位自动同步，不可手动修改                   |
| `directSupervisorId`| UUID FK → Employee NULL | 直系领导，审批路由第一节点                    |
| `accountStatus`     | ENUM(ACTIVE, DISABLED) | 账号状态，DISABLED 不可登录                   |
| `entryDate`         | DATE                   | 入职日期                                      |
| `leaveDate`         | DATE NULL              | 离职日期，NULL 表示在职                        |

---

#### `Position` — 岗位

> 岗位是员工与薪资规则的连接点，同时通过 featureFlags 控制功能模块入口。
> 员工类型（OFFICE/LABOR）由岗位的 `employeeCategory` 决定。

| 字段                    | 类型                   | 说明                                          |
|------------------------|------------------------|-----------------------------------------------|
| `id`                   | UUID PK                | 主键                                          |
| `positionCode`         | VARCHAR(50) UNIQUE     | 岗位编码（不可重复，用于程序引用）             |
| `positionName`         | VARCHAR(100)           | 显示名称（如"项目经理"、"架子工"）             |
| `employeeCategory`     | ENUM(OFFICE, LABOR)    | 员工类型，自动同步到关联员工的 employeeType    |
| `defaultRoleCode`      | VARCHAR FK → Role      | 新建员工时的默认角色                           |
| `supervisorPositionCode`| VARCHAR NULL          | 默认上级岗位编码，用于组织架构兜底路由         |
| `requiresConstructionLog`| BOOLEAN             | 是否需要提交施工日志（LABOR 类型可开启）       |
| `hasPerformanceBonus`  | BOOLEAN                | 是否有绩效奖金（OFFICE 类型可开启）            |
| `baseSalary`           | DECIMAL                | 基本工资基准（元/月）                          |
| `overtimeBaseType`     | ENUM(BASE, TOTAL, CUSTOM)| 加班费计算基准：基本工资/全部工资/自定义金额  |
| `overtimeBaseAmount`   | DECIMAL NULL           | 自定义加班基准金额（overtimeBaseType=CUSTOM 时有效）|
| `overtimeRateWeekday`  | DECIMAL DEFAULT 1.5    | 平日加班倍数                                  |
| `overtimeRateWeekend`  | DECIMAL DEFAULT 2.0    | 周末加班倍数                                  |
| `overtimeRateHoliday`  | DECIMAL DEFAULT 3.0    | 法定节假日加班倍数                             |
| `defaultPerformanceBonus`| DECIMAL NULL         | 绩效奖金默认值（hasPerformanceBonus=true 时有效）|
| `annualLeave`          | INT                    | 年假天数（天/年）                              |
| `leaveDeductBaseType`  | ENUM(BASE, TOTAL, CUSTOM)| 请假扣款计算基准                             |
| `leaveDeductRates`     | JSON                   | 各假期类型扣款比例 `{"annual":0,"sick":50,...}` |
| `socialInsuranceMode`  | ENUM(COMPANY_PAID, MERGED)| 社保处理：公司代缴 / 并入工资               |
| `socialInsuranceRates` | JSON NULL              | 各险种比例配置（COMPANY_PAID 时有效）          |

---

#### `PositionLevel` — 岗位等级

> 等级是岗位的可选子配置。未配置等级的员工使用岗位默认值。
> 等级只覆盖薪资/假期，不影响权限或功能入口。

| 字段              | 类型               | 说明                                      |
|------------------|-------------------|-------------------------------------------|
| `id`             | UUID PK            | 主键                                      |
| `positionId`     | UUID FK → Position | 所属岗位                                  |
| `levelName`      | VARCHAR(50)        | 等级名称（如"初级"、"高级"）               |
| `levelOrder`     | INT                | 排序序号（越大等级越高）                   |
| `baseSalaryOverride`    | DECIMAL NULL  | 覆盖岗位基本工资（NULL 表示沿用岗位默认）  |
| `performanceBonusOverride`| DECIMAL NULL | 覆盖绩效奖金默认值                       |
| `annualLeaveOverride`   | INT NULL      | 覆盖年假天数                              |

---

#### `Department` — 部门

| 字段         | 类型               | 说明                                |
|-------------|-------------------|-------------------------------------|
| `id`        | UUID PK            | 主键                                |
| `parentId`  | UUID FK NULL       | 父部门 ID（NULL 为根节点）           |
| `name`      | VARCHAR(100)       | 部门名称                            |
| `sort`      | INT                | 同级排序                            |

---

#### `Project` — 项目

| 字段              | 类型               | 说明                                |
|------------------|-------------------|-------------------------------------|
| `id`             | UUID PK            | 主键                                |
| `name`           | VARCHAR(200)       | 项目名称                            |
| `pmId`           | UUID FK → Employee | 项目经理                            |
| `status`         | ENUM(ACTIVE, CLOSED) | 项目状态                          |
| `startDate`      | DATE               | 开始日期                            |
| `endDate`        | DATE NULL          | 结束日期                            |
| `logCycleDays`   | INT DEFAULT 1      | 施工日志申报周期（天）               |
| `logCyclePendingApproval`| BOOLEAN   | 申报周期是否有待审批的变更请求        |

---

#### `ProjectMember` — 项目成员关联

| 字段          | 类型               | 说明         |
|--------------|-------------------|--------------|
| `projectId`  | UUID FK → Project  | 项目         |
| `employeeId` | UUID FK → Employee | 员工         |

---

### 6.2 权限配置

#### `Role` — 角色定义

| 字段          | 类型            | 说明                               |
|-------------|-----------------|-----------------------------------|
| `id`        | UUID PK          | 主键                              |
| `roleCode`  | VARCHAR(50) UNIQUE | 角色编码（系统内置不可修改）       |
| `roleName`  | VARCHAR(50)      | 显示名称                          |
| `isSystem`  | BOOLEAN          | true 表示系统内置角色，不可删除    |
| `description`| VARCHAR(200)    | 角色说明                          |

---

#### `RolePermission` — 角色权限项

| 字段              | 类型                        | 说明                                  |
|------------------|-----------------------------|---------------------------------------|
| `roleCode`       | VARCHAR FK → Role           | 角色编码                              |
| `permissionCode` | VARCHAR(100)                | 权限项编码（如 `approval.final.approve`）|
| `dataScope`      | ENUM(GLOBAL, PROJECT, SELF) | 该权限项生效的数据范围                 |

---

### 6.3 审批与业务表单

#### `FormRecord` — 通用业务单据

> 所有业务申请（请假/工伤/施工日志等）均使用此表。`formData` 存储各类型业务特有的字段，类型由 `formType` 区分。

| 字段             | 类型                | 说明                                          |
|----------------|---------------------|-----------------------------------------------|
| `id`           | UUID PK              | 主键                                          |
| `formType`     | ENUM(LEAVE, INJURY, CONSTRUCTION_LOG, OVERTIME_SELF_REPORT, …) | 业务类型 |
| `submitterId`  | UUID FK → Employee   | 提交人（代录时为代录者）                        |
| `targetEmployeeId` | UUID FK → Employee | 实际关联员工（代录时与 submitterId 不同）     |
| `projectId`    | UUID FK → Project NULL | 关联项目（请假/工伤/施工日志均需关联）         |
| `formData`     | JSON                 | 各业务类型特有字段（JSON 序列化）               |
| `status`       | ENUM(PENDING, APPROVING, APPROVED, REJECTED, ARCHIVED, RECALLED) | 单据状态 |
| `currentNodeOrder`| INT             | 当前处于第几个审批节点                         |
| `remark`       | VARCHAR(500) NULL    | 备注（驳回原因等）                             |

---

#### `ApprovalFlowDef` — 审批流定义

| 字段           | 类型            | 说明                               |
|--------------|-----------------|-----------------------------------|
| `id`         | UUID PK          | 主键                              |
| `businessType` | VARCHAR(50)   | 对应 FormRecord.formType            |
| `version`    | INT              | 版本号，变更时递增                  |
| `isActive`   | BOOLEAN          | 仅最新激活版本生效                  |

---

#### `ApprovalFlowNode` — 审批流节点

| 字段              | 类型                                      | 说明                                      |
|------------------|-------------------------------------------|-------------------------------------------|
| `id`             | UUID PK                                   | 主键                                      |
| `flowId`         | UUID FK → ApprovalFlowDef                | 所属审批流                                |
| `nodeOrder`      | INT                                       | 节点顺序（从1开始）                        |
| `nodeName`       | VARCHAR(100)                              | 节点名称（如"直系领导初审"）               |
| `approverType`   | ENUM(DIRECT_SUPERVISOR, ROLE, DESIGNATED) | 审批人确定方式                            |
| `approverRef`    | VARCHAR(100) NULL                         | ROLE 时填 roleCode，DESIGNATED 时填 employeeId |
| `skipCondition`  | JSON NULL                                 | 动态跳过条件（见§5.2），NULL 表示不跳过    |

---

#### `ApprovalRecord` — 审批操作记录

> 永久保留，不受数据保留策略影响。

| 字段           | 类型                          | 说明                    |
|--------------|-------------------------------|-------------------------|
| `id`         | UUID PK                        | 主键                    |
| `formId`     | UUID FK → FormRecord           | 关联单据                |
| `nodeOrder`  | INT                            | 操作发生的节点序号       |
| `approverId` | UUID FK → Employee             | 操作人                  |
| `action`     | ENUM(APPROVE, REJECT, SKIP, RECALL) | 操作类型           |
| `comment`    | VARCHAR(500) NULL              | 审批意见/驳回原因        |
| `actedAt`    | TIMESTAMP                      | 操作时间                |

---

### 6.4 考勤业务

#### `OvertimeNotification` — 加班通知

| 字段            | 类型                  | 说明                                        |
|---------------|----------------------|---------------------------------------------|
| `id`          | UUID PK               | 主键                                        |
| `projectId`   | UUID FK → Project     | 关联项目                                    |
| `initiatorId` | UUID FK → Employee    | 发起人（PM 或 CEO）                          |
| `overtimeDate`| DATE                  | 加班日期                                    |
| `overtimeType`| ENUM(WEEKDAY, WEEKEND, HOLIDAY) | 加班类型，决定补贴倍率              |
| `content`     | VARCHAR(500)          | 通知内容                                    |
| `status`      | ENUM(NOTIFIED, ARCHIVED, CLOSED) | ARCHIVED=已归档计薪，CLOSED=提前关闭 |

---

#### `OvertimeResponse` — 员工对加班通知的响应

| 字段                   | 类型                       | 说明                                 |
|-----------------------|---------------------------|--------------------------------------|
| `notificationId`      | UUID FK → OvertimeNotification | 关联通知                         |
| `employeeId`          | UUID FK → Employee        | 响应员工                             |
| `accepted`            | BOOLEAN DEFAULT TRUE       | 是否确认参与（默认同意）             |
| `rejectReason`        | VARCHAR(500) NULL          | 拒绝原因（拒绝时必填）               |
| `rejectApprovalStatus`| ENUM(PENDING, APPROVED, REJECTED) NULL | 拒绝申请的审批状态       |

---

### 6.5 施工日志

#### `ConstructionLog` — 施工日志

| 字段           | 类型                | 说明                                              |
|--------------|---------------------|---------------------------------------------------|
| `id`         | UUID PK              | 主键                                              |
| `projectId`  | UUID FK → Project    | 关联项目                                          |
| `submitterId`| UUID FK → Employee   | 提交劳工                                          |
| `logDate`    | DATE                 | 施工日期                                          |
| `workItems`  | JSON                 | 工作项列表 `[{name, quantity, unit}, …]`           |
| `note`       | VARCHAR(1000) NULL   | 补充说明                                          |
| `pmNote`     | VARCHAR(500) NULL    | 项目经理审批时附加的批注                            |
| `status`     | ENUM(PENDING, APPROVED, REJECTED, ARCHIVED, RECALLED) | 日志状态 |
| `version`    | INT DEFAULT 1        | 版本号（RECALLED 后重提递增）                     |

---

#### `WorkItemTemplate` — 工作项模板

| 字段           | 类型               | 说明                              |
|--------------|-------------------|-----------------------------------|
| `id`         | UUID PK            | 主键                              |
| `name`       | VARCHAR(100)       | 模板名称                          |
| `projectId`  | UUID FK NULL       | NULL 为全局模板，非 NULL 为项目模板|
| `createdBy`  | UUID FK → Employee | 创建人（PM 或 CEO）               |
| `items`      | JSON               | 预设工作项 `[{name, defaultUnit}, …]` |
| `derivedFrom`| UUID FK NULL       | 派生自哪个模板（NULL 为原创）      |

---

#### `ProjectMilestone` — 项目里程碑

| 字段              | 类型               | 说明                    |
|------------------|-------------------|-------------------------|
| `id`             | UUID PK            | 主键                    |
| `projectId`      | UUID FK → Project  | 关联项目                |
| `name`           | VARCHAR(200)       | 里程碑名称              |
| `plannedDate`    | DATE               | 计划完成日期            |
| `completedDate`  | DATE NULL          | 实际完成日期（NULL 未完成）|
| `sort`           | INT                | 排序                    |

---

#### `ProjectProgressLog` — 每日进度确认

| 字段               | 类型                               | 说明                          |
|------------------|-----------------------------------|-------------------------------|
| `id`             | UUID PK                            | 主键                          |
| `projectId`      | UUID FK → Project                  | 关联项目                      |
| `pmId`           | UUID FK → Employee                 | 确认的项目经理                |
| `logDate`        | DATE                               | 确认日期                      |
| `milestoneId`    | UUID FK → ProjectMilestone NULL    | 今日到达的里程碑节点（可为空）  |
| `progressStatus` | ENUM(ON_TRACK, AT_RISK, DELAYED)   | 进展状态                      |
| `note`           | VARCHAR(500) NULL                  | 备注                          |

---

#### `ConstructionLogSummary` — 汇总报告

| 字段              | 类型                | 说明                                        |
|----------------- |---------------------|---------------------------------------------|
| `id`             | UUID PK              | 主键                                        |
| `projectId`      | UUID FK → Project    | 关联项目                                    |
| `pmId`           | UUID FK → Employee   | 生成报告的项目经理                           |
| `periodStart`    | DATE                 | 统计起始日                                  |
| `periodEnd`      | DATE                 | 统计结束日                                  |
| `vizComponents`  | JSON                 | 选择的可视化组件列表 `["LINE_CHART", "MILESTONE_TIMELINE", …]` |
| `pmNote`         | VARCHAR(2000)        | PM 总结                                     |
| `ceoNotifiedAt`  | TIMESTAMP NULL       | 通知 CEO 时间（NULL 表示未通知）             |

---

### 6.6 薪资

#### `PayrollCycle` — 工资结算周期

| 字段           | 类型                           | 说明                         |
|--------------|-------------------------------|------------------------------|
| `id`         | UUID PK                        | 主键                         |
| `period`     | VARCHAR(20)                    | 周期标识（如 `2026-04`）      |
| `cycleType`  | ENUM(MONTHLY, SEMI_MONTHLY)    | 月结/半月结                  |
| `startDate`  | DATE                           | 周期开始日                   |
| `endDate`    | DATE                           | 周期结束日                   |
| `payDate`    | DATE                           | 发薪日                       |
| `status`     | ENUM(OPEN, WINDOW_OPEN, WINDOW_CLOSED, SETTLED, LOCKED, CORRECTING) | 周期状态 |
| `lockedAt`   | TIMESTAMP NULL                 | 正式结算锁定时间              |
| `version`    | INT DEFAULT 1                  | 更正版本号（每次更正递增）    |

---

#### `PayrollWindowPeriod` — 窗口期状态

| 字段               | 类型                   | 说明                                  |
|------------------|------------------------|---------------------------------------|
| `id`             | UUID PK                | 主键                                  |
| `cycleId`        | UUID FK → PayrollCycle  | 关联周期                              |
| `openAt`         | TIMESTAMP              | 窗口期开启时间                        |
| `closeAt`        | TIMESTAMP NULL         | 窗口期关闭时间（NULL 表示仍开启）      |
| `configuredDays` | INT DEFAULT 7          | 配置的窗口期时长（天）                |
| `closedByEarlyId`| UUID FK NULL           | 提前关闭的操作人（NULL 表示自动到期）  |

---

#### `PayrollSlip` — 员工工资单

| 字段           | 类型                | 说明                             |
|--------------|---------------------|----------------------------------|
| `id`         | UUID PK              | 主键                             |
| `cycleId`    | UUID FK → PayrollCycle | 关联周期                       |
| `employeeId` | UUID FK → Employee   | 员工                             |
| `version`    | INT DEFAULT 1        | 版本号（更正后递增）             |
| `status`     | ENUM(DRAFT, PUBLISHED, CONFIRMED, DISPUTED, SUPERSEDED) | 工资单状态 |
| `grossPay`   | DECIMAL              | 税前应发                         |
| `netPay`     | DECIMAL              | 实发金额                         |
| `items`      | JSON                 | 工资项明细 `[{itemType, amount, description}, …]` |

---

#### `PayrollConfirmation` — 工资条签署存证

| 字段                  | 类型                | 说明                             |
|---------------------|---------------------|----------------------------------|
| `id`                | UUID PK              | 主键                             |
| `slipId`            | UUID FK → PayrollSlip | 关联工资单                      |
| `employeeId`        | UUID FK → Employee   | 签署员工                         |
| `confirmedAt`       | TIMESTAMP            | 签署时间                         |
| `clientIp`          | VARCHAR(45)          | 客户端 IP                        |
| `userAgent`         | VARCHAR(500)         | 客户端 UA                        |
| `payrollContentHash`| VARCHAR(64)          | 工资单内容 SHA-256 哈希，防篡改   |
| `signatureHash`     | VARCHAR(64)          | 签名图像哈希                     |
| `agreementVersion`  | VARCHAR(50) NULL     | 签署时所用协议版本号             |
| `evidencePdfPath`   | VARCHAR(500)         | 存证 PDF 路径（服务器文件系统）   |

---

#### `SalaryConfirmationAgreement` — 工资确认协议

| 字段          | 类型                | 说明                              |
|-------------|---------------------|-----------------------------------|
| `id`        | UUID PK              | 主键                              |
| `version`   | VARCHAR(50)          | 协议版本号（CEO 每次修改后递增）    |
| `filePath`  | VARCHAR(500)         | 协议文件路径（服务器文件系统）      |
| `uploadedBy`| UUID FK → Employee   | 上传人（CEO）                     |
| `isActive`  | BOOLEAN              | 是否为当前生效版本                 |
| `uploadedAt`| TIMESTAMP            | 上传时间                          |

---

#### `EmployeeSignature` — 员工签名档案

| 字段                    | 类型               | 说明                                  |
|------------------------|-------------------|---------------------------------------|
| `id`                   | UUID PK            | 主键                                  |
| `employeeId`           | UUID FK → Employee | 员工（UNIQUE）                        |
| `signatureImageEncrypted` | TEXT            | AES 加密后的签名图像（Base64）         |
| `signatureHash`        | VARCHAR(64)        | 签名图像 SHA-256 哈希，用于比对        |
| `pinHash`              | VARCHAR(60)        | bcrypt 加密的签名 PIN 码               |
| `boundAt`              | TIMESTAMP          | 首次绑定时间                          |
| `lastAgreementVersion` | VARCHAR(50) NULL   | 最后确认的协议版本号（用于判断是否需重新阅读）|

---

### 6.7 通用

#### `AttachmentMeta` — 附件元数据

| 字段           | 类型               | 说明                                          |
|--------------|-------------------|-----------------------------------------------|
| `id`         | UUID PK            | 主键                                          |
| `businessType`| VARCHAR(50)       | 业务类型（leave/injury/construction-log/…）   |
| `businessId` | UUID               | 关联的业务记录 ID                              |
| `fileName`   | VARCHAR(255)       | 原始文件名                                    |
| `storagePath`| VARCHAR(500)       | 服务器文件系统路径（相对 uploads 根目录）       |
| `fileMd5`    | VARCHAR(32)        | 文件 MD5，用于去重和完整性校验                 |
| `fileSize`   | BIGINT             | 文件大小（字节）                               |
| `mimeType`   | VARCHAR(100)       | MIME 类型（image/jpeg, application/pdf, …）   |
| `uploadedBy` | UUID FK → Employee | 上传人                                        |
| `uploadedAt` | TIMESTAMP          | 上传时间                                      |

---

#### `OperationLog` — 审批操作日志

> **永久保留，不受数据保留策略影响。** 记录所有高风险操作的完整证据链。

| 字段          | 类型               | 说明                                          |
|-------------|-------------------|-----------------------------------------------|
| `id`        | UUID PK            | 主键                                          |
| `operatorId`| UUID FK → Employee | 操作人                                        |
| `action`    | VARCHAR(100)       | 操作动作（如 `payroll.settle`、`role.permission.update`）|
| `targetType`| VARCHAR(50)        | 操作目标类型                                  |
| `targetId`  | UUID NULL          | 操作目标 ID                                   |
| `detail`    | JSON NULL          | 操作详情（变更前后值等）                       |
| `actedAt`   | TIMESTAMP          | 操作时间                                      |

---

#### `RetentionPolicy` — 数据保留策略

| 字段              | 类型         | 说明                                      |
|-----------------|-------------|-------------------------------------------|
| `id`            | UUID PK      | 主键                                      |
| `dataType`      | VARCHAR(50)  | 数据类型（leave/injury/construction-log/…）|
| `retentionYears`| INT          | 保留年限（-1 表示永久，仅 OperationLog 使用）|
| `warnBeforeDays`| INT DEFAULT 30 | 到期前多少天提醒                         |

---

#### `SystemConfig` — 系统参数

| 字段          | 类型         | 说明                                      |
|-------------|-------------|-------------------------------------------|
| `configKey` | VARCHAR(100) PK | 配置键（如 `payroll.payDay`、`window.durationDays`）|
| `configValue`| TEXT         | 配置值（字符串/JSON）                     |
| `description`| VARCHAR(200) | 配置说明                                 |

---

## 7. API 设计规范

### 7.1 请求约定

所有请求携带设备类型头，后端返回对应配置：

```
Authorization: Bearer {jwt_token}
X-Client-Type: web     # Web 浏览器端
X-Client-Type: mp      # 企业微信小程序端
```

### 7.2 统一响应格式

```jsonc
// 单个资源
{ "id": "...", ...fields }

// 列表（分页）
{ "items": [...], "total": 100, "page": 1, "pageSize": 20 }

// 操作成功
{ "success": true }

// 错误
{ "code": "VALIDATION_ERROR", "message": "工号不能为空", "details": [...] }
```

**Action 端点命名约定**（非 CRUD 的资源操作统一用动词后缀）：

```
POST /{resource}/{id}/approve        # 审批通过
POST /{resource}/{id}/reject         # 审批驳回
POST /{resource}/{id}/recall         # 追溯驳回
POST /{resource}/{id}/close          # 提前关闭
POST /{resource}/{id}/derive         # 派生新资源
POST /{resource}/{id}/settle         # 执行结算
POST /{resource}/{id}/confirm        # 签名确认
POST /{resource}/import/preview      # 导入预览（两步操作第一步）
POST /{resource}/import/apply        # 导入提交（两步操作第二步）
```

### 7.3 认证

| 方法   | 路径              | 说明                              |
|--------|------------------|-----------------------------------|
| POST   | `/auth/login`    | 工号+密码登录（返回 JWT + 员工信息）|
| POST   | `/auth/wework`   | 企业微信 OAuth（预留，返回 501）   |

---

### 7.4 员工与组织

#### 员工 `/employees`

| 方法   | 路径                                | 说明                              | 权限          |
|--------|-------------------------------------|-----------------------------------|---------------|
| GET    | `/employees`                        | 列表（分页，支持岗位/角色/状态筛选）| finance / ceo |
| POST   | `/employees`                        | 新建员工（同时创建账号）            | ceo           |
| GET    | `/employees/{id}`                   | 员工详情                           | self / pm(项目) / finance / ceo |
| PUT    | `/employees/{id}`                   | 更新档案（基本信息）               | finance(基本) / ceo(全部) |
| PATCH  | `/employees/{id}/status`            | 启用/禁用账号                      | ceo           |
| PATCH  | `/employees/{id}/password/reset`    | 重置密码                           | ceo           |
| PATCH  | `/employees/{id}/salary-override`   | 个人薪资覆盖（提交 CEO 审批）       | finance       |
| POST   | `/employees/import/preview`         | Excel 导入预览（返回校验结果）      | ceo / finance |
| POST   | `/employees/import/apply`           | Excel 导入提交（批量建档建账）      | ceo / finance |

#### 岗位 `/positions`

| 方法   | 路径                              | 说明                    | 权限          |
|--------|-----------------------------------|-------------------------|---------------|
| GET    | `/positions`                      | 岗位列表                | finance / ceo |
| POST   | `/positions`                      | 新建岗位                | ceo           |
| GET    | `/positions/{id}`                 | 岗位详情（含等级列表）  | finance / ceo |
| PUT    | `/positions/{id}`                 | 更新岗位配置（需 CEO 审批）| ceo         |
| DELETE | `/positions/{id}`                 | 删除（无员工时可删）    | ceo           |
| GET    | `/positions/{id}/levels`          | 等级列表                | finance / ceo |
| POST   | `/positions/{id}/levels`          | 新建等级                | ceo           |
| PUT    | `/positions/{id}/levels/{levelId}`| 更新等级                | ceo           |
| DELETE | `/positions/{id}/levels/{levelId}`| 删除等级                | ceo           |

#### 组织架构 `/org`

| 方法   | 路径                         | 说明                              | 权限 |
|--------|------------------------------|-----------------------------------|------|
| GET    | `/org/tree`                  | 全员组织架构树（按 directSupervisorId 构建） | ceo  |
| PATCH  | `/org/supervisor/{employeeId}` | 修改员工直系领导                 | ceo  |

#### 部门 `/departments`

| 方法   | 路径                  | 说明       | 权限 |
|--------|-----------------------|------------|------|
| GET    | `/departments`        | 部门树     | all  |
| POST   | `/departments`        | 新建部门   | ceo  |
| PUT    | `/departments/{id}`   | 编辑部门   | ceo  |
| DELETE | `/departments/{id}`   | 删除部门   | ceo  |

#### 项目 `/projects`

| 方法   | 路径                            | 说明           | 权限              |
|--------|---------------------------------|----------------|-------------------|
| GET    | `/projects`                     | 项目列表       | pm(本人) / ceo    |
| POST   | `/projects`                     | 新建项目       | ceo               |
| GET    | `/projects/{id}`                | 项目详情       | pm(本项目) / ceo  |
| PUT    | `/projects/{id}`                | 编辑项目       | ceo               |
| DELETE | `/projects/{id}`                | 归档项目       | ceo               |
| GET    | `/projects/{id}/members`        | 成员列表       | pm / ceo          |
| POST   | `/projects/{id}/members`        | 添加成员       | ceo               |
| DELETE | `/projects/{id}/members/{empId}`| 移除成员       | ceo               |

---

### 7.5 考勤业务

#### 请假 `/attendance/leaves`

| 方法   | 路径                               | 说明                          |
|--------|------------------------------------|-------------------------------|
| GET    | `/attendance/leaves`               | 我的请假记录（self）/全部（finance/ceo）|
| POST   | `/attendance/leaves`               | 提交请假申请                  |
| POST   | `/attendance/leaves/retroactive`   | 追溯请假（任意时刻补录）       |
| POST   | `/attendance/leaves/{id}/approve`  | 审批通过                      |
| POST   | `/attendance/leaves/{id}/reject`   | 审批驳回                      |

#### 加班通知 `/overtime-notifications`

| 方法   | 路径                                        | 说明                               |
|--------|---------------------------------------------|------------------------------------|
| GET    | `/overtime-notifications`                   | 通知列表（发起人视角/接收人视角）   |
| POST   | `/overtime-notifications`                   | 发起加班通知（PM 或 CEO）          |
| POST   | `/overtime-notifications/{id}/respond`      | 员工确认/拒绝通知                  |
| POST   | `/overtime-notifications/{id}/close`        | 提前关闭通知（CEO）                |

#### 自补加班 `/attendance/overtime-self-reports`

| 方法   | 路径                                              | 说明               |
|--------|---------------------------------------------------|--------------------|
| POST   | `/attendance/overtime-self-reports`               | 发起自补加班申请   |
| POST   | `/attendance/overtime-self-reports/{id}/approve`  | 直系领导初审通过   |
| POST   | `/attendance/overtime-self-reports/{id}/reject`   | 驳回               |

#### 工伤补偿 `/forms/injuries`

| 方法   | 路径                              | 说明                              |
|--------|-----------------------------------|-----------------------------------|
| GET    | `/forms/injuries`                 | 工伤申请列表                      |
| POST   | `/forms/injuries`                 | 提交工伤申请（支持 proxyEmployeeId）|
| POST   | `/forms/injuries/{id}/approve`    | 审批通过                          |
| POST   | `/forms/injuries/{id}/reject`     | 审批驳回                          |
| POST   | `/injury-claims`                  | 录入理赔金额（finance，关联薪资周期）|

---

### 7.6 施工日志

#### 日志 `/construction-logs`

| 方法   | 路径                                   | 说明                          |
|--------|----------------------------------------|-------------------------------|
| GET    | `/construction-logs`                   | 日志列表（按项目/日期/状态筛选）|
| POST   | `/construction-logs`                   | 提交施工日志（含 workItems）   |
| PATCH  | `/construction-logs/{id}/review`       | 审批（含 pmNote）             |
| POST   | `/construction-logs/{id}/recall`       | CEO 追溯驳回（→ RECALLED）    |

#### 工作项模板 `/work-item-templates`

| 方法   | 路径                                  | 说明             |
|--------|---------------------------------------|------------------|
| GET    | `/work-item-templates`                | 模板列表         |
| POST   | `/work-item-templates`                | 新建模板         |
| PUT    | `/work-item-templates/{id}`           | 编辑模板         |
| DELETE | `/work-item-templates/{id}`           | 删除模板         |
| POST   | `/work-item-templates/{id}/derive`    | 派生新模板       |

#### 里程碑与进度 `/projects/{id}/milestones`

| 方法   | 路径                                      | 说明                 |
|--------|-------------------------------------------|----------------------|
| GET    | `/projects/{id}/milestones`               | 里程碑列表           |
| POST   | `/projects/{id}/milestones`               | 新建里程碑           |
| PUT    | `/projects/{id}/milestones/{milestoneId}` | 编辑里程碑           |
| DELETE | `/projects/{id}/milestones/{milestoneId}` | 删除里程碑           |
| POST   | `/projects/{id}/progress`                 | 确认今日进度         |
| GET    | `/projects/{id}/dashboard`               | Dashboard 数据（折线图/里程碑/工作项汇总）|
| POST   | `/projects/{id}/construction-summary`     | 生成汇总报告（通知 CEO）|
| GET    | `/projects/{id}/construction-summary`     | 汇总报告列表         |

---

### 7.7 薪资

#### 结算周期 `/payroll/cycles`

| 方法   | 路径                                         | 说明                          |
|--------|----------------------------------------------|-------------------------------|
| GET    | `/payroll/cycles`                            | 周期列表                      |
| POST   | `/payroll/cycles/{id}/settle`                | 执行正式结算（周期锁定）       |
| POST   | `/payroll/cycles/{id}/correction`            | 发起更正申请（finance）        |
| POST   | `/payroll/cycles/{id}/correction/approve`    | 批准更正申请（CEO）            |

#### 窗口期 `/payroll/window-periods`

| 方法   | 路径                                              | 说明                 |
|--------|---------------------------------------------------|----------------------|
| GET    | `/payroll/window-periods/{cycleId}/status`        | 各员工数据完整状态   |
| POST   | `/payroll/window-periods/{cycleId}/close`         | 提前关闭（CEO）      |

#### 工资单 `/payroll/slips`

| 方法   | 路径                              | 说明                        |
|--------|-----------------------------------|-----------------------------|
| GET    | `/payroll/slips`                  | 工资单列表（self/finance/ceo）|
| GET    | `/payroll/slips/{id}`             | 工资单详情                  |
| POST   | `/payroll/slips/{id}/confirm`     | 电子签名确认                |
| POST   | `/payroll/slips/{id}/dispute`     | 发起异议                    |

#### 预结算例外 `/payroll/cycles/{id}/exception`

| 方法   | 路径                                       | 说明                  |
|--------|--------------------------------------------|-----------------------|
| POST   | `/payroll/cycles/{id}/exception`           | 发起例外申请（finance）|
| POST   | `/payroll/cycles/{id}/exception/approve`   | 批准例外申请（CEO）    |

#### 工资确认协议 `/salary-confirmation-agreement`

| 方法   | 路径                                  | 说明                    |
|--------|---------------------------------------|-------------------------|
| GET    | `/salary-confirmation-agreement/current` | 当前生效版本         |
| POST   | `/salary-confirmation-agreement`      | 上传新版本（CEO）       |

---

### 7.8 电子签名 `/signature`

| 方法   | 路径                   | 说明                              |
|--------|------------------------|-----------------------------------|
| GET    | `/signature/status`    | 查询当前员工签名绑定状态           |
| POST   | `/signature/bind`      | 首次绑定手写签名（含 PNG Base64）  |
| POST   | `/signature/set-pin`   | 设置/修改签名 PIN 码               |

---

### 7.9 权限与配置

| 方法   | 路径                          | 说明                          |
|--------|-------------------------------|-------------------------------|
| GET    | `/roles`                      | 角色列表                      |
| POST   | `/roles`                      | 新建自定义角色（CEO）         |
| PUT    | `/roles/{roleCode}`           | 更新角色权限                  |
| DELETE | `/roles/{roleCode}`           | 删除自定义角色（CEO）         |
| GET    | `/page-config/{routeCode}`    | 下发页面配置（菜单/按钮/字段）|
| GET    | `/approval/flows`             | 审批流配置列表                |
| PUT    | `/approval/flows/{type}`      | 修改审批流                    |
| GET    | `/retention/policies`         | 数据保留策略                  |
| PUT    | `/retention/policies/{type}`  | 修改保留策略（CEO）           |
| GET    | `/notifications`              | 通知列表                      |
| POST   | `/notifications/{id}/read`    | 标记已读                      |
| GET    | `/workbench/summary`          | 工作台聚合摘要（按角色）       |

---

### 7.10 系统管理（仅 Sysadmin）

| 方法   | 路径                          | 说明                          |
|--------|-------------------------------|-------------------------------|
| GET    | `/setup/status`               | 初始化完成度检查              |
| POST   | `/setup/company`              | 设置公司基本信息              |
| POST   | `/setup/init-ceo`             | 创建首个 CEO 账号（一次性）   |
| PUT    | `/setup/default-roles`        | 调整预置角色权限              |
| PUT    | `/setup/default-workflows`    | 调整默认审批流配置            |
| PUT    | `/setup/retention-defaults`   | 设置数据保留默认值            |
| GET    | `/system/logs`                | 系统操作日志                  |
| POST   | `/system/backup`              | 触发全量备份                  |
| PUT    | `/system/reset-password`      | 重置任意用户密码              |

---

## 8. 文件存储

### 8.1 存储决策

**原始文件存服务器本地文件系统，数据库只存 `AttachmentMeta` 元数据。**

理由：
- 内网 OA 场景，200 人规模，本地 FS 读写性能远优于 DB BLOB；
- 数据库存文件会导致备份体积暴涨，影响主库 I/O；
- 文件与元数据分离，清理时只需删物理文件 + 元数据记录，不影响业务表；
- 未来如需迁移到对象存储（MinIO/OSS），只需替换 `StorageService` 实现，业务代码不变。

### 8.2 目录结构

```
/uploads/
  {businessType}/          # leave / injury / construction-log /
                           # payroll-confirm / signature / export
    {yyyy-MM}/             # 按月归档
      {UUID}.{ext}         # 文件以 UUID 命名，防止冲突

例：
  /uploads/leave/2026-04/3f8a1c2d-xxxx.jpg
  /uploads/payroll-confirm/2026-04/b72cxxxx.pdf
  /uploads/signature/{employeeId}-sig.enc        # 签名图加密存储（不分月）
  /uploads/salary-agreement/v3-agreement.pdf     # 工资确认协议（覆盖式存储）
  /uploads/export/2026-04/backup-xxxx.zip
```

### 8.3 清理流程

```
识别到期数据 → 定位业务记录 → 查找 AttachmentMeta
→ 删除物理文件（失败则进重试队列，记录 cleanup_task）
→ 删除 AttachmentMeta 记录
→ 删除业务表记录
→ 写入审计日志（OperationLog）

注：物理文件删除失败不得标记清理完成；多次失败后转人工补偿。
```

---

## 9. 电子签名架构

### 9.1 签署流程

```
首次签署（签名未绑定）：
  1. 展示工资确认协议（如 CEO 已上传协议）→ 员工滚动到底部确认已读
  2. 进入 Canvas 手写签名页 → 员工手写 → 预览确认
  3. 设置签名 PIN 码（4-6 位数字，独立于登录密码）
  4. 后端：保存加密签名图 + PIN bcrypt 哈希 → 写入 EmployeeSignature
  5. 执行后续签署流程（见下）

后续签署（签名已绑定）：
  1. 若协议有新版本（agreementVersion 不匹配） → 强制重新阅读协议
  2. 展示签名预览图 + 意图声明文本
     （"本人已阅读并确认上述工资明细，同意结算结果"）
  3. 员工输入 PIN → 后端 bcrypt 比对
  4. 后端：生成 PayrollConfirmation（完整证据链）
  5. 后端：生成签署 PDF（明细 + 签名叠加 + 时间戳水印）→ 存服务器 FS
  6. 工资单状态变为 CONFIRMED
```

意图声明文本由系统硬编码（版本化），不随工资确认协议变动。

### 9.2 SignatureProvider 抽象

```
SignatureProvider（接口）
  ├── LocalSignatureProvider    # 当前实现：自建存证（iText PDF + AES 加密）
  └── EsignSignatureProvider    # 预留：e签宝 CA（配置项 signature.provider=esign 开关）
```

---

## 10. 员工档案 Excel 导入

### 10.1 功能说明

支持一键通过 Excel 批量创建员工账号和档案，适用于系统初始化时的人员录入。
上传后先预览校验，确认无误后提交，避免脏数据入库。

### 10.2 Excel 模板字段

| 列名（表头）   | 字段           | 是否必填 | 说明                              |
|-------------|----------------|---------|-----------------------------------|
| 工号         | `employeeNo`   | 必填     | 唯一，作为登录用户名              |
| 姓名         | `name`         | 必填     |                                   |
| 手机号       | `phone`        | 必填     |                                   |
| 邮箱         | `email`        | 可选     |                                   |
| 岗位编码     | `positionCode` | 必填     | 需与系统中已存在的岗位编码匹配     |
| 等级名称     | `levelName`    | 可选     | 需与岗位下已存在的等级名称匹配     |
| 角色         | `roleCode`     | 可选     | 留空则取岗位默认角色              |
| 入职日期     | `entryDate`    | 必填     | 格式 `YYYY-MM-DD`                  |
| 初始密码     | `initPassword` | 可选     | 留空则系统生成随机密码（首次登录强制修改）|

### 10.3 接口流程

```
POST /employees/import/preview
  Request: multipart/form-data { file: .xlsx }
  Response: {
    "total": 50,
    "valid": 48,
    "invalid": 2,
    "errors": [
      { "row": 5, "field": "positionCode", "message": "岗位编码 'PM001' 不存在" },
      { "row": 12, "field": "employeeNo", "message": "工号 'E003' 已存在" }
    ],
    "preview": [{ "employeeNo": "...", "name": "...", ... }]
  }

POST /employees/import/apply
  Request: { "sessionToken": "{预览接口返回的临时 token}" }
  Response: { "created": 48, "skipped": 2 }
```

预览 Token 有效期 10 分钟，超时需重新上传。

---

## 11. 企业微信接入（预留）

企业微信能力通过 `WeworkService` 模块封装，待 `corpId / agentId / secret` 就绪后替换实现：

- **企业微信 OAuth 身份登录**：`/auth/wework`，当前返回 501
- **通讯录批量导入**：当前使用 mock 数据（不同于 Excel 导入，这是从企业微信 API 拉取）
- **应用消息推送**：审批通知、工资条发布、到期提醒（当前为系统内通知）
- **小程序内发起联系人会话**：PM/CEO 可直接联系员工

