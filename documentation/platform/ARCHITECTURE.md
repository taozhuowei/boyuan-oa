# 博渊 OA 平台 — 技术架构文档

> **文档职责**：描述博渊平台的技术选型、系统架构、各引擎的设计模型、通用数据模型和 API 规范。
>
> **目标读者**：后端架构师、技术负责人。
>
> **不包含内容**：具体的代码实现细节（见 `IMPLEMENTATION.md`）；建筑工程版的业务数据模型（见 `presets/construction/`）。

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
    │PostgreSQL│ │ 文件存储 │ │ 企业微信  │
    │         │ │（本地/OSS）│ │   API    │
    └─────────┘ └─────────┘ └──────────┘
```

---

## 2. 技术栈

| 层 | 技术 | 版本 / 说明 |
|---|---|---|
| 前端框架 | uni-app + Vue 3 + Vite | 编译到小程序 + H5 |
| 前端组件库（H5） | Ant Design Vue 4.x | PC/平板/手机浏览器 |
| 前端组件库（MP） | Vant 4.9.x | 企业微信小程序 |
| 后端框架 | Spring Boot 3 | Java 17 |
| 安全 | Spring Security + JWT | Bearer Token |
| ORM | MyBatis-Plus | 逻辑删除、自动填充 |
| 数据库 | PostgreSQL | 主数据 + 索引 |
| 文件存储 | 本地 FS / MinIO / OSS | 可配置，默认本地 FS |

---

## 3. 分层架构

```
┌────────────────────────────────────────────────────┐
│  配置层（Config Layer）                              │
│  角色配置 / 工作流定义 / 表单模板 / 薪资规则          │
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

| 模块域 | 职责 | 核心类 |
|---|---|---|
| 身份与组织 | 认证、员工档案、部门、项目、角色 | `AuthController`, `EmployeeController`, `RoleController` |
| 系统管理 | Sysadmin 初始化、公司配置、账号重置 | `SetupController`, `SystemController` |
| 配置域 | 菜单路由、表单模板、审批流定义、薪资规则、数据保留策略 | `PageConfigController`, `ApprovalFlowController`, `RetentionController` |
| 业务域 | 具体业务单据（请假、加班、工伤、施工日志）、审批记录 | `FormController`, `ApprovalService` |
| 薪资域 | 工资周期、工资单、工资项、确认记录、更正单 | `PayrollController`, `PayrollEngine` |
| 签名域 | 手写签名绑定、工资条签署、存证 PDF 生成 | `SignatureController`, `EvidenceService` |
| 保留清理域 | 到期提醒、清理任务、备份导出 | `CleanupScheduler`, `BackupController` |

---

## 5. 引擎设计

### 5.1 权限引擎

权限由多维度交集决定，引擎在请求时动态计算：

```
权限结果 = f(角色权限, 员工类型, 部门范围, 项目范围, 数据所有权)
```

- **角色权限**：存储于 `RolePermission` 表，Key 为 `(roleCode, permissionCode)`
- **数据范围**：`GLOBAL`（全局）/ `DEPARTMENT`（同部门）/ `PROJECT`（同项目）/ `SELF`（本人）
- **菜单动态下发**：后端根据角色构建菜单树，通过 `GET /page-config/{routeCode}` 下发给前端

### 5.2 工作流引擎

每种业务类型对应一个审批流定义（`ApprovalFlowDef`），由有序节点列表组成：

```java
ApprovalFlowDef  { businessType, nodes[] }
ApprovalFlowNode { nodeOrder, nodeName, approverType(ROLE|DESIGNATED), approverRef }
```

状态流转：
```
提交 → PENDING
     → 节点1审批 → APPROVING
     → 节点N审批 → APPROVED
                 → REJECTED（可重新发起）
APPROVED → ARCHIVED
```

约束：
- 当前版本不支持条件分支和并行会签
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

```
算薪输入：
  员工档案（类型、角色）+ 考勤结果 + 请假扣款 + 加班补贴 + 工伤补偿 + 规则配置

算薪流程：
  预结算 → 系统校验（5项完整性检查）→ 正式结算（周期锁定）
  → 员工确认/异议 → 更正申请（CEO 审批解锁）→ 重算 → 归档

多版本：每次更正生成新版本，历史版本完整保留，不可篡改
```

---

## 6. 通用数据模型

### 6.1 核心实体

```java
// 用户账号
User { id, username, password(bcrypt), role, status, createTime }

// 员工档案
Employee { id, userId, employeeNo, name, employeeType(OFFICE|LABOR),
           departmentId, projectId, position, entryDate, status }

// 角色定义
Role { id, roleCode, roleName, description, isSystem(不可删), status }

// 角色权限
RolePermission { roleId, permissionCode, dataScope }

// 表单记录（通用业务单据）
FormRecord { id, formType, submitterId, departmentId, formData(JSON),
             status, currentNode, remark, createTime }

// 审批记录
ApprovalRecord { id, formId, nodeOrder, approverId, action, comment, createTime }

// 附件元数据
AttachmentMeta { id, businessType, businessId, storagePath, fileMd5, uploadTime }
```

### 6.2 配置实体

```java
// 审批流定义
ApprovalFlowDef  { id, businessType, version, isActive }
ApprovalFlowNode { id, flowId, nodeOrder, nodeName, approverType, approverRef }

// 数据保留策略
RetentionPolicy { id, dataType, retentionMonths, warnBeforeDays, isGlobal }

// 系统配置
SystemConfig { id, configKey, configValue, description }
```

