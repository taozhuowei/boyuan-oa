# 博渊 OA 平台 — 技术架构文档

> **文档职责**：描述博渊平台的技术选型、系统架构、各引擎的设计模型、通用数据模型和 API 规范。
>
> **目标读者**：后端架构师、技术负责人。
>
> **不包含内容**：具体的代码实现细节（见 `backend_impl.md`）；前端实现细节（见 `frontend_impl.md`）；业务规则与权限配置（见 `design.md`）。

---

## 0. 设计原则

**原则一：配置驱动，平台与业务解耦**
平台不内置具体业务逻辑（如"请假审批需要项目经理初审"）。所有业务规则以配置形式存储，平台引擎读取配置并执行，同一套代码可服务不同行业的企业。

**原则二：渐进式接入，开箱即用**
平台提供预置方案（`presets/`），企业直接采用最接近自身需求的预置方案，经 Sysadmin 初始化向导快速上线，无需从零配置。

**原则三：系统管理与业务运营分层**
系统实施/运维人员（Sysadmin）与企业内部业务用户（CEO、财务等）使用独立账号体系和操作界面，二者职责不交叉，平台稳定性不依赖业务用户操作。

**原则四：存证与合规优先**
薪资确认、审批记录等法律敏感操作原生支持电子签名、操作留痕、数据完整性校验，满足劳动合同法相关合规要求。

---

## 1. 系统架构

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          客户端层（Client Layer）                          │
│  ┌─────────────────────────────┐   ┌──────────────────────────────────┐  │
│  │    企业微信工作台小程序        │   │    Web 浏览器（PC / 平板 / 手机）  │  │
│  │  Vant 4.9 · uni-app · MP   │   │  Ant Design Vue 4 · uni-app · H5 │  │
│  └──────────────┬──────────────┘   └────────────────┬─────────────────┘  │
│                 └──────────────────┬─────────────────┘                   │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │  REST API · JWT Bearer Token
                                    │  X-Client-Type: mp | web
┌───────────────────────────────────▼────────────────────────────────────┐
│                          Spring Boot 后端                                │
│                                                                          │
│  ╔══════════════════════════════════════════════════════════════════╗    │
│  ║          预置与初始化层（Preset & Initialization Layer）           ║    │
│  ║  preset-{行业}.sql → 部署时写入角色/权限/审批流/薪资规则/保留期    ║    │
│  ║  Init Wizard（步骤 1–10）→ Sysadmin 在预置基础上个性化配置        ║    │
│  ╚══════════════════════════════════════════════════════════════════╝    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              核心层（Core Layer · 始终加载，不可关闭）               │   │
│  │  auth │ employee │ org │ approval_engine │ notify │ sys │ sign   │   │
│  └────────────────────────────────┬─────────────────────────────────┘   │
│                                   │                                      │
│  ┌────────────────────────────────▼─────────────────────────────────┐   │
│  │                  集成层（Integration Layer）                        │   │
│  │   ApplicationEvent 事件总线（异步）│ Port Interface 接口（同步读）    │   │
│  └───┬──────────┬──────────┬───────────┬──────────┬─────────────────┘   │
│      │          │          │           │          │                      │
│  ┌───▼────┐  ┌───▼────┐  ┌────▼────┐  ┌───▼────┐  ┌───▼──────────┐    │
│  │ 考勤   │  │ 薪资   │  │项目管理 │  │施工专属 │  │ 数据生命周期 │    │
│  │ atd_* │  │ pay_* │  │ prj_*  │  │ con_*  │  │   dlc_*     │    │
│  └────────┘  └────────┘  └─────────┘  └────────┘  └──────────────┘    │
│       各业务模块由 modules.yml 独立开关控制，互不直接依赖                  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
             ┌─────────────────────┼──────────────────────┐
             ▼                     ▼                      ▼
        ┌──────────┐         ┌──────────┐          ┌──────────┐
        │PostgreSQL│         │ 文件存储  │          │ 企业微信  │
        │（核心表  │         │ /uploads │          │   API    │
        │+模块分表）│         │ 本地 FS  │          │（预留）   │
        └──────────┘         └──────────┘          └──────────┘
```

---

## 2. 技术栈

| 层               | 技术                    | 版本 / 说明          |
|------------------|-------------------------|----------------------|
| 前端框架          | uni-app + Vue 3 + Vite  | 编译到小程序 + H5    |
| 前端组件库（H5）  | Ant Design Vue 4.x      | PC/平板/手机浏览器   |
| 前端组件库（MP）  | Vant 4.9.x              | 企业微信小程序        |
| 后端框架          | Spring Boot 3           | Java 17              |
| 安全              | Spring Security + JWT   | Bearer Token         |
| ORM               | MyBatis-Plus            | 逻辑删除、自动填充    |
| 数据库            | PostgreSQL              | 主数据 + 索引        |
| 文件存储          | 本地 FS                 | 可扩展为 MinIO/OSS   |

---

## 3. 分层架构

后端内部五层，从上至下依次驱动：

```
┌──────────────────────────────────────────────────────────┐
│  预置层（Preset Layer）                                    │
│  preset-{行业}.sql → 部署时一次性写入                       │
│  角色 / 权限 / 审批流 / 薪资规则 / 数据保留期默认值           │
└──────────────────────────┬───────────────────────────────┘
                           │ 部署时写入 DB，向导前已就绪
┌──────────────────────────▼───────────────────────────────┐
│  配置层（Config Layer）                                    │
│  Init Wizard（步骤 1–10）→ 个性化调整预置值                │
│  运营期：CEO / 财务 / HR 动态维护角色、审批流、薪资规则等    │
└──────────────────────────┬───────────────────────────────┘
                           │ 配置读取
┌──────────────────────────▼───────────────────────────────┐
│  核心引擎层（Core Engine Layer · 始终加载）                 │
│  权限引擎 / 工作流引擎 / 表单引擎 / 薪资引擎                │
│  通知引擎 / 签名引擎 / 数据生命周期引擎                     │
└──────────────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│  集成层（Integration Layer）                               │
│  ApplicationEvent 事件总线（跨模块异步通信）                │
│  Port Interface 接口（跨模块同步数据读取）                  │
│  模块 A 不直接依赖模块 B 的 Service / Repository            │
└──────────────────────────┬───────────────────────────────┘
                           │ 事件 / 端口调用
┌──────────────────────────▼───────────────────────────────┐
│  业务模块层（Business Module Layer）                        │
│  由 modules.yml 按需加载，各模块独立，可随时增减            │
│  考勤(atd_*) / 薪资(pay_*) / 项目(prj_*) /                │
│  施工专属(con_*) / 报销 / 数据生命周期(dlc_*)              │
└──────────────────────────────────────────────────────────┘
```

---

## 4. 模块划分

| 模块域       | 职责                                                  | 核心类                                                                  |
|-------------|-------------------------------------------------------|-------------------------------------------------------------------------|
| 身份与组织   | 认证、员工档案、部门、项目、角色、岗位                   | `AuthController`, `EmployeeController`, `RoleController`, `PositionController` |
| 系统管理     | Sysadmin 初始化、公司配置、账号重置                       | `SetupController`, `SystemController`                                   |
| 配置域       | 权限项、表单类型、假期类型、审批流定义、薪资项、数据保留策略 | `PermissionController`, `FormTypeDefController`, `LeaveTypeDefController`, `PayrollItemDefController`, `ApprovalFlowController`, `RetentionController` |
| 业务域       | 具体业务单据（请假、加班、工伤、施工日志）、审批记录        | `AttendanceController`, `FormController`, `ApprovalService`             |
| 薪资域       | 工资周期、工资单、工资项、确认记录、更正单                  | `PayrollController`, `PayrollEngine`                                    |
| 签名域       | 手写签名绑定、工资条签署、存证 PDF 生成                   | `SignatureController`, `EvidenceService`                                |
| 保留清理域   | 到期提醒、清理任务、备份导出                              | `CleanupScheduler`, `BackupController`                                  |

---

## 5. 引擎设计

### 5.1 权限引擎

权限由三条独立线决定：

```
① 能做什么操作  →  role.permissionCodes（RBAC，按钮/接口级）
                    来源：Permission 表，Admin 预置 + 可扩展
② 看到哪些模块  →  position.featureFlags（岗位特性标志，菜单级）
③ 看到多大范围  →  roleCode → dataScope 静态映射（GLOBAL/PROJECT/SELF）
```

三条线独立，互不推导：
- **Permission 表**：存储所有可授权的操作项（code/name/category），Admin 初始化时写入预置权限，后续可扩展新权限项而无需改代码
- **数据范围**：`GLOBAL`（全局）/ `PROJECT`（同项目）/ `SELF`（本人），在 `RolePermission` 中静态配置
- **菜单动态下发**：后端根据岗位 featureFlags 构建菜单树，通过 `GET /page-config/{routeCode}` 下发

### 5.2 工作流引擎

每种业务类型对应一个审批流定义（`ApprovalFlowDef`），由有序节点列表组成。

**节点审批人确定方式：**
```
DIRECT_SUPERVISOR → 取提交人的直系领导（无领导时兜底 CEO）
ROLE              → 取指定 roleCode（如 ceo、finance）
DESIGNATED        → 提交人在提交时从可选列表中指定（用于多 PM 场景）
```

**多 PM 场景（DESIGNATED 模式）：**
提交含 PM 节点的表单时（施工日志、工伤补偿），提交人调用 `GET /projects/{id}/members?role=PM` 获取 PM 列表，在 body 中携带 `assignedReviewerId` 选择一位。审批引擎直接将节点指派给该员工，走标准单审批人路径，无并发问题。

状态流转：
```
提交 → PENDING
     → 节点1审批 → APPROVING
     → 节点N审批 → APPROVED
                 → REJECTED（可重新发起）
