# 众维 OA — 技术架构文档

## 1. 系统架构

```
┌─────────────────┐     ┌─────────────────┐
│  企业微信工作台   │     │   Web 浏览器     │
│    小程序        │     │ (PC/平板/手机)   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
            ┌─────────────────┐
            │  uni-app 前端    │
            │  (Vue 3 + Vite) │
            └────────┬────────┘
                     │ REST API
                     ▼
            ┌─────────────────┐
            │  Spring Boot    │
            │    后端服务      │
            └────────┬────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
    ┌────────┐  ┌────────┐  ┌──────────┐
    │PostgreSQL│  │ 文件/  │  │ 企业微信  │
    │         │  │对象存储 │  │   API    │
    └────────┘  └────────┘  └──────────┘
```

## 2. 技术栈

| 层 | 技术 | 版本/说明 |
|---|---|---|
| 前端框架 | uni-app + Vue 3 + Vite | 编译到小程序 + H5 |
| 后端框架 | Spring Boot 3 | Java 17 |
| 安全 | Spring Security + JWT | Bearer Token |
| ORM | MyBatis-Plus | 逻辑删除、自动填充 |
| 数据库 | PostgreSQL | 主数据 + 索引 |
| 存储 | 本地 FS / MinIO / OSS | 附件原始文件 |

## 3. 模块划分

| 域 | 职责 | 核心类/接口 |
|---|---|---|
| 身份与组织 | 用户认证、员工档案、部门、项目、角色 | `AuthController`, `EmployeeController`, `ProjectController`, `RoleController` |
| 配置域 | 菜单、路由、页面模板、字段、施工日志模板、薪资规则、数据保留策略 | `FormController.getFormConfig()`, `RetentionController` |
| 业务域 | 请假、加班、工伤补偿、施工日志、审批记录 | `FormController`, `OaDataService` |
| 薪资域 | 工资周期、工资单、工资项、确认记录、更正单 | `PayrollController`, `PayrollCycle`, `PayrollSlip` |
| 保留清理域 | 到期提醒、清理任务、导出备份任务 | `CleanupController`, `BackupController` |

## 4. 数据模型

### 4.1 核心实体

```java
// 用户
User { id, username, password, status, createTime, updateTime }

// 员工档案
Employee { id, userId, employeeNo, name, employeeType, departmentId, projectId, position, entryDate, status }

// 角色
Role { id, roleCode, roleName, description, isSystem, status }

// 项目
Project { id, name, managerId, departmentId, status }

// 表单记录（请假/加班/工伤/日志）
FormRecord { id, formType, submitter, department, formData, status, remark, createTime }

// 审批记录
ApprovalRecord { id, formId, node, approver, action, comment, createTime }

// 工资周期
PayrollCycle { id, period, status, version, locked }

// 工资单
PayrollSlip { id, cycleId, employeeId, version, status, grossPay, netPay }
```

### 4.2 状态定义

**业务单据状态**
```
DRAFT → PENDING → APPROVING → APPROVED → ARCHIVED
              ↓
          REJECTED（可重新发起）
```

**工资单状态**
```
PREVIEW → PENDING_CONFIRM → CONFIRMED → ARCHIVED
    ↓           ↓
  校验失败   DISPUTED → CORRECTED → ARCHIVED
```

## 5. 权限模型

权限由以下维度交集决定：
1. **角色** — `EMPLOYEE | WORKER | FINANCE | PROJECT_MANAGER | CEO`
2. **员工类型** — `OFFICE | LABOR`
3. **部门范围** — 是否同部门
4. **项目范围** — 是否为项目参与人员
5. **数据所有权** — 是否本人创建

### 权限矩阵（核心功能）

| 功能 | 员工 | 劳工 | 财务 | 项目经理 | CEO |
|---|---|---|---|---|---|
| 登录双端 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 发起请假/加班 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 发起工伤补偿 | ✗ | ✓ | 代录入 | 代录入 | ✓ |
| 提交施工日志 | ✗ | ✓ | ✗ | ✗ | ✗ |
| 审批（初审） | ✗ | ✗ | ✗ | ✓ | ✓ |
| 审批（终审） | ✗ | ✗ | ✗ | ✗ | ✓ |
| 查看本人工资条 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 查看全员工资条 | ✗ | ✗ | ✓ | ✗ | ✓ |
| 执行结算 | ✗ | ✗ | ✓ | ✗ | ✗ |
| 通讯录导入 | ✗ | ✗ | ✓ | ✗ | ✓ |
| 角色权限配置 | ✗ | ✗ | ✗ | ✗ | ✓ |
| 数据有效期配置 | ✗ | ✗ | ✗ | ✗ | ✓ |

