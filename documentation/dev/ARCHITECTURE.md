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

### 6.1 通用审批流
适用于：请假、加班、工伤补偿、施工日志、工资异议。

```
提交 → 初审（项目经理）→ 终审（CEO）→ 通过/驳回
```
- 施工日志仅到初审，无需 CEO 终审
- 审批通过后系统自动归档
- 驳回后保留原单据历史，申请人可重新发起

### 6.2 审批接口
```
POST /forms/{id}/approve   # 通过
POST /forms/{id}/reject    # 驳回
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

### 7.3 结算流程
```
1. 财务执行预结算（生成 PREVIEW 周期）
2. 系统校验：审批完整性、考勤完整性、日志完整性、工伤补偿状态、档案完整性
3. 校验通过 → 正式结算（周期锁定）
4. 员工查看工资条 → 确认 或 发起异议
5. 财务发起更正 → CEO 审批解锁 → 重新结算（生成新版本）
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

## 8. 前端配置驱动方案

### 8.1 设计原则
- 后端统一下发：菜单树、路由、页面模板类型、字段配置、校验规则、列表列、按钮权限、显隐规则
- 前端内置标准组件库：表单页容器、列表页容器、详情页容器、审批页容器、看板卡片、附件上传、选人/选项目/选时间组件
- 前端仅负责：拉取配置 → 按配置渲染 → 调用接口 → 通用交互 + 终端适配

### 8.2 表单配置示例
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

## 9. 附件与数据清理

### 9.1 存储方案
- 原始文件存文件系统/对象存储
- 数据库只存附件元数据（`AttachmentMeta`）：附件 ID、业务类型、业务 ID、存储路径、摘要

### 9.2 清理流程
```
识别到期数据 → 定位业务记录 → 查找附件元数据 → 删除物理文件 → 删除数据库记录 → 记录审计日志
```
- 物理文件删除失败不得标记清理完成
- 失败进入重试队列，多次失败后转人工补偿

## 10. 核心接口清单

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