APPROVED → ARCHIVED
```

**节点动态跳过（skipCondition）：**
`ApprovalFlowNode.skipCondition` 为 JSON 字段，引擎推进到该节点时求值，条件满足则将节点标记为 `SKIPPED` 并推进到下一节点。当前支持的条件类型：
```json
{ "type": "SUBMITTER_ROLE_MATCH", "roleCode": "project_manager" }
```
具体业务场景（哪些审批流使用了此功能）见 `design.md §5`。

约束：
- 当前版本不支持条件分支（多路径）
- 流程变更仅对新提交单据生效，不影响历史在途单据

### 5.3 表单引擎

```
GET /page-config/{routeCode}?clientType=web|mp
→ 返回：字段列表、校验规则、选项列表、操作按钮配置、数据绑定规则

GET /forms/config?formType={type}
→ 返回：表单字段、审批流节点预览、附件配置
```

前端内置容器组件（`FormContainer`、`ListContainer`、`DetailContainer`），接收配置 JSON 并渲染，无硬编码业务字段。

### 5.4 薪资引擎

> 窗口期时长、预结算强制检查条件、各岗位计算公式等业务规则见 `design.md §6`。本节只描述引擎技术实现。

**算薪输入来源：**
```
员工档案（Position/PositionLevel/个人覆盖）
+ 考勤记录（AttendanceRecord）
+ 已批准的请假/加班/工伤单据（FormRecord）
+ PayrollItemDef 自定义费目规则
```

**月结状态机：**
```
CREATED → WINDOW_OPEN（窗口期开放员工确认数据）
        → WINDOW_CLOSED（到期自动关闭，Scheduler 触发，无手动关闭接口）
        → PRE_CHECK（引擎执行前置检查，检查条件见 design.md §6.2）
        → LOCKED（正式结算，生成 PayrollSlip）
        → CORRECTION（CEO 审批解锁）→ LOCKED（重算，version 递增）