## 6. 审批流设计

### 6.1 可配置审批流
适用于：请假、加班、工伤补偿、施工日志、工资异议。

每种业务类型关联一个审批流定义（`ApprovalFlowDef`），由有序节点列表组成：

```java
ApprovalFlowDef  { businessType, nodes }
ApprovalFlowNode { nodeOrder, nodeName, approverType(ROLE|DESIGNATED), approverRef }
```

系统默认两节点（CEO 可在后台修改节点数量和审批人）：

```
提交 → 节点1:初审（项目经理角色）→ 节点2:终审（CEO 角色）→ 通过/驳回
```

设计约束（当前版本）：
- 施工日志仅到初审，无需 CEO 终审
- 支持按角色或指定人配置，不支持条件分支和并行会签
- 流程变更仅对新提交单据生效，不影响历史在途单据
- 审批通过后系统自动归档；驳回后保留原单据历史，申请人可重新发起

### 6.2 审批接口
```
GET    /approval/flows                          # 查询各业务类型审批流配置（CEO）
PUT    /approval/flows/{businessType}           # 修改审批流配置（CEO）
POST   /forms/{id}/approve                      # 通过
POST   /forms/{id}/reject                       # 驳回
```
请求体：`{ comment: string }`

## 7. 薪资结算设计

### 7.1 算薪输入
- 员工档案、员工类型、角色等级
- 请假结果、加班结果、考勤结果
- 工伤补偿结果（仅存在通过申请时纳入）
- 社保、公积金、个税规则配置

### 7.2 工资项
基本工资、绩效工资、加班工资、请假扣款、工伤补偿、社保、公积金、个税、实发工资。

### 7.3 结算周期

默认按月结算，CEO 可配置周期类型（月结 / 半月结），字段存储在 `PayrollRule.cycleType`。

### 7.4 结算流程
```
1. 财务执行预结算（生成 PREVIEW 周期）
2. 系统校验：审批完整性、考勤完整性、日志完整性、工伤补偿状态、档案完整性
3. 校验通过 → 正式结算（周期锁定）
4. 员工查看工资条 → 电子签名确认 或 发起异议（见第 12 节）
5. 财务发起更正 → CEO 审批解锁 → 重新结算（生成新版本，历史版本保留）
6. 周期关闭 → 归档
```

### 7.4 薪资接口
```
GET    /payroll/cycles
POST   /payroll/cycles/{id}/precheck      # 预结算（仅财务）
POST   /payroll/cycles/{id}/settle         # 正式结算（仅财务）
POST   /payroll/cycles/{id}/recalculate    # 重新结算（仅财务）
GET    /payroll/slips?cycleId={cycleId}
GET    /payroll/slips/{id}
POST   /payroll/slips/{id}/confirm         # 确认（仅本人）
POST   /payroll/slips/{id}/dispute         # 异议（仅本人）
```

## 8. 前端架构

### 8.0 登录与角色分配流程

角色由管理员（CEO / 财务）在角色管理页配置，并通过员工管理页分配给员工。员工登录时**不选择角色**，后端返回被分配的角色，前端按角色渲染视图。

```
POST /auth/login  →  { token, user: { role, roleName, department, ... } }
                  →  userStore.setSession(token, user)
                  →  uni.redirectTo('/pages/index/index')
                  →  页面按 userStore.userInfo.role 渲染对应视图
```

**禁止设计"角色选择"步骤**，现有 `pages/role/index.vue` 应重构为角色 CRUD 管理页（CEO / 财务专用），参见 `COMPONENT_LAYOUT.md §7`。

---

### 8.1 前端适配层（双端组件适配）

前端采用**适配器模式**统一管理 H5（Ant Design Vue）和 MP（Vant）双端组件差异：

```
src/adapters/
├── index.ts                   # 统一导出
├── resolver.ts                # 平台检测 + 组件动态加载逻辑
└── config/
    ├── components.json        # 组件名 → H5/MP 来源映射
    └── props-map.json         # 组件 props 跨平台映射规则
```

**核心 API：**
```typescript
// 异步加载组件（常用）
const Button = await getComponent('Button')

// 批量并行加载（推荐，在页面 script setup 中使用）
const { Button, Card, Table } = useComponent(['Button', 'Card', 'Table'])

// components.json 映射示例
{
  "Button": {
    "h5": { "source": "ant-design-vue", "name": "Button" },
    "mp": { "source": "vant", "name": "Button" }
  }
}
```

