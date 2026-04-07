# 博渊 OA — AI 上下文摘要

> **用途**：防止上下文丢失。新会话先读本文件，再读 `tech_doc/todo.md` 确认进度，再按需深入具体文档。
> **维护规范**：重要设计变更后同步更新。不记录代码细节。

---

## 1. 项目定位

面向中小型建筑施工企业的内部管理平台（首客：众维建筑工程有限公司，约 200 人）。uni-app 前端（H5 + 企业微信小程序）+ Spring Boot 后端 + PostgreSQL。

---

## 2. 当前状态（2026-04-07）

| 模块 | 状态 | 代码实证 |
|------|------|---------|
| M0 基础设施 | ✅ 完成 | schema.sql / data.sql 存在，前后端可启动 |
| M1 身份认证 | ✅ 完成 | JWT、Employee CRUD、角色、忘记密码 |
| M2 组织管理 | ✅ 完成 | 部门树、项目 CRUD（含多 PM）、岗位管理 |
| M3 审批流引擎 | 🟡 进行中 | ApprovalFlowService / FormService 已真实实现；TraceIdFilter / OperationLogAspect / aspect目录 / filter目录 均不存在 |
| M4 考勤 | 🟡 进行中 | 后端 AttendanceController 已接入真实 FormService + ApprovalFlowService；前端 attendance/index.vue 全为 mock |
| M5 薪资 | ❌ 未开始 | PayrollController 返回 501 占位；payroll/index.vue 全为 mock |
| M6 项目管理 | 🟡 进行中 | ProjectController 真实实现（CRUD + 成员）；projects/index.vue 调用真实 API；里程碑/Dashboard 未实现 |
| M7–M12 | ❌ 未开始 | — |

**P0 技术债已清理**：OaDataService 已删除，UserController/UserService/User 实体已删除，6 个受影响 Controller 均已替换为 501 占位。

### 下一步

继续 M3 剩余任务：`TraceIdFilter.java`、`OperationLogAspect.java`、WorkLogController 迁移到 FormService（参照 AttendanceController）、ApprovalFlowDef CRUD 接口。M3 检查点全过后进入 M4 前端接入。

---

## 3. 文档地图

| 文档 | 内容 |
|------|------|
| `tech_doc/architecture.md` | 系统架构图、实体字段表、API 规范、模块解耦（§12）、日志系统（§13） |
| `tech_doc/backend_impl.md` | 包结构、MyBatis-Plus 约定、JWT、权限 AOP、引擎实现模式 |
| `tech_doc/frontend_impl.md` | 适配层、useComponent、HTTP 层、CSS 变量 |
| `tech_doc/todo.md` | **唯一进度入口**，M0–M12 任务和检查点 |
| `test/test_design.md` | 测试策略、用例设计、Dev 快捷工具设计（§10） |
| `design.md` | 角色/权限/审批流/薪资规则/数据保留（建筑工程版） |

---

## 4. 核心设计决策

### 4.1 Employee = 用户，不存在 User 实体

`employee.employee_no` 是登录名，`password_hash` 存 bcrypt 哈希。Sysadmin 是独立系统账号，不在 employee 表。

### 4.2 权限三条线（独立，不互推）

```
① 能做什么操作  →  role.permissionCodes（RBAC，接口/按钮级）
② 看到哪些模块  →  position.featureFlags（岗位特性，菜单级）
③ 看到多大范围  →  roleCode → dataScope 静态映射（GLOBAL/DEPARTMENT/PROJECT/SELF）
```

`employeeType` 只是展示字段，从岗位名自动同步，不参与任何权限计算。

### 4.3 审批流

- `ApprovalFlowNode.skipCondition`：`{"type":"SUBMITTER_ROLE_MATCH","roleCode":"project_manager"}`，PM 提交工伤时跳过 PM 审批节点
- 多 PM 项目：提交时从 PM 列表选一位（`assignedReviewerId`），不广播
- 无直系领导时，DIRECT_SUPERVISOR 节点自动转交 CEO

### 4.4 薪资结算

- 窗口期字段存在 `payroll_cycle` 中（无独立表），只能自动到期锁定，**不存在 closeWindow() 方法**
- 结算只有 2 项强制检查：无 PENDING_REVIEW 异议单 + 无 CALCULATING 计算任务
- 工资条明细以 `PayrollSlipItem` 行存储，关联 `PayrollItemDef`（非 JSON 字段）

### 4.5 模块解耦（§12）

模块间通信只用 `ApplicationEvent`，禁止跨模块直接注入 Service。可选模块用 `@ConditionalOnProperty` 守门。DB 表前缀：atd\_ / con\_ / pay\_ / prj\_ / dlc\_。

### 4.6 日志双层（§13）

- **OperationLog**：写 DB，业务可见的审计日志，AOP 驱动（`@OperationLogRecord`）
- **SystemLog**：写文件，NDJSON 格式，运维专用，通过 `tools/log_analyzer/` 分析
- 每请求由 `TraceIdFilter` 生成 UUID trace_id，注入 SLF4J MDC，响应头携带 `X-Trace-Id`

### 4.7 文件存储

服务器本地 FS，路径 `/uploads/{业务类型}/{yyyy-MM}/{UUID}.{ext}`，元数据存 `AttachmentMeta` 表。禁止存 BLOB。

### 4.8 前端组件

页面必须通过 `useComponent()` composable 加载跨端组件（H5→AntD，MP→Vant），禁止在页面硬编码组件库名称。

---

## 5. 关键文件

| 文件 | 说明 |
|------|------|
| `app/frontend/src/utils/http.ts` | 唯一 HTTP 出口 |
| `app/frontend/src/composables/useComponent.ts` | 跨端组件加载 |
| `app/frontend/src/adapters/config/components.json` | H5↔MP 组件映射表 |
| `app/frontend/src/stores/user.ts` | Pinia 用户状态（token + 员工信息） |
| `app/backend/src/main/resources/db/schema.sql` | 35 张表 DDL |
| `app/backend/src/main/resources/db/data.sql` | 5个测试账号 + 种子数据 |
| `app/backend/.../service/ApprovalFlowService.java` | 审批流引擎核心，已真实实现 |
| `app/backend/.../service/ApprovalFlowService.java` | 审批流引擎核心，已真实实现 |

---

## 6. 禁止事项

- 禁止创建独立 `User` 实体（Employee 即用户）
- 禁止用 `employeeType` 参与权限计算
- 禁止将结算前置检查扩展超过 2 项
- 禁止创建独立 `payroll_window_period` 表
- 禁止实现 `PayrollEngine.closeWindow()`
- 禁止在 `ProjectMilestone` 中加 `plannedDate`/`targetDate`
- 禁止在 `Project` 表中加 `pmId`（多 PM 用 ProjectMember.role=PM）
- 禁止文件存 BLOB
- 禁止页面硬编码 AntD/Vant 组件名
- 禁止将 `leaveDeductRates`/`socialInsuranceRates` 作为 JSON 存 Position（用 `LeaveTypeDef`/`SocialInsuranceItem` 参考表）
- 禁止跨模块直接注入 Service（用 ApplicationEvent）
- 禁止 Dev 工具出现在生产构建中（`import.meta.env.DEV` + `@Profile("dev")` 双重守门）

---

## 7. 暂缓功能（勿提前实现）

- 企业微信 OAuth 登录（`/auth/wework` 当前返回 501）
- 企业微信通讯录批量导入
- 企业微信应用消息推送
- e签宝 CA 对接（`EsignSignatureProvider`，当前只有 `LocalSignatureProvider`）
- `GET /workbench/summary` 缓存层（不加 Redis）