```

**多版本设计：** 更正生成新版本（`payroll_slip.version++`），历史版本 `status=SUPERSEDED`，物理保留，不可篡改。

**P3 短周期（日结/周结）：** 无窗口期，直接推送工资单；员工有异议直接上报，不走预结算流程。

---

## 6. 核心数据模型

> **通用字段规范**：所有实体均包含 `created_at TIMESTAMP`（创建时间）、`updated_at TIMESTAMP`（最后修改时间）、`deleted BOOLEAN DEFAULT FALSE`（MyBatis-Plus 逻辑删除）。下表中省略这三个字段。

---

### 6.1 员工与组织

#### `Employee` — 员工档案（兼账号）

> 账号与档案合并，员工即系统用户。`employeeNo` 作为登录用户名，`phone` 也可作为登录凭证。
> Sysadmin 是独立系统管理账号，不存入此表。
> `employeeType` 由所属岗位 `positionName` 自动同步（存中文，如"项目经理"、"架子工"），不可手动修改。

| 字段                  | 类型                   | 说明                                          |
|---------------------|------------------------|-----------------------------------------------|
| `id`                | UUID PK                | 主键                                          |
| `employeeNo`        | VARCHAR(20) UNIQUE     | 工号，同时作为登录用户名                        |
| `passwordHash`      | VARCHAR(60)            | bcrypt 加密密码（初始默认值 `123456`）         |
| `isDefaultPassword` | BOOLEAN DEFAULT TRUE   | 是否仍使用默认密码，登录时持续提醒修改          |
| `name`              | VARCHAR(50)            | 姓名                                          |
| `phone`             | VARCHAR(20) UNIQUE     | 手机号，支持手机号登录                         |
| `email`             | VARCHAR(100) NULL      | 邮箱（可选）                                  |
| `positionId`        | UUID FK → Position     | 所属岗位，决定薪资规则和功能入口               |
| `levelId`           | UUID FK → PositionLevel NULL | 等级（可选），覆盖岗位默认薪资/假期        |
| `roleCode`          | VARCHAR FK → Role      | 操作权限角色（默认取 position.defaultRoleCode）|
| `employeeType`      | VARCHAR(50)            | 由岗位自动同步，中文存储（如"项目经理"、"混凝土工"），不可手动修改 |
| `directSupervisorId`| UUID FK → Employee NULL | 直系领导，审批路由第一节点                    |
| `departmentId`      | UUID FK → Department NULL | 所属部门                                  |
| `accountStatus`     | ENUM(ACTIVE, DISABLED) | 账号状态，DISABLED 不可登录                   |
| `entryDate`         | DATE                   | 入职日期                                      |
| `leaveDate`         | DATE NULL              | 离职日期，NULL 表示在职                        |

---

#### `Position` — 岗位

> 岗位是员工与薪资规则的连接点，同时通过 `positionFeatures` 控制功能模块入口。
> 假期扣款比例通过 `LeaveTypeDef` 行式配置，社保通过 `SocialInsuranceItem` 行式配置，不再使用 JSON 字段。

| 字段                    | 类型                   | 说明                                          |
|------------------------|------------------------|-----------------------------------------------|
| `id`                   | UUID PK                | 主键                                          |
| `positionCode`         | VARCHAR(50) UNIQUE     | 岗位编码（不可重复，用于程序引用）             |
| `positionName`         | VARCHAR(100)           | 显示名称（如"项目经理"、"架子工"）             |
| `defaultRoleCode`      | VARCHAR FK → Role      | 新建员工时的默认角色                           |
| `parentPositionCode`   | VARCHAR NULL           | 上级岗位编码，用于组织架构兜底路由             |
| `positionFeatures`     | VARCHAR(500) NULL      | 功能开关集合（JSON 数组，如 `["CONSTRUCTION_LOG"]`）|
| `performanceBase`      | DECIMAL DEFAULT 0      | 绩效基数（元/月）；0 表示无绩效奖金            |
| `baseSalary`           | DECIMAL                | 基本工资基准（元/月）                          |
| `overtimeBaseType`     | ENUM(BASE, TOTAL, CUSTOM)| 加班费计算基准：基本工资/全部工资/自定义金额  |
| `overtimeBaseAmount`   | DECIMAL NULL           | 自定义加班基准金额（overtimeBaseType=CUSTOM 时有效）|
| `overtimeRateWeekday`  | DECIMAL DEFAULT 1.5    | 平日加班倍数                                  |
| `overtimeRateWeekend`  | DECIMAL DEFAULT 2.0    | 周末加班倍数                                  |
| `overtimeRateHoliday`  | DECIMAL DEFAULT 3.0    | 法定节假日加班倍数                             |
| `annualLeave`          | INT                    | 年假天数（天/年）                              |
| `leaveDeductBaseType`  | ENUM(BASE, TOTAL, CUSTOM)| 请假扣款计算基准                             |
| `socialInsuranceMode`  | ENUM(COMPANY_PAID, MERGED)| 社保处理：公司代缴 / 并入工资               |

---

#### `LeaveTypeDef` — 假期类型定义

> 行式配置替代 JSON，CEO/财务可在后台管理假期类型及扣款比例。
> 与岗位解耦：所有岗位共享此定义，系统预置常见类型，可自定义扩展。

| 字段              | 类型               | 说明                                      |
|------------------|-------------------|-------------------------------------------|
| `id`             | UUID PK            | 主键                                      |
| `code`           | VARCHAR(50) UNIQUE | 假期类型编码（如 `annual_leave`）          |
| `name`           | VARCHAR(50)        | 显示名称（如"年休假"、"事假"）             |
| `deductionRate`  | DECIMAL DEFAULT 1.0| 扣款比例（1.0=全额扣，0.5=半额，0=不扣）  |
| `isEnabled`      | BOOLEAN DEFAULT TRUE | 是否启用（关闭后请假表单不显示此类型）    |
| `isSystem`       | BOOLEAN            | true 表示系统内置，不可删除（仅可禁用）    |
| `displayOrder`   | INT                | 表单下拉列表排序                          |

预置类型（isSystem=true）：年休假(0)、事假(1.0)、病假(0.5)、婚假(0)、产假(0)、丧假(0)。

---

#### `PositionLevel` — 岗位等级

> 等级是岗位的可选子配置。未配置等级的员工使用岗位默认值。

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

#### `SocialInsuranceItem` — 社保配置行

> 行式配置替代 JSON，按险种分行存储，支持任意组合启用/禁用。
> 每个岗位有自己的社保配置行集合，公司调整社保比例只需修改对应行。

| 字段              | 类型               | 说明                                      |
|------------------|-------------------|-------------------------------------------|
| `id`             | UUID PK            | 主键                                      |
| `positionId`     | UUID FK → Position | 所属岗位                                  |
| `name`           | VARCHAR(50)        | 险种名称（如"养老保险"、"医疗保险"）       |
| `employeeRate`   | DECIMAL            | 个人缴纳比例（如 0.08 = 8%）              |
| `companyRate`    | DECIMAL            | 公司缴纳比例（如 0.16 = 16%）             |
| `isEnabled`      | BOOLEAN DEFAULT TRUE | 是否启用（公司不缴某险种时设为 false）    |
| `displayOrder`   | INT                | 工资单展示顺序                            |

---

#### `Department` — 部门

> 用途：① 数据范围边界（DEPARTMENT dataScope）② 组织架构展示 ③ 审批流部门主管节点依据

| 字段         | 类型               | 说明                                |
|-------------|-------------------|-------------------------------------|
| `id`        | UUID PK            | 主键                                |
| `parentId`  | UUID FK NULL       | 父部门 ID（NULL 为根节点）           |
| `name`      | VARCHAR(100)       | 部门名称                            |
| `sort`      | INT                | 同级排序                            |

---

#### `Project` — 项目

> 项目经理通过 `ProjectMember` 关联，`role=PM` 的成员即为项目经理，支持多个。
> CEO 可直接修改 `logCycleDays` 配置施工日志申报周期，无需审批。

| 字段              | 类型               | 说明                                |
|------------------|-------------------|-------------------------------------|
| `id`             | UUID PK            | 主键                                |
| `name`           | VARCHAR(200)       | 项目名称                            |
| `status`         | ENUM(ACTIVE, CLOSED) | 项目状态                          |
| `startDate`      | DATE               | 开始日期                            |
| `actualEndDate`  | DATE NULL          | 实际结束日期（项目关闭时填写）       |
| `logCycleDays`   | INT DEFAULT 1      | 施工日志申报周期（天），CEO 直接修改  |
| `logReportCycleDays` | INT DEFAULT 1  | 施工日志汇报周期（独立配置，PM 多少天汇总一次报告）|

---

#### `ProjectMember` — 项目成员关联

| 字段          | 类型                           | 说明                         |
|--------------|-------------------------------|------------------------------|
| `projectId`  | UUID FK → Project              | 项目                         |
| `employeeId` | UUID FK → Employee             | 员工                         |
| `role`       | ENUM(PM, MEMBER) DEFAULT MEMBER | 项目角色：PM = 项目经理，MEMBER = 普通成员 |

---

### 6.2 权限配置

#### `Permission` — 权限项定义

> Admin 初始化时写入预置权限集，后续可通过后台新增权限项而无需改代码，保持可扩展性。
> 权限项编码遵循 `{资源}.{操作}` 格式，如 `employee.create`、`approval.final.approve`。

| 字段          | 类型            | 说明                               |
|-------------|-----------------|-----------------------------------|
| `id`        | UUID PK          | 主键                              |
| `code`      | VARCHAR(100) UNIQUE | 权限编码（如 `payroll.settle`）  |
| `name`      | VARCHAR(100)     | 权限名称（如"执行结算"）           |
| `category`  | VARCHAR(50)      | 权限分类（人员管理/审批/薪资/系统） |
| `description`| VARCHAR(200)    | 说明                              |
| `isEnabled` | BOOLEAN DEFAULT TRUE | 是否启用                      |
| `isSystem`  | BOOLEAN          | true 表示系统内置，不可删除        |

---

#### `Role` — 角色定义

| 字段          | 类型            | 说明                               |
|-------------|-----------------|-----------------------------------|
| `id`        | UUID PK          | 主键                              |
| `roleCode`  | VARCHAR(50) UNIQUE | 角色编码，语义稳定键（用于 JWT、skipCondition 等配置，不随数据迁移变化）|
| `roleName`  | VARCHAR(50)      | 显示名称                          |
| `isSystem`  | BOOLEAN          | true 表示系统内置角色，不可删除    |
| `description`| VARCHAR(200)    | 角色说明                          |

---

#### `RolePermission` — 角色权限项

| 字段              | 类型                        | 说明                                  |
|------------------|-----------------------------|---------------------------------------|
| `roleCode`       | VARCHAR FK → Role           | 角色编码                              |
| `permissionCode` | VARCHAR FK → Permission     | 权限项编码（引用 Permission.code）     |
| `dataScope`      | ENUM(GLOBAL, PROJECT, SELF) | 该权限项生效的数据范围                 |

---

### 6.3 审批与业务表单

#### `FormTypeDef` — 表单类型定义

> Admin 可在后台新增业务类型，不改代码。审批流定义、表单配置、权限规则均通过 `code` 关联。

| 字段         | 类型            | 说明                               |
|------------|-----------------|-----------------------------------|
| `id`       | UUID PK          | 主键                              |
| `code`     | VARCHAR(50) UNIQUE | 类型编码（如 `LEAVE`、`INJURY`） |
| `name`     | VARCHAR(100)     | 显示名称（如"请假申请"）           |
| `category` | VARCHAR(50)      | 分类（ATTENDANCE/WELFARE/PROJECT）|
| `isEnabled`| BOOLEAN DEFAULT TRUE | 是否启用                      |
| `isSystem` | BOOLEAN          | true 表示系统内置，不可删除        |

---

#### `FormRecord` — 通用业务单据

> 所有业务申请（请假/工伤/施工日志等）均使用此表。
> `submitterId` 为实际发起人（代为提交时为代提交者），`targetEmployeeId` 为实际受益员工。
> 两者相同时为本人提交，不同时为代为发起（适用于考勤代报、工伤代录等所有场景）。

| 字段             | 类型                | 说明                                          |
|----------------|---------------------|-----------------------------------------------|
| `id`           | UUID PK              | 主键                                          |
| `formType`     | VARCHAR(50) FK → FormTypeDef | 业务类型编码                          |
| `submitterId`  | UUID FK → Employee   | 发起人（代为提交时为代提交者）                  |
| `targetEmployeeId` | UUID FK → Employee | 实际受益员工（本人提交时与 submitterId 相同） |
| `projectId`    | UUID FK → Project NULL | 关联项目（施工日志必填，其他可选）            |
| `formData`     | JSON                 | 各业务类型特有字段（JSON 序列化，结构见下表）    |
| `status`       | ENUM(PENDING, APPROVING, APPROVED, REJECTED, ARCHIVED, RECALLED) | 单据状态 |
| `currentNodeOrder`| INT             | 当前处于第几个审批节点                         |
| `remark`       | VARCHAR(500) NULL    | 备注（驳回原因等）                             |

##### `formData` JSON 结构（按业务类型）

**LEAVE（请假申请）**
```json
{
  "leaveType":   "string",   // 假种：年假 | 事假 | 病假 | 婚假 | 产假
  "startDate":   "string",   // ISO 8601 日期，如 "2026-04-01"
  "endDate":     "string",   // ISO 8601 日期
  "leaveDays":   "number",   // 请假天数（含 0.5 步长）
  "reason":      "string",   // 请假原因
  "attachments": ["string"], // 附件 URL 列表，可为空数组
  "isRetroactive": "boolean" // true 表示补录（事后提交）
}
```

**OVERTIME（加班申请，项目经理/CEO 代报，针对指定员工）**
```json
{
  "overtimeDate":    "string",   // ISO 8601 日期
  "overtimeType":    "string",   // 工作日加班 | 周末加班 | 节假日加班
  "hours":           "number",   // 加班小时数
  "targetEmployees": ["string"], // 受益员工 employeeNo 列表
  "reason":          "string"    // 加班原因
}
```

**OVERTIME（加班申请，员工/劳工自报）**
```json
{
  "overtimeDate":  "string",   // ISO 8601 日期
  "overtimeType":  "string",   // 工作日加班 | 周末加班 | 节假日加班
  "hours":         "number",   // 加班小时数
  "reason":        "string",   // 加班原因
  "evidenceFiles": ["string"]  // 证明材料 URL 列表，可为空数组
}
```

**INJURY（工伤申报）**
```json
{
  "injuryDate":     "string",   // ISO 8601 日期
  "injuredPart":    "string",   // 受伤部位描述
  "description":    "string",   // 事故经过
  "medicalRecords": ["string"], // 医疗证明 URL 列表
  "proxyEmployeeNo": "string"   // 代为申报者 employeeNo，本人申报时省略
}
```

**CONSTRUCTION_LOG（施工日志）**
```json
{
  "projectId":   "number",   // 关联项目 ID（必填）
  "logDate":     "string",   // ISO 8601 日期
  "workItems": [
    {
      "name":     "string",  // 工作项名称
      "quantity": "number",  // 数量
      "unit":     "string"   // 单位，如 m² | 根 | 组
    }
  ],
  "workContent": "string",   // 当日施工情况综述，可选
  "photos":      ["string"]  // 现场照片 URL 列表，可为空数组
}
```

---

#### `ApprovalFlowDef` — 审批流定义

| 字段           | 类型            | 说明                               |
|--------------|-----------------|-----------------------------------|
| `id`         | UUID PK          | 主键                              |
| `businessType` | VARCHAR(50) FK → FormTypeDef | 对应的表单类型编码       |
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
| `approvalMode`   | ENUM(SEQUENTIAL) DEFAULT SEQUENTIAL       | 审批模式（当前仅 SEQUENTIAL，多 PM 由提交人选择，见§5.3） |
| `approverType`   | ENUM(DIRECT_SUPERVISOR, ROLE, DESIGNATED) | 审批人确定方式：直系领导/角色/提交时指定  |
| `approverRef`    | VARCHAR(200) NULL                         | ROLE 时填 roleCode；DESIGNATED 时填 employeeId；其余为 NULL |
| `skipCondition`  | JSON NULL                                 | 动态跳过条件（见§5.2），NULL 表示不跳过    |

---

#### `ApprovalRecord` — 审批操作记录

> 跟随全局保留策略（`sys_retention_policy` 默认 1 年），到期物理删除。无 `@TableLogic`，不可逻辑删除。

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
| `projectId`   | UUID FK → Project NULL | 关联项目（可选）                             |
| `initiatorId` | UUID FK → Employee    | 发起人（PM 或 CEO）                          |
| `overtimeDate`| DATE                  | 加班日期                                    |
| `overtimeType`| ENUM(WEEKDAY, WEEKEND, HOLIDAY) | 加班类型，决定补贴倍率              |
| `content`     | VARCHAR(500)          | 通知内容                                    |
| `status`      | ENUM(NOTIFIED, ARCHIVED, CLOSED) | ARCHIVED=已归档计薪，CLOSED=关闭 |

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

> 无计划日期，只记录实际完成时间。PM 拖动进度条到某里程碑时，系统记录 actualCompletionDate。

| 字段                  | 类型               | 说明                              |
|---------------------|-------------------|-----------------------------------|
| `id`                | UUID PK            | 主键                              |
| `projectId`         | UUID FK → Project  | 关联项目                          |
| `name`              | VARCHAR(200)       | 里程碑名称（如"基础浇筑完成"）    |
| `sort`              | INT                | 排序（PM 可调整顺序）              |
| `actualCompletionDate` | DATE NULL       | 实际完成日期（NULL=未完成）       |

---

#### `ProjectProgressLog` — 进度推进记录

> PM 每次拖动进度条时写入一条记录，完整保留推进历史。

| 字段               | 类型                               | 说明                          |
|------------------|-----------------------------------|-------------------------------|
| `id`             | UUID PK                            | 主键                          |
| `projectId`      | UUID FK → Project                  | 关联项目                      |
| `pmId`           | UUID FK → Employee                 | 操作的项目经理                |
| `milestoneId`    | UUID FK → ProjectMilestone         | 推进到的里程碑节点             |
| `completedAt`    | TIMESTAMP                          | 推进时间                      |
| `note`           | VARCHAR(500) NULL                  | PM 备注                       |

---

#### `ConstructionLogSummary` — 汇总报告

> 前端负责聚合计算，后端存储 PM 提交的最终结果（工作项汇总 + PM 备注）。

| 字段              | 类型                | 说明                                        |
|----------------- |---------------------|---------------------------------------------|
| `id`             | UUID PK              | 主键                                        |
| `projectId`      | UUID FK → Project    | 关联项目                                    |
| `pmId`           | UUID FK → Employee   | 生成报告的项目经理                           |
| `periodStart`    | DATE                 | 统计起始日                                  |
| `periodEnd`      | DATE                 | 统计结束日                                  |
| `aggregatedItems`| JSON                 | 工作项聚合结果 `[{name, totalQty, unit, workers[]}, …]` |
| `workerSummary`  | JSON                 | 参与工人汇总 `[{name, attendanceDays}, …]`  |
| `vizComponents`  | JSON                 | 选择的可视化组件 `["LINE_CHART", "MILESTONE_TIMELINE", …]` |
| `pmNote`         | VARCHAR(2000)        | PM 总结                                     |
| `ceoNotifiedAt`  | TIMESTAMP NULL       | 通知 CEO 时间                               |

---

### 6.6 薪资

#### `PayrollCycle` — 工资结算周期

> 窗口期字段直接并入周期，无独立 PayrollWindowPeriod 表。
> 当前仅支持月结（MONTHLY），周结/日结为 P3。

| 字段              | 类型                                 | 说明                         |
|-----------------|-------------------------------------|------------------------------|
| `id`            | UUID PK                              | 主键                         |
| `period`        | VARCHAR(20)                          | 周期标识（如 `2026-04`）      |
| `settlementType`| ENUM(MONTHLY) DEFAULT MONTHLY        | 结算类型（P3 扩展 WEEKLY/DAILY）|
| `startDate`     | DATE                                 | 周期开始日                   |
| `endDate`       | DATE                                 | 周期结束日                   |
| `payDate`       | DATE                                 | 发薪日                       |
| `windowDays`    | INT DEFAULT 7                        | 窗口期时长（天），CEO 可配置  |
| `windowStatus`  | ENUM(OPEN, CLOSED) NULL              | 窗口期状态（NULL=未开启）     |
| `windowStartDate`| DATE NULL                           | 窗口期开始日期               |
| `windowEndDate` | DATE NULL                            | 窗口期结束日期（默认发薪前1天，可配置）|
| `status`        | ENUM(OPEN, WINDOW_OPEN, WINDOW_CLOSED, SETTLED, LOCKED, CORRECTING) | 周期状态 |
| `lockedAt`      | TIMESTAMP NULL                       | 正式结算锁定时间              |
| `version`       | INT DEFAULT 1                        | 更正版本号（每次更正递增）    |

---

#### `PayrollItemDef` — 工资项定义

> Admin/财务 可在后台管理工资项，前端根据定义动态渲染工资单，无硬编码字段名。

| 字段           | 类型                           | 说明                         |
|--------------|-------------------------------|------------------------------|
| `id`         | UUID PK                        | 主键                         |
| `code`       | VARCHAR(50) UNIQUE             | 工资项编码（如 `base_salary`）|
| `name`       | VARCHAR(100)                   | 显示名称（如"基本工资"）      |
| `type`       | ENUM(EARNING, DEDUCTION)       | 收入项 / 扣款项              |
| `displayOrder`| INT                           | 工资单展示顺序               |
| `isEnabled`  | BOOLEAN DEFAULT TRUE           | 是否启用                     |
| `isSystem`   | BOOLEAN                        | true 表示系统内置，不可删除   |

预置项（isSystem=true）：基本工资、绩效奖金、加班补贴、请假扣款、工伤补偿、社保（个人）、住房公积金（个人）、其他扣款（公司罚款等）。

---

#### `PayrollSlipItem` — 工资单明细行

> 每条对应工资单的一个工资项，替代原 `items JSON` 字段，支持灵活查询和聚合。

| 字段         | 类型                       | 说明                    |
|------------|---------------------------|-------------------------|
| `slipId`   | UUID FK → PayrollSlip      | 关联工资单              |
| `itemDefId`| UUID FK → PayrollItemDef   | 工资项定义              |
| `amount`   | DECIMAL                    | 金额（正数=收入，负数=扣款）|
| `remark`   | VARCHAR(200) NULL          | 备注（如扣款原因）       |

---

#### `PayrollSlip` — 员工工资单

| 字段           | 类型                | 说明                             |
|--------------|---------------------|----------------------------------|
| `id`         | UUID PK              | 主键                             |
| `cycleId`    | UUID FK → PayrollCycle | 关联周期                       |
| `employeeId` | UUID FK → Employee   | 员工                             |
| `version`    | INT DEFAULT 1        | 版本号（更正后递增）             |
| `status`     | ENUM(DRAFT, PUBLISHED, CONFIRMED, DISPUTED, SUPERSEDED) | 工资单状态 |
| `netPay`     | DECIMAL              | 实发金额（所有 PayrollSlipItem 汇总）|

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
| `evidencePdfPath`   | VARCHAR(500)         | 存证 PDF 路径（含协议内容 + 签名图像）|

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
| `lastAgreementVersion` | VARCHAR(50) NULL   | 最后阅读的协议版本号（版本变更时强制重读）|

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

> 跟随全局保留策略（`sys_retention_policy` 默认 1 年），到期物理删除。无 `@TableLogic`，不可逻辑删除。

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
| `retentionYears`| INT          | 保留年限（正整数，默认 1；所有数据类型均有期限，无永久选项）|
| `warnBeforeDays`| INT DEFAULT 30 | 到期前多少天提醒                         |

---

#### `SystemConfig` — 系统参数

| 字段          | 类型         | 说明                                      |
|-------------|-------------|-------------------------------------------|
| `configKey` | VARCHAR(100) PK | 配置键（见下表）|
| `configValue`| TEXT         | 配置值（字符串/JSON）                     |
| `description`| VARCHAR(200) | 配置说明                                 |

**常用 configKey 清单（含公司信息）：**

| configKey | 说明 | 示例值 |
|-----------|------|--------|
| `company.name` | 公司全称 | `"众维建筑工程有限公司"` |
| `company.logoPath` | 企业 Logo 相对路径（存 FS，同 StorageService 规范） | `"uploads/logo/company.png"` |
| `payroll.payDay` | 发薪日（1–31） | `"25"` |
| `payroll.settlementDeadline` | 结算截止日 | `"25"` |
| `payroll.windowDays` | 数据确认窗口期天数 | `"7"` |
| `attendance.minUnit` | 考勤最小计量单位（HOUR/HALF_DAY/DAY） | `"HALF_DAY"` |
| `sms.adminPhone` | 短信告警接收号码（Sysadmin） | `"13800000000"` |

---

#### `Feedback` — 用户反馈

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID PK | 主键 |
| `submitterId` | UUID FK → Employee | 提交人（可为 NULL，匿名提交时） |
| `feedbackType` | ENUM(FEATURE_REQUEST, BUG, OTHER) | 反馈类型 |
| `content` | TEXT | 反馈内容（最多 500 字） |
| `contact` | VARCHAR(50) NULL | 联系方式（提交人自填） |
| `status` | ENUM(PENDING, RESOLVED) DEFAULT PENDING | 处理状态 |
| `resolvedAt` | TIMESTAMP NULL | Sysadmin 标记处理的时间 |
| `createTime` | TIMESTAMP | 提交时间 |

---

## 7. API 设计规范

### 7.1 请求约定

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
POST /{resource}/{id}/derive         # 派生新资源
POST /{resource}/{id}/settle         # 执行结算
POST /{resource}/{id}/confirm        # 签名确认
POST /{resource}/import/preview      # 导入预览（两步操作第一步）
POST /{resource}/import/apply        # 导入提交（两步操作第二步）
```