**适配层使用原则：**
- 业务页面的主体 UI（列表、表格、表单）使用适配层加载组件
- 登录页、我的页等纯输入/展示页面**直接使用 uni-app 原生元素**（`input`、`view`），不经适配层，保证立即渲染
- 新增组件先在 `components.json` 注册，再在页面中调用

---

### 8.2 CSS 变量体系

前端统一使用 `--oa-*` 前缀的 CSS 变量（定义在 `styles/variables.scss`，通过 `:root` 导出为 CSS 自定义属性）：

```
--oa-primary      #003466   主色（深海军蓝）
--oa-primary-light #e6f0f7  主色浅背景
--oa-text-primary  rgba(0,0,0,0.85)  正文
--oa-text-secondary rgba(0,0,0,0.65) 辅助文字
--oa-text-tertiary rgba(0,0,0,0.45)  占位/说明
--oa-border        #d9d9d9  边框
--oa-radius-sm/md/lg/xl  4/8/12/16px  圆角
--oa-success/warning/error  功能色
```

**使用规范：**
- 所有新页面和组件**只使用 `--oa-*` 变量**，禁止硬编码颜色值
- 组件库覆盖变量（`--ant-color-primary`、`--van-primary-color` 等）统一在 `App.vue` 中对齐到 `--oa-primary`
- 禁止创建第二套变量体系

---

### 8.3 HTTP 层规范

所有 HTTP 请求**统一通过 `utils/http.ts` 的 `request()` 函数**，禁止各模块自行封装请求逻辑。

```typescript
// utils/http.ts 的能力
// ✓ 自动携带 X-Client-Type: web | mp
// ✓ 自动附加 Bearer Token
// ✓ 401 自动跳转登录页
// ✓ 请求失败自动 showToast
```

`utils/access.ts` 中包含的私有 `request()` 函数需迁移至使用 `utils/http.ts`（存量技术债，见 TODO.md）。

---

## 9. 前端配置驱动方案

### 8.1 设计原则
- 后端统一下发：菜单树、路由、页面模板类型、字段配置、校验规则、列表列、按钮权限、显隐规则
- 前端内置标准组件库：表单页容器、列表页容器、详情页容器、审批页容器、看板卡片、附件上传、选人/选项目/选时间组件
- 前端仅负责：拉取配置 → 按配置渲染 → 调用接口 → 通用交互 + 终端适配

### 8.2 设备类型协议

前端启动后在所有请求中携带设备类型头，后端按此返回对应视图配置：

```
X-Client-Type: web    # Web 端（手机浏览器 / 平板 / PC）
X-Client-Type: mp     # 企业微信工作台小程序
```

### 8.3 配置下发时机

采用**按需动态拉取**：前端每次进入页面时，携带路由编码和 `X-Client-Type` 请求页面配置，Session 内缓存，后端推送版本变更时前端清除缓存。

```
GET /page-config/{routeCode}?clientType=web|mp
```

### 8.4 工作台数据加载策略

工作台采用混合加载：

- **聚合摘要**（`GET /workbench/summary`）：首屏一次请求，返回待办数量、薪资状态、在建项目数、近期到期提醒，后端缓存 60 秒
- **详细列表**：待办列表、通知列表进入对应页面时按需懒加载，不在工作台首屏请求

### 8.5 表单配置示例
```
GET /forms/config?formType=LEAVE
```
返回：
```json
{
  "formType": "LEAVE",
  "formName": "请假申请",
  "fields": [...],
  "actions": [...],
  "approvalFlow": {
    "nodes": [
      { "nodeName": "初审", "approverRole": "PROJECT_MANAGER" },
      { "nodeName": "终审", "approverRole": "CEO" }
    ]
  }
}
```

## 10. 附件与数据清理

### 10.1 存储方案

采用**本地文件系统 + PostgreSQL 存路径**：
- 原始文件存本地文件系统
- 数据库只存附件元数据（`AttachmentMeta`）：附件 ID、业务类型、业务 ID、存储路径、摘要

文件路径规范：
```
/uploads/{业务类型}/{yyyy-MM}/{UUID}.{ext}

示例：
  /uploads/leave/2026-04/3f8a1c2d-....jpg
  /uploads/injury/2026-04/a91b3e7f-....pdf
  /uploads/payroll-confirm/2026-04/b72c....pdf
  /uploads/signature/emp-{employeeId}-sig.enc
```