### 6.3 薪资实体

```java
PayrollCycle { id, period, status, version, lockedAt }
PayrollSlip  { id, cycleId, employeeId, version, status, grossPay, netPay, items(JSON) }
PayrollConfirmation { slipId, employeeId, confirmedAt, clientIp, userAgent,
                      payrollContentHash, signatureHash, evidencePdfPath }
```

### 6.4 签名实体

```java
EmployeeSignature { employeeId, signatureImageEncrypted, signatureHash,
                    pinHash(bcrypt), boundAt }
```

---

## 7. API 设计规范

### 7.1 设备类型协议

所有请求携带设备类型头，后端返回对应配置：

```
X-Client-Type: web    # Web 端
X-Client-Type: mp     # 企业微信小程序
```

### 7.2 认证

```
POST /auth/login         # 账号密码登录（业务用户 + sysadmin 共用）
POST /auth/wework        # 企业微信 OAuth（预留，当前返回 501）
```

### 7.3 配置类接口（平台级）

```
GET  /page-config/{routeCode}        # 按路由下发页面配置（含菜单、字段、按钮权限）
GET  /forms/config?formType={type}   # 表单配置
GET  /approval/flows                 # 审批流配置列表
PUT  /approval/flows/{businessType}  # 修改审批流
GET  /roles                          # 角色列表
POST /roles                          # 新增角色
GET  /retention/policies             # 数据保留策略
POST /retention/policies             # 配置保留策略
```

### 7.4 业务类接口

```
# 工作台
GET  /workbench/summary              # 聚合摘要（待办数、薪资状态、项目数、到期提醒）

# 组织
GET  /employees                      # 员工列表
GET  /projects                       # 项目列表
POST /directory/import/preview       # 通讯录导入预览
POST /directory/import/apply         # 通讯录导入提交

# 表单与审批
GET  /forms/todo                     # 待办列表
GET  /forms/history                  # 历史记录
POST /forms/leave                    # 提交请假
POST /forms/overtime                 # 提交加班
POST /forms/injury                   # 提交工伤补偿
POST /forms/log                      # 提交施工日志
POST /forms/{id}/approve             # 审批通过
POST /forms/{id}/reject              # 审批驳回

# 薪资
GET  /payroll/cycles
POST /payroll/cycles/{id}/precheck
POST /payroll/cycles/{id}/settle
POST /payroll/cycles/{id}/corrections
POST /payroll/cycles/{id}/recalculate
GET  /payroll/slips
POST /payroll/slips/{id}/confirm
POST /payroll/slips/{id}/dispute

# 签名
POST /signature/bind                 # 首次绑定手写签名
POST /signature/set-pin              # 设置签名 PIN 码
GET  /signature/status               # 查询签名绑定状态
```

### 7.5 系统管理接口（仅 Sysadmin）

```
GET  /setup/status                   # 初始化完成度检查
POST /setup/company                  # 设置公司基本信息
POST /setup/init-ceo                 # 创建首个 CEO 账号（只能调用一次）
GET  /setup/default-roles            # 获取预置角色模板
PUT  /setup/default-roles            # 调整预置角色权限
GET  /setup/default-workflows        # 获取默认审批流配置
PUT  /setup/default-workflows        # 调整默认审批流
PUT  /setup/retention-defaults       # 设置数据保留默认值
GET  /system/logs                    # 系统操作日志
POST /system/backup                  # 触发全量备份
PUT  /system/reset-password          # 重置任意用户密码
```

---

## 8. 附件与数据清理

### 8.1 存储方案

原始文件存本地文件系统，数据库只存 `AttachmentMeta`：

```
/uploads/{业务类型}/{yyyy-MM}/{UUID}.{ext}

例：
  /uploads/leave/2026-04/3f8a1c2d-....jpg
  /uploads/payroll-confirm/2026-04/b72c....pdf
  /uploads/signature/emp-{employeeId}-sig.enc
```

### 8.2 清理流程

```
识别到期数据 → 定位业务记录 → 查找附件元数据
→ 删除物理文件（失败则进重试队列）
→ 删除数据库记录 → 记录审计日志
```

物理文件删除失败不得标记清理完成；多次失败后转人工补偿。

---

## 9. 电子签名架构

### 9.1 签署流程

```
首次：Canvas 手写 → 加密存档 → 绑定员工 ID → 设置独立 PIN

非首次：
  展示签名预览 + 意图声明文本
  → 输入 PIN → 后端校验 bcrypt 哈希
  → 生成 PayrollConfirmation（完整证据链）
  → 生成签署 PDF（明细 + 签名叠加 + 时间戳水印）→ 存档
```

意图声明（版本化）：*"本人已阅读并确认上述工资明细，同意结算结果。"*

### 9.2 SignatureProvider 抽象

```
SignatureProvider（接口）
  ├── LocalSignatureProvider    # 当前实现：自建存证
  └── EsignSignatureProvider    # 预留：e签宝 CA（配置项开关）
```

---

## 10. 企业微信接入（预留）

企业微信能力通过 `WeworkService` 模块封装，待 `corpId / agentId / secret` 就绪后替换实现：

- 企业微信 OAuth 身份登录（`/auth/wework`，当前返回 501）
- 通讯录批量导入（当前使用 mock 数据）
- 应用消息推送（审批通知、工资条发布、到期提醒）
- 小程序内发起企业微信联系人会话