### 7.3 认证

| 方法   | 路径                           | 说明                                                |
|--------|-------------------------------|-----------------------------------------------------|
| POST   | `/auth/login`                 | 工号或手机号+密码登录（返回 JWT + 员工信息）          |
| POST   | `/auth/send-reset-code`       | 发送忘记密码验证码（限频 60s，body: `{ phone }`）     |
| POST   | `/auth/verify-reset-code`     | 校验验证码（body: `{ phone, code }`，返回 resetToken）|
| POST   | `/auth/reset-password`        | 用 resetToken 重置密码（body: `{ resetToken, newPassword }`）|
| POST   | `/auth/wework`                | 企业微信 OAuth（预留，返回 501）                     |

**忘记密码流程说明：**
`resetToken` 有效期 5 分钟；`send-reset-code` 60 秒内只能发一次（后端限频）；重置成功后 `resetToken` 失效。

---

### 7.4 员工与组织

#### 员工 `/employees`

> 支持姓名/工号/手机号/岗位/状态多维搜索。财务和 CEO 均可新建员工、启用/禁用账号。

| 方法   | 路径                                | 说明                              | 权限          |
|--------|-------------------------------------|-----------------------------------|---------------|
| GET    | `/employees`                        | 列表（分页 + 多维搜索）            | finance / ceo |
| POST   | `/employees`                        | 新建员工（同时创建账号）            | finance / ceo |
| GET    | `/employees/{id}`                   | 员工详情                           | self / pm(项目内) / finance / ceo |
| PUT    | `/employees/{id}`                   | 更新档案                           | finance(基本) / ceo(全部) |
| PATCH  | `/employees/{id}/status`            | 启用/禁用账号                      | finance（需CEO审批）/ ceo（直接） |
| PATCH  | `/employees/{id}/password/reset`    | 重置密码（管理员操作）              | finance（需CEO审批）/ ceo（直接） |
| PUT    | `/employees/me/password`            | 修改本人密码（需当前密码验证）       | self          |
| POST   | `/employees/me/phone/send-verify-code` | 发送当前手机验证码（修改手机第1步）| self          |
| POST   | `/employees/me/phone/verify-identity`  | 验证身份（返回 changeToken，5min有效）| self        |
| POST   | `/employees/me/phone/send-new-code`    | 发送新手机验证码（body: `{ changeToken, newPhone }`）| self |
| PUT    | `/employees/me/phone`               | 确认修改手机号（body: `{ changeToken, newPhone, code }`）| self |
| PATCH  | `/employees/{id}/salary-override`   | 个人薪资覆盖（提交 CEO 审批）       | finance       |
| POST   | `/employees/import/preview`         | Excel 导入预览（返回逐行校验结果）  | ceo / finance |
| POST   | `/employees/import/apply`           | Excel 导入提交（批量建档建账）      | ceo / finance |
| GET    | `/employees/import/field-mapping`   | 获取当前 Excel 字段映射配置        | ceo / finance |
| PUT    | `/employees/import/field-mapping`   | 更新 Excel 字段映射配置            | ceo / finance |

