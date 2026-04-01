# 开发进度管理

> **本文档是唯一的进度管理入口**。所有任务进度在此统一维护。
> 每完成一个任务后，立即更新本文档并提交 Git。

## 当前架构现状

整个系统前后端**均为 Mock 数据驱动**：
- **前端**：7 个页面全部使用内联 Mock 数据 / `workbench-data.ts`，仅 `access.ts` 中 `uni.request` 调用后端登录接口
- **后端**：`OaDataService`（718 行）是一个**纯内存 ConcurrentHashMap 存储**，`@PostConstruct` 预填充种子数据，不连接数据库
- **数据库**：`schema.sql` 仅有 `sys_user` 和 `sys_role` 两张表，其余 6 个实体（Employee, Project, FormRecord, Department, PayrollCycle, PayrollSlip）**无建表脚本**
- **Mapper 层**：仅 `UserMapper`、`EmployeeMapper`、`RoleMapper` 存在，其余未创建
- **实体层**：8 个实体类均已定义但与 `OaDataService` 内部类重复，未被 Controller 使用

---

## 已完成

### 前端工程基础

- [x] uni-app + Vue 3 + TypeScript + Vite 脚手架搭建
- [x] Pinia 状态管理 — `stores/user.ts`
- [x] 适配器架构 — JSON 配置驱动组件映射（`adapters/`）
- [x] SCSS 变量体系 — `styles/variables.scss`
- [x] 旧组件库删除 — `ui-kit/`、`ui/` 已清理
- [x] 跨平台组件 — `cross-platform/Timeline`（index.vue + TimelineItem.vue）
- [x] 定制组件 — StatCard / ModuleCard / UserInfo / UserAvatar / Permission

### 前端页面 UI — 所有页面使用 Mock 数据

- [x] 登录页 — 登录表单 + 本地 Mock 登录
- [x] 工作台 — 5 种角色视图（CEO / 项目经理 / 财务 / 员工 / 劳工）
- [x] 考勤管理 — CEO/项目经理审批视图 + 员工/劳工申请视图 + Timeline 审批流
- [x] 薪资管理 — 员工薪资卡片 + CEO/财务管理表格
- [x] 项目管理 — 项目列表 + 施工日志 Timeline + 新建项目弹窗
- [x] 员工管理 — 员工列表表格 + 搜索筛选 + 添加/编辑弹窗 + 部门统计
- [x] 角色管理 — 角色列表 + 权限 Checkbox + CEO/财务差异控制

### 后端工程基础

- [x] Spring Boot 3 + Java 17 项目初始化
- [x] Spring Security + JWT 认证（`JwtTokenService`）
- [x] 角色权限注解 — `@PreAuthorize`
- [x] 统一响应封装 + 全局异常处理

### 后端 Controller + 内存 Service

- [x] `AuthController` — 登录 / dev-login / Token 验证
- [x] `AttendanceController` — 请假/加班表单配置 + 提交 + 审批 + 记录查询
- [x] `PayrollController` — 周期列表 + 预结算/正式结算 + 工资单 + 确认/异议
- [x] `ProjectController` — 项目列表
- [x] `EmployeeController` — 员工列表 + 详情
- [x] `RoleController` — 角色 CRUD + 权限管理
- [x] `WorkLogController` — 施工日志提交 + 审批
- [x] `WorkbenchController` — 工作台聚合数据
- [x] `DirectoryImportController` — 通讯录导入预览 + 执行
- [x] `NotificationController` — 通知列表 + 未读数
- [x] `RetentionController` + `BackupController` + `CleanupController` — 数据留档

### 后端测试

- [x] `AuthControllerTest` — 登录认证测试
- [x] `OaApiIntegrationTest` — API 集成测试

### 文档

- [x] 项目介绍 — `documentation/biz/PROJECT.md`
- [x] 技术架构 — `documentation/dev/ARCHITECTURE.md`
- [x] 组件布局设计 — `documentation/dev/COMPONENT_LAYOUT.md`
- [x] 测试设计 — `documentation/dev/TEST_DESIGN.md`
- [x] UI 设计稿 — `documentation/designs/`（8 套设计稿）

---

## 待完成

### P0 — 后端数据层（阻塞所有联调工作）