业务类型枚举：`leave` / `overtime` / `injury` / `construction-log` / `payroll-confirm` / `signature` / `export`

### 10.2 清理流程
```
识别到期数据 → 定位业务记录 → 查找附件元数据 → 删除物理文件 → 删除数据库记录 → 记录审计日志
```
- 物理文件删除失败不得标记清理完成
- 失败进入重试队列，多次失败后转人工补偿

## 11. 核心接口清单

### 认证
```
POST /auth/login
POST /auth/dev-login
```

### 组织
```
GET    /employees
GET    /projects
POST   /directory/import/preview
POST   /directory/import/apply
```

### 表单与审批
```
GET    /forms/config?formType={type}
GET    /forms/todo
GET    /forms/history
GET    /forms/{id}
POST   /forms/leave
POST   /forms/overtime
POST   /forms/injury
POST   /forms/log
POST   /forms/{id}/approve
POST   /forms/{id}/reject
```

### 薪资
```
GET    /payroll/cycles
POST   /payroll/cycles/{id}/precheck
POST   /payroll/cycles/{id}/settle
POST   /payroll/cycles/{id}/corrections
POST   /payroll/cycles/{id}/recalculate
GET    /payroll/slips
GET    /payroll/slips/{id}
POST   /payroll/slips/{id}/confirm
POST   /payroll/slips/{id}/dispute
```

### 配置与管理
```
GET    /roles
POST   /roles
GET    /retention/policies
POST   /retention/policies
GET    /retention/reminders
```

## 12. 页面布局设计

各页面的角色视图布局、组件组合方式、动态数据绑定和权限差异等详细设计见：

→ [COMPONENT_LAYOUT.md](./COMPONENT_LAYOUT.md)

## 13. 工资条电子签名架构

### 13.1 数据模型

```java
// 员工签名档案（每人一条）
EmployeeSignature {
  employeeId,
  signatureImageEncrypted,  // 加密存储的手写签名图片
  signatureHash,            // SHA-256 哈希，用于完整性校验
  pinHash,                  // PIN 码 bcrypt 哈希（不可逆）
  boundAt                   // 首次绑定时间
}

// 工资确认留档（每次确认一条）
PayrollConfirmation {
  slipId, employeeId,
  confirmedAt,              // 签署时间（UTC）
  clientIp, userAgent,
  payrollContentHash,       // 工资单数据 SHA-256（内容防篡改）
  signatureHash,            // 本次使用的签名哈希（防签名被替换）
  intentStatementVersion,   // 意图声明文本版本号
  evidencePdfPath           // 签署 PDF 存储路径
}
```

### 13.2 签署流程

```
首次：Canvas 手写签名 → 加密存档 → 绑定员工 ID → 设置独立 PIN 码
非首次：
  展示已绑定签名预览 + 意图声明文本
  → 输入 PIN 码（与登录密码独立）
  → 后端校验 PIN 哈希
  → 生成 PayrollConfirmation 记录（含完整证据链）
  → 生成签署 PDF（明细 + 签名叠加 + 时间戳水印）→ 存档
```

意图声明文本（版本化管理）：
> "本人已阅读并确认上述工资明细，同意结算结果。"

存证保留期：不少于劳动合同终止后 5 年。

### 13.3 SignatureProvider 抽象

```
SignatureProvider（接口）
  ├── LocalSignatureProvider   // 当前实现：自建存证
  └── EsignSignatureProvider   // 预留：e签宝 CA 存证（配置项开关启用）
```

切换 Provider 只改配置，不影响业务逻辑。

### 13.4 相关接口

```
POST /signature/bind          # 首次绑定手写签名
POST /signature/set-pin       # 设置 PIN 码
GET  /signature/status        # 查询当前用户签名绑定状态
POST /payroll/slips/{id}/confirm  # 工资确认（含 PIN 校验）
```

## 14. 企业微信接入（预留能力）

企业微信相关能力通过独立服务模块（`WeworkService`）封装，待 `corpId` / `agentId` / `secret` 等信息就绪后替换实现，不影响现有业务逻辑。

接入范围：
- 企业微信 OAuth 身份登录（`/auth/wework`，当前返回 501）
- 通讯录批量导入（接入企业微信 API，当前使用 mock 数据）
- 应用消息推送（审批通知、工资条发布、到期提醒）
- 小程序内发起企业微信联系人会话