#### 岗位 `/positions`

| 方法   | 路径                              | 说明                    | 权限          |
|--------|-----------------------------------|-------------------------|---------------|
| GET    | `/positions`                      | 岗位列表                | finance / ceo |
| POST   | `/positions`                      | 新建岗位                | finance（需CEO审批）/ ceo（直接） |
| GET    | `/positions/{id}`                 | 岗位详情（含等级列表）  | finance / ceo |
| PUT    | `/positions/{id}`                 | 更新岗位配置            | finance（需CEO审批）/ ceo（直接） |
| DELETE | `/positions/{id}`                 | 删除（无员工时可删）    | finance（需CEO审批）/ ceo（直接） |
| GET    | `/positions/{id}/levels`          | 等级列表                | finance / ceo |
| POST   | `/positions/{id}/levels`          | 新建等级                | finance（需CEO审批）/ ceo（直接） |
| PUT    | `/positions/{id}/levels/{levelId}`| 更新等级                | finance（需CEO审批）/ ceo（直接） |
| DELETE | `/positions/{id}/levels/{levelId}`| 删除等级                | finance（需CEO审批）/ ceo（直接） |
| GET    | `/positions/{id}/social-insurance`| 社保配置行列表          | finance / ceo |
| PUT    | `/positions/{id}/social-insurance`| 更新社保配置行（全量替换）| ceo          |

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

> 项目经理通过 `ProjectMember.role=PM` 维护，支持多个 PM。

| 方法   | 路径                                    | 说明           | 权限              |
|--------|-----------------------------------------|----------------|-------------------|
| GET    | `/projects`                             | 项目列表       | pm(本人) / ceo    |
| POST   | `/projects`                             | 新建项目       | ceo               |
| GET    | `/projects/{id}`                        | 项目详情       | pm(本项目) / ceo  |
| PUT    | `/projects/{id}`                        | 编辑项目       | ceo               |
| DELETE | `/projects/{id}`                        | 归档项目       | ceo               |
| GET    | `/projects/{id}/members`                | 成员列表（含 role 字段）| pm / ceo  |
| POST   | `/projects/{id}/members`                | 添加成员（指定 role）  | ceo        |
| PUT    | `/projects/{id}/members/{empId}/role`   | 修改成员角色   | ceo               |
| DELETE | `/projects/{id}/members/{empId}`        | 移除成员       | ceo               |

---

### 7.5 考勤业务

#### 请假 `/attendance/leaves`

> 支持代为发起（submitterId ≠ targetEmployeeId）。

| 方法   | 路径                               | 说明                          |
|--------|------------------------------------|-------------------------------|
| GET    | `/attendance/leaves`               | 请假记录列表（self/pm/finance/ceo）|
| POST   | `/attendance/leaves`               | 提交请假申请（可代报）        |
| POST   | `/attendance/leaves/retroactive`   | 追溯请假（任意时刻补录）       |
| POST   | `/attendance/leaves/{id}/approve`  | 审批通过                      |
| POST   | `/attendance/leaves/{id}/reject`   | 审批驳回                      |

#### 加班通知 `/overtime-notifications`

| 方法   | 路径                                        | 说明                               |
|--------|---------------------------------------------|------------------------------------|
| GET    | `/overtime-notifications`                   | 通知列表（发起人视角/接收人视角）   |
| POST   | `/overtime-notifications`                   | 发起加班通知（PM 或 CEO）          |
| POST   | `/overtime-notifications/{id}/respond`      | 员工确认/拒绝通知                  |
| POST   | `/overtime-notifications/{id}/close`        | 关闭通知                           |

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
| POST   | `/forms/injuries`                 | 提交工伤申请（支持代录）           |
| POST   | `/forms/injuries/{id}/approve`    | 审批通过                          |
| POST   | `/forms/injuries/{id}/reject`     | 审批驳回                          |
| POST   | `/injury-claims`                  | 录入理赔金额（finance）            |

---

### 7.6 施工日志

#### 日志 `/construction-logs`

| 方法   | 路径                                   | 说明                          |
|--------|----------------------------------------|-------------------------------|
| GET    | `/construction-logs`                   | 日志列表（按项目/日期/状态筛选）|
| POST   | `/construction-logs`                   | 提交施工日志（含 workItems）   |
| PATCH  | `/construction-logs/{id}/review`       | PM 审批（含 pmNote）          |
| POST   | `/construction-logs/{id}/recall`       | CEO 追溯驳回                  |

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
| PUT    | `/projects/{id}/milestones/{mId}`         | 编辑里程碑名称/排序  |
| DELETE | `/projects/{id}/milestones/{mId}`         | 删除里程碑           |
| POST   | `/projects/{id}/milestones/{mId}/complete`| PM 标记里程碑已完成  |
| GET    | `/projects/{id}/dashboard`               | Dashboard（折线图/里程碑/工作项汇总）|
| GET    | `/projects/{id}/construction-logs/aggregate` | 获取当期日志聚合数据（前端汇总用）|
| POST   | `/projects/{id}/construction-summary`     | 提交汇总报告（通知 CEO）|
| GET    | `/projects/{id}/construction-summary`     | 汇总报告列表         |