- [ ] 补全数据库建表脚本 — 缺 `employee`、`department`、`project`、`form_record`、`approval_record`、`payroll_cycle`、`payroll_slip` 表
- [ ] 补全 Mapper — `FormRecordMapper`、`ProjectMapper`、`DepartmentMapper`、`PayrollCycleMapper`、`PayrollSlipMapper`
- [ ] 将 `OaDataService` 内存逻辑迁移到真实 Service + Mapper — 消除 ConcurrentHashMap 替代数据库的临时方案
- [ ] 初始化测试数据脚本 — `data.sql`，基于 `OaDataService.init()` 的种子数据转化

### P1 — 前后端联调

- [ ] 前端 HTTP 请求封装 — 统一 `uni.request` 封装（Token 携带、错误处理、Loading 状态）
- [ ] 登录页对接 — `/auth/login` 接口
- [ ] 工作台对接 — `/workbench/config` 聚合接口
- [ ] 考勤管理对接 — `/attendance/leave`、`/attendance/overtime`、`/attendance/todo`、`/attendance/{id}/approve`
- [ ] 薪资管理对接 — `/payroll/cycles`、`/payroll/slips`、`/payroll/slips/{id}/confirm`、`/payroll/slips/{id}/dispute`
- [ ] 项目管理对接 — `/projects`
- [ ] 员工管理对接 — `/employees`
- [ ] 角色管理对接 — `/roles`

### P2 — 前端缺失页面/视图（设计文档有、代码无）

- [ ] 施工日志填报页面 — 劳工视图，`COMPONENT_LAYOUT §4.3` 设计有详细布局
- [ ] 工伤补偿申请页面 — 劳工视图，`COMPONENT_LAYOUT §1.6` 工作台有入口
- [ ] 通讯录导入页面 — 财务/CEO 可见，后端 `DirectoryImportController` 已有接口
- [ ] 项目详情页 — 独立页面，目前点击仅 toast 提示
- [ ] 员工详情页 — 独立页面，目前无实现
- [ ] 薪资管理 CEO 审批视图 — `COMPONENT_LAYOUT §3.1`，当前 CEO 与财务共用同一视图
- [ ] 员工管理项目经理视图 — `COMPONENT_LAYOUT §5.3`，项目经理只读查看项目成员

### P3 — 后端业务逻辑完善

- [ ] 考勤统计 Service — 月度出勤率、请假/加班统计汇总
- [ ] 薪资计算 Service — 基于考勤 + 档案的算薪规则引擎
- [ ] 施工日志审批 Service — 日志仅到初审的差异审批流
- [ ] 工伤补偿 Service — 工伤申请 + 审批 + 补偿金额计算
- [ ] 数据权限过滤 — 项目经理只查看本项目数据、员工只查看自己数据（当前 SecurityUtils 硬编码）

### P4 — 测试

- [ ] 前端单元测试框架搭建 — 当前 0 个 spec 文件
- [ ] 后端 Service 层单元测试 — OaDataService、AccessManagementService
- [ ] 后端权限隔离测试 — 角色 vs 接口访问控制
- [ ] 前后端联调冒烟测试

### P5 — 优化与非功能需求

- [ ] 响应式适配 — 手机/平板布局优化
- [ ] 数据库迁移管理 — Flyway 或 Liquibase
- [ ] 数据有效期配置页面 — CEO 可见，后端 `RetentionController` 已有接口
- [ ] 前端错误边界 — Error Boundary + 非核心资源降级

---

## 后续版本（不在当前范围）

- 企业微信身份登录对接
- 小程序端编译与发布
- 导出报表（Excel）
- 消息推送通知

---

## 变更记录

| 日期 | 内容 |
| ---- | ---- |
| 2026-04-01 | 全面重写 TODO，基于代码审计重新判断完成状态；合并 COMPONENT_LAYOUT 引用到 ARCHITECTURE |
| 2026-04-01 | 文档整改：删除 AGENTS.md / REFACTOR_TODO.md，进度统一收口 |
| 2026-04-01 | 前端架构重构完成：适配器架构 + 7 页面迁移 + 旧组件库清理 |
| 2026-03-31 | 工程稳定性修复、门户工作台基线、后端 API 骨架、权限矩阵 |