---

### 7.7 薪资

#### 结算周期 `/payroll/cycles`

| 方法   | 路径                                         | 说明                          |
|--------|----------------------------------------------|-------------------------------|
| GET    | `/payroll/cycles`                            | 周期列表                      |
| GET    | `/payroll/cycles/{id}/window/status`         | 窗口期各员工数据状态           |
| POST   | `/payroll/cycles/{id}/settle`                | 执行正式结算（周期锁定）       |
| POST   | `/payroll/cycles/{id}/correction`            | 发起更正申请（finance）        |
| POST   | `/payroll/cycles/{id}/correction/approve`    | 批准更正申请（CEO）            |
| POST   | `/payroll/cycles/{id}/exception`             | 预结算例外申请（finance）      |
| POST   | `/payroll/cycles/{id}/exception/approve`     | 批准例外申请（CEO）            |

#### 工资项定义 `/payroll/item-defs`

| 方法   | 路径                          | 说明                    |
|--------|-------------------------------|-------------------------|
| GET    | `/payroll/item-defs`          | 工资项列表              |
| POST   | `/payroll/item-defs`          | 新建自定义工资项        |
| PUT    | `/payroll/item-defs/{id}`     | 更新（仅非系统内置项）  |
| DELETE | `/payroll/item-defs/{id}`     | 删除（仅非系统内置项）  |

#### 工资单 `/payroll/slips`

| 方法   | 路径                              | 说明                        |
|--------|-----------------------------------|-----------------------------|
| GET    | `/payroll/slips`                  | 工资单列表（self/finance/ceo）|
| GET    | `/payroll/slips/{id}`             | 工资单详情（含明细行）      |
| POST   | `/payroll/slips/{id}/confirm`     | 电子签名确认                |
| POST   | `/payroll/slips/{id}/dispute`     | 发起异议                    |

#### 工资确认协议 `/salary-confirmation-agreement`

| 方法   | 路径                                     | 说明                    |
|--------|------------------------------------------|-------------------------|
| GET    | `/salary-confirmation-agreement/current` | 当前生效版本            |
| POST   | `/salary-confirmation-agreement`         | 上传新版本（CEO）       |

---

### 7.8 电子签名 `/signature`

| 方法   | 路径                   | 说明                              |
|--------|------------------------|-----------------------------------|
| GET    | `/signature/status`    | 查询当前员工签名绑定状态           |
| POST   | `/signature/bind`      | 首次绑定手写签名（含 PNG Base64）  |
| POST   | `/signature/set-pin`   | 设置/修改签名 PIN 码               |

---

### 7.9 权限与配置

| 方法   | 路径                              | 说明                          |
|--------|-----------------------------------|-------------------------------|
| GET    | `/permissions`                    | 权限项列表（全部）            |
| POST   | `/permissions`                    | 新增权限项（可扩展）          |
| PATCH  | `/permissions/{code}/status`      | 启用/禁用权限项               |
| GET    | `/roles`                          | 角色列表                      |
| POST   | `/roles`                          | 新建自定义角色                |
| PUT    | `/roles/{roleCode}`               | 更新角色权限关联              |
| DELETE | `/roles/{roleCode}`               | 删除自定义角色                |
| GET    | `/form-type-defs`                 | 表单类型列表                  |
| POST   | `/form-type-defs`                 | 新建表单类型                  |
| PATCH  | `/form-type-defs/{code}/status`   | 启用/禁用表单类型             |
| GET    | `/leave-type-defs`                | 假期类型列表                  |
| POST   | `/leave-type-defs`                | 新建假期类型                  |
| PUT    | `/leave-type-defs/{id}`           | 更新假期类型（名称/扣款比例） |
| PATCH  | `/leave-type-defs/{id}/status`    | 启用/禁用                     |
| GET    | `/page-config/{routeCode}`        | 下发页面配置（菜单/按钮/字段）|
| GET    | `/approval/flows`                 | 审批流配置列表                |
| PUT    | `/approval/flows/{type}`          | 修改审批流                    |
| GET    | `/retention/policies`             | 数据保留策略                  |
| PUT    | `/retention/policies/{type}`      | 修改保留策略（CEO）           |
| GET    | `/notifications`                  | 通知列表                      |
| POST   | `/notifications/{id}/read`        | 标记单条已读                   |
| POST   | `/notifications/read-all`         | 全部标为已读                   |
| DELETE | `/notifications/read`             | 清除所有已读通知               |
| GET    | `/workbench/summary`              | 工作台聚合摘要（按角色）       |
| POST   | `/feedback`                       | 提交反馈（业务用户）           |

---

### 7.10 系统管理（仅 Sysadmin）

| 方法   | 路径                          | 说明                          |
|--------|-------------------------------|-------------------------------|
| GET    | `/setup/status`               | 初始化完成度检查              |
| POST   | `/setup/company`              | 设置公司基本信息              |
| POST   | `/setup/init-accounts`        | 批量创建初始业务账号（含至少 1 个 CEO，一次性）|
| PUT    | `/setup/default-roles`        | 调整预置角色权限              |
| PUT    | `/setup/default-workflows`    | 调整默认审批流配置            |
| PUT    | `/setup/retention-defaults`   | 设置数据保留默认值            |
| GET    | `/system/logs`                | 系统操作日志                  |
| POST   | `/system/backup`              | 触发全量备份                  |
| PUT    | `/system/reset-password`      | 重置任意用户密码              |
| GET    | `/system/feedback`            | 查看用户反馈列表（Sysadmin）  |
| PATCH  | `/system/feedback/{id}/resolve` | 标记反馈为已处理            |
| GET    | `/system/cleanup-tasks`       | 查看失败清理任务列表          |
| POST   | `/system/cleanup-tasks/{id}/retry` | 重试失败清理任务          |
| PATCH  | `/system/cleanup-tasks/{id}/resolve` | 标记清理任务已人工处理  |
| POST   | `/system/integration/wework`  | 保存企业微信集成配置（P3）    |
| POST   | `/system/integration/sms`     | 保存短信服务商配置（P3）      |

---

## 8. 文件存储

### 8.1 存储决策

**原始文件存服务器本地文件系统，数据库只存 `AttachmentMeta` 元数据。**

理由：内网 OA 场景，200 人规模，本地 FS 读写性能优于 DB BLOB；文件与元数据分离，清理时只需删物理文件 + 元数据记录；未来迁移到 MinIO/OSS，只需替换 `StorageService` 实现，业务代码不变。

### 8.2 目录结构

```
/uploads/
  {businessType}/        # leave / injury / construction-log /
                         # payroll-confirm / signature / export
    {yyyy-MM}/           # 按月归档
      {UUID}.{ext}

例：
  /uploads/leave/2026-04/3f8a1c2d-xxxx.jpg
  /uploads/payroll-confirm/2026-04/b72cxxxx.pdf
  /uploads/signature/{employeeId}-sig.enc
  /uploads/salary-agreement/v3-agreement.pdf
  /uploads/export/2026-04/backup-xxxx.zip
```

### 8.3 清理流程

```
识别到期数据 → 查找 AttachmentMeta
→ 删除物理文件（失败则进重试队列，记录 cleanup_task，最多重试3次）
→ 删除 AttachmentMeta 记录 → 删除业务表记录 → 写审计日志

物理文件删除失败不得标记清理完成。
多次失败后：标记 cleanup_task.status=FAILED，Admin 登录时面板弹出警告。
```

### 8.4 清理失败通知（P3：短信）

> 当前实现：Admin 登录时面板弹出 FAILED 任务列表告警。
>
> P3：`SmsService` 接口（默认 no-op）预留短信通知能力，当 FAILED 任务连续 N 天未处理（N 可配置，默认 3 天）时触发短信通知 Admin 手机号（存于 `SystemConfig.sms.adminPhone`）。
>
> 实现时接入阿里云短信 SDK，替换 `NoOpSmsService` 即可。

---

## 9. 电子签名架构

### 9.1 签署流程

```
首次签署（签名未绑定）：
  1. 展示工资确认协议（如 CEO 已上传）
     → 协议内含查看链接，员工须滚动到底部点击"已阅读"后才可继续
  2. 进入 Canvas 手写签名页 → 员工手写 → 预览确认
  3. 设置签名 PIN 码（4-6 位数字，独立于登录密码）
  4. 后端：保存加密签名图 + PIN bcrypt 哈希 → 写入 EmployeeSignature
  5. 执行签署流程（见下）

后续签署（签名已绑定）：
  1. 若协议有新版本（lastAgreementVersion 不匹配）→ 强制重新阅读（同首次第1步）
  2. 展示签名预览图 + 意图声明文本（含协议链接，员工可再次查看）
     （"本人已阅读并确认上述工资明细，同意结算结果"）
  3. 员工输入 PIN → 后端 bcrypt 比对
  4. 后端：生成 PayrollConfirmation（完整证据链）
  5. 后端：生成签署 PDF（明细 + 协议内容摘要 + 签名叠加 + 时间戳水印）→ 存服务器 FS
  6. 工资单状态变为 CONFIRMED
```

### 9.2 SignatureProvider 抽象

```
SignatureProvider（接口）
  ├── LocalSignatureProvider    # 当前实现：自建存证（iText PDF + AES 加密）
  └── EsignSignatureProvider    # 预留：e签宝 CA（配置项 signature.provider=esign 开关）
```

---

## 10. 员工档案 Excel 导入

### 10.1 功能说明

支持批量导入员工档案，两步操作（预览→提交）确保数据质量。
Excel 字段映射关系可由财务或 CEO 在后台配置，无需改代码适配不同格式的 Excel。

### 10.2 系统默认字段映射

| Excel 列名（默认）| 系统字段        | 是否必填 | 说明                              |
|----------------|----------------|---------|-----------------------------------|
| 工号            | `employeeNo`   | 必填     | 唯一，作为登录用户名              |
| 姓名            | `name`         | 必填     |                                   |
| 手机号          | `phone`        | 必填     | 唯一，支持手机号登录              |
| 邮箱            | `email`        | 可选     |                                   |
| 岗位名称        | `positionName` | 可选     | 匹配 Position.positionName，为空则岗位待分配|
| 等级名称        | `levelName`    | 可选     | 与岗位下等级名称匹配              |
| 部门名称        | `departmentName`| 可选    | 匹配 Department.name              |
| 入职日期        | `entryDate`    | 可选     | 格式 `YYYY-MM-DD`                  |
| 备注            | `remark`       | 可选     |                                   |

> 字段映射由财务/CEO 在 `GET/PUT /employees/import/field-mapping` 接口配置，可将 Excel 任意列名映射到上述系统字段。

### 10.3 接口流程

```
POST /employees/import/preview
  Request: multipart/form-data { file: .xlsx }
  Response: {
    "total": 50, "valid": 48, "invalid": 2,
    "errors": [{ "row": 5, "field": "positionName", "message": "岗位'高级工程师'不存在" }],
    "sessionToken": "xxxx"（10分钟有效）
  }

POST /employees/import/apply
  Request: { "sessionToken": "xxxx" }
  Response: { "created": 48, "skipped": 2 }
```

所有新建员工默认密码为 `123456`，`isDefaultPassword=true`，登录后持续提醒修改。

---

## 11. 企业微信接入（预留）

企业微信能力通过 `WeworkService` 模块封装，待 `corpId / agentId / secret` 就绪后替换实现：

- **企业微信 OAuth 身份登录**：`/auth/wework`，当前返回 501
- **通讯录批量导入**：当前使用 mock 数据
- **应用消息推送**：审批通知、工资条发布、到期提醒（当前为系统内通知）
- **小程序内发起联系人会话**：PM/CEO 可直接联系员工

---

## 12. 模块解耦架构（差分部署）

> **设计目标：** 支持按需启用/禁用业务模块（如"不含报销模块"、"不含项目管理"），任何模块的缺失不影响系统整体可运行。

### 12.1 模块注册表（modules.yml）

所有业务模块在 `src/main/resources/modules.yml` 中注册，部署者在该文件或环境变量中切换开关，无需改代码：

```yaml
# modules.yml — 模块开关配置
# 修改后重启服务生效；未列出的模块不纳入加载
modules:
  attendance:      true    # 考勤（请假/加班申请，审批流引擎依赖此模块）
  construction:    true    # 施工专属（施工日志 + 工伤补偿，依赖 attendance）
  payroll:         true    # 薪资结算（窗口期 + 结算 + 签名存证）
  project:         true    # 项目管理（里程碑 + 进度，依赖 construction）
  reimbursement:   false   # 报销（预留，当前未实现）
  data_lifecycle:  true    # 数据生命周期（保留策略 + 清理调度，建议始终开启）
```

**核心模块（不可关闭）：** `auth`（认证）、`employee`（员工档案）、`org`（组织管理）、`approval_engine`（审批流引擎内核）、`notification`（通知）、`system`（系统配置 + Admin）。

环境变量优先级高于文件：`OA_MODULE_PAYROLL=false` 可覆盖 yml 配置，适合 CI/CD 场景。

---

### 12.2 Spring 条件加载（@ConditionalOnProperty）

每个可选模块的 `@Configuration` 类均使用 `@ConditionalOnProperty` 守门：

```java
// 考勤模块配置类
@Configuration
@ConditionalOnProperty(prefix = "modules", name = "attendance", havingValue = "true")
public class AttendanceModuleConfig {
    // 注册 AttendanceController、AttendanceService、AttendanceRepository 等 Bean
}

// 薪资模块配置类
@Configuration
@ConditionalOnProperty(prefix = "modules", name = "payroll", havingValue = "true")
public class PayrollModuleConfig { ... }
```

模块未启用时，Spring 容器不注册对应 Bean，相关接口路径不挂载，403 之外不会抛 NoSuchBeanDefinitionException。

---

### 12.3 模块间通信（Spring ApplicationEvent）

**禁止模块间直接注入 Service**（产生编译期耦合）。跨模块调用一律通过 Spring `ApplicationEvent`：

```
Attendance 模块（发布方）          Payroll 模块（订阅方）
     │                                    │
     │  publishEvent(LeaveApprovedEvent)  │
     └──────────────────────────────────►│
                                          │ @EventListener(LeaveApprovedEvent)
                                          │ → 更新考勤数据，用于算薪
```

**已定义的跨模块事件：**

| 事件类                         | 发布方       | 订阅方            | 触发时机                          |
|-------------------------------|-------------|------------------|-----------------------------------|
| `LeaveApprovedEvent`          | attendance  | payroll          | 请假单终审通过，携带 days/deductionRate |
| `OvertimeRecordedEvent`       | attendance  | payroll          | 加班通知归档，携带 hours/rate       |
| `InjuryClaimSettledEvent`     | construction| payroll          | 工伤理赔金额录入，携带 compensationAmount |
| `ConstructionLogApprovedEvent`| construction| project          | 施工日志审批通过，触发项目进度更新  |
| `PayrollCycleLockedEvent`     | payroll     | notification     | 结算周期锁定，推送工资条待确认通知  |
| `RetentionExpiredEvent`       | data_lifecycle | all modules   | 数据到期，通知各模块执行物理删除    |

---

### 12.4 端口接口（Port Interface）

当模块 B 需要读取模块 A 的数据时，通过 Port 接口隔离，避免直接调用 Repository：

```java
// 在 payroll 模块内定义接口（端口）
public interface AttendancePort {
    List<LeaveRecord> getApprovedLeaves(Long employeeId, YearMonth period);
    List<OvertimeRecord> getArchivedOvertime(Long employeeId, YearMonth period);
}

// 在 attendance 模块内提供实现
@Component
@ConditionalOnProperty(prefix = "modules", name = "attendance", havingValue = "true")
public class AttendancePortImpl implements AttendancePort { ... }

// attendance 模块未启用时，提供空实现（返回空列表）
@Component
@ConditionalOnMissingBean(AttendancePortImpl.class)
public class AttendancePortNoop implements AttendancePort {
    public List<LeaveRecord> getApprovedLeaves(...) { return Collections.emptyList(); }
    public List<OvertimeRecord> getArchivedOvertime(...) { return Collections.emptyList(); }
}
```

这样 payroll 模块编译时不依赖 attendance 模块是否存在，部署时两种情况均可正常运行。

---

### 12.5 数据库隔离（表前缀 + 分 Migration）

每个可选模块的表使用专属前缀，Migration 脚本按模块分目录：

| 模块            | 表前缀  | Migration 目录                              |
|----------------|--------|----------------------------------------------|
| 核心（始终加载） | 无前缀 | `db/migration/core/`                         |
| 考勤            | `atd_` | `db/migration/attendance/`                   |
| 施工            | `con_` | `db/migration/construction/`                 |
| 薪资            | `pay_` | `db/migration/payroll/`                      |
| 项目管理        | `prj_` | `db/migration/project/`                      |
| 数据生命周期    | `dlc_` | `db/migration/data_lifecycle/`               |

Flyway 通过 `spring.flyway.locations` 配置项控制加载哪些目录，模块关闭时对应目录不扫描，不建表。

---

### 12.6 前端动态路由

登录响应中携带 `enabledModules` 列表，前端据此动态注册菜单和路由：

```jsonc
// POST /auth/login 响应
{
  "token": "...",
  "employee": { ... },
  "enabledModules": ["attendance", "payroll", "project", "construction", "data_lifecycle"]
}
```

前端路由注册逻辑：

```typescript
// 登录成功后，根据 enabledModules 动态挂载路由
function registerModuleRoutes(enabledModules: string[]) {
  if (enabledModules.includes("attendance")) {
    router.addRoute("main", attendanceRoutes)
  }
  if (enabledModules.includes("payroll")) {
    router.addRoute("main", payrollRoutes)
  }
  // ...
}
```

菜单、待办聚合、工作台卡片均根据 `enabledModules` 过滤，不依赖权限判断。

---

## 13. 全流程日志系统

> **设计目标：** 问题发生后能在 5 分钟内定位到触发问题的模块、类、文件和代码行。日志分两层：业务层（可在 UI 中查看）和系统层（运维专用文件日志）。

### 13.1 两层日志分工

| 层级              | 存储位置     | 可见性         | 用途                              |
|-----------------|-------------|---------------|-----------------------------------|
| OperationLog    | 数据库表      | UI 可见（Admin）| 业务操作审计：谁在什么时间做了什么   |
| SystemLog       | 服务器文件    | 运维专用        | 技术诊断：完整调用链、异常堆栈、性能数据 |

两层互补：OperationLog 提供业务可读的审计轨迹；SystemLog 提供完整的技术诊断信息。

---

### 13.2 SystemLog 结构化 JSON 格式

每条 SystemLog 为独立 JSON 行（Newline-delimited JSON），字段如下：

```jsonc
{
  "timestamp":   "2026-04-07T14:23:01.234Z",   // ISO 8601
  "level":       "INFO",                         // DEBUG | INFO | WARN | ERROR
  "trace_id":    "a3f8c2d1-xxxx-xxxx-xxxx",     // 请求级别唯一标识（见 §13.3）
  "module":      "payroll",                      // 所属业务模块（见 §12.1 模块名）
  "operation":   "payroll.cycle.settle",         // 操作码（{module}.{资源}.{动作}）
  "user_id":     "emp-001",                      // 操作人 employeeNo（匿名请求为 "anonymous"）
  "role":        "finance",                      // 操作人角色
  "class":       "PayrollController",            // 产生日志的类名
  "method":      "settle",                       // 方法名
  "file":        "PayrollController.java",       // 文件名
  "line":        247,                            // 代码行号
  "duration_ms": 312,                            // 本次请求处理耗时（仅 Controller 层记录）
  "status":      200,                            // HTTP 状态码（仅 Controller 层记录）
  "message":     "Payroll cycle 2026-04 settled, 18 slips generated",
  "error":       null                            // 异常信息（ERROR 级别时有值）
}
```

**operation 命名规范：** `{module}.{resource}.{action}`，如 `attendance.leave.approve`、`payroll.cycle.settle`、`auth.employee.login`。

---

### 13.3 Trace ID（MDC 传播）

每个 HTTP 请求入口生成一个 UUID 作为 `trace_id`，通过 SLF4J MDC 传播到所有下游调用：

```java
// TraceIdFilter.java — OncePerRequestFilter
@Component
public class TraceIdFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) {
        String traceId = Optional.ofNullable(req.getHeader("X-Trace-Id"))
                .orElse(UUID.randomUUID().toString());
        MDC.put("trace_id", traceId);
        res.setHeader("X-Trace-Id", traceId);
        try {
            chain.doFilter(req, res);
        } finally {
            MDC.clear(); // 线程归还时清理，防止线程池泄漏
        }
    }
}
```

**跨异步边界传播：** Spring `@Async` 和 `ApplicationEvent` 的异步监听器使用 `MdcTaskDecorator` 确保 trace_id 传递到子线程。

---

### 13.4 日志文件滚动策略

```
logs/
  oa-system.log          # 当前日志（滚动写入）
  oa-system.2026-04-06.log  # 按日归档
  oa-error.log           # 仅 ERROR 级别，便于告警扫描
  oa-slow.log            # 请求耗时 > 2000ms 的慢请求独立归档

保留策略：
  - oa-system.*：保留 30 天
  - oa-error.*：保留 90 天
  - oa-slow.*：保留 30 天
```

Logback 配置文件：`src/main/resources/logback-spring.xml`；生产环境通过 Spring Profile 切换到 JSON Appender。

---

### 13.5 OperationLog 写入时机

以下操作**强制写入** OperationLog（数据库），UI 中可见：

| 操作域       | 触发动作                                       |
|------------|------------------------------------------------|
| 认证        | 登录成功/失败、密码重置、手机号修改              |
| 员工管理    | 员工创建/修改/禁用/删除、角色变更、薪资覆盖      |
| 审批流      | 提交单据、审批通过/驳回/跳过、撤回               |
| 薪资        | 结算、更正、窗口期开启/关闭                     |
| 权限配置    | 角色新增/删除、权限项变更                        |
| 数据管理    | 保留策略修改、清理任务执行、数据导出             |
| 系统配置    | 公司信息修改、集成配置变更                       |

OperationLog 通过 AOP 拦截器自动写入，业务代码无需手动调用：

```java
// OperationLogAspect.java
@Aspect
@Component
public class OperationLogAspect {
    @Around("@annotation(OperationLogRecord)")
    public Object record(ProceedingJoinPoint pjp, OperationLogRecord annotation) throws Throwable {
        // 记录操作前快照、执行业务方法、记录操作后状态、写入 OperationLog 表
    }
}
```

---

### 13.6 日志分析工具（tools/log_analyzer）

> 日志文件为运维专用，携带 `trace_id` 可快速定位问题链路。工具详见 `tools/log_analyzer/README.md`。

**认证机制：** 工具启动时读取环境变量 `OA_DEPLOY_KEY`（部署者持有，不进源码），无 key 则拒绝解析。防止日志文件流出后被第三方轻易读取。

**使用场景：** 将一段日志文本（或日志文件）拖入工具，输入 trace_id / 时间范围 / 模块名过滤，工具输出：

```
[PAYROLL] PayrollController.java:247 — settle() — 312ms
[PAYROLL] PayrollEngine.java:89 — validatePrerequisites() — 8ms
[PAYROLL] PayrollSlipRepository.java:134 — bulkInsert() — 287ms — ERROR
  java.sql.BatchUpdateException: Duplicate key value violates unique constraint ...
  at com.oa.backend.repository.PayrollSlipRepository.bulkInsert(PayrollSlipRepository.java:134)
```

工具路径：`tools/log_analyzer/`，独立 Python 子项目，部署时与服务器分离。

---

## 14. 可配置边界

### 14.1 可配置项（Sysadmin 向导或后台运营期修改）

| 配置项         | 配置粒度    | 运行时可修改          |
|---------------|------------|----------------------|
| 角色定义与权限  | 角色级      | ✓                    |
| 审批流节点     | 业务类型级   | ✓（仅影响新单据）      |
| 表单字段       | 表单模板级   | ✓                    |
| 薪资计算规则   | 工资项级    | ✓（仅影响新周期）      |
| 数据保留策略   | 数据类型级   | ✓                    |
| 结算周期类型   | 全局        | ✓                    |
| 启用的功能模块  | 模块级      | ✓                    |
| 公司基本信息   | 全局        | ✓                    |

### 14.2 平台固定项（不可通过配置修改）

- JWT 认证机制与 Token 格式
- Sysadmin 账号层级与初始化流程
- 电子签名与存证的数据结构
- 文件存储路径规范（`/uploads/{业务类型}/{yyyy-MM}/{UUID}.{ext}`）
- 数据清理的物理删除机制
- 双端适配架构（uni-app + 组件适配层）
- 状态机流转规则（审批流基本状态集合）

---

## 15. 多企业预置方案（接入新行业）

### 15.1 三层工作结构

接入第二家企业需完成三层工作：

```
documentation/
├── DESIGN-{行业}.md        # [文档层] 角色/权限/审批流/薪资/数据保留设计记录
│
app/backend/src/main/resources/db/
└── preset-{行业}.sql        # [配置数据层] Sysadmin 初始化向导加载的种子数据
│
app/backend/... / app/frontend/...
                             # [业务模块层] 行业专属 Service/Controller/页面（可选）
```

### 15.2 配置数据层（preset-{行业}.sql）写入表

| 表 | 内容 |
|----|------|
| `sys_role` | 角色定义 + 默认权限码列表 |
| `permission` | 预置权限码集合 |
| `biz_form_type_def` | 启用的表单业务类型 |
| `biz_approval_flow_def` + `biz_approval_flow_node` | 各业务类型的审批流节点 |
| `pay_leave_type_def` | 假种及扣款比例 |
| `pay_social_insurance_item` | 社保险种及默认比例 |
| `sys_retention_policy` | 各类数据的默认保留期 |
| `sys_config` | 平台级参数（窗口期时长、计量单位等） |

### 15.3 业务模块层（可选）

若新行业有专属业务流程（如建筑版的施工日志、工伤补偿），需在后端新增 Service/Controller，前端新增业务页面。若该行业只使用通用模块（考勤/薪资/请假/加班），仅配置数据即可上线，无需改代码。

### 15.4 不同行业差异点参考

| 差异维度       | 建筑工程版           | 其他行业示例          |
|--------------|---------------------|----------------------|
| 核心业务模块   | 施工日志、工伤补偿    | 制造业：生产工单、设备巡检 |
| 特殊角色      | 劳工（劳务人员）      | 制造业：班组长          |
| 薪资规则复杂度  | 工伤补偿纳入薪资      | 制造业：计件工资         |
| 审批链长度     | 2 节点（初审+终审）   | 大型企业：3-4 节点       |

---

## 变更记录

| 日期        | 内容                                                                                       |
|-----------|------------------------------------------------------------------------------------------|
| 2026-04-07 | §1 系统架构图重绘（新增预置与初始化层、核心层、集成层、业务模块层）；§3 分层架构图升级为5层（预置→配置→核心引擎→集成→业务模块）；所有文档文件改名为小写；新增 §0 设计原则、§14 可配置边界、§15 多企业预置方案（内容从 product.md 合并后删除）；新增 §12 模块解耦架构；新增 §13 全流程日志系统 |
| 2026-04-03 | 初始版本：技术选型、三层架构、引擎设计、实体模型、API 规范、文件存储、电子签名、Excel 导入、企业微信预留 |
