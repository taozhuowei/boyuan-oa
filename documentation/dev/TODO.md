# 开发进度管理

> **本文档是唯一的进度管理入口**。所有任务进度在此统一维护。
> 每完成一个任务后，立即更新本文档并提交 Git。

## 总体进度

| 阶段 | 名称 | 状态 | 说明 |
| ---- | ---- | ---- | ---- |
| 一 | 需求分析与设计 | ✅ 已完成 | 需求文档、设计稿、架构设计 |
| 二 | 工程基础与启动能力 | ✅ 已完成 | 前后端脚手架、认证、权限、基础实体 |
| 三 | 业务功能完善 | 🔄 进行中 | 架构重构完成，业务功能使用 Mock 数据 |
| 四 | 前后端联调 | ⏸ 未开始 | 页面对接后端真实接口 |
| 五 | 测试与优化 | ⏸ 未开始 | 单元测试、集成测试、性能优化 |
| 六 | 部署上线 | ⏸ 未开始 | 生产环境部署 |

---

## 前端进度

### 工程基础 ✅

- [x] uni-app + Vue 3 + TypeScript + Vite 脚手架
- [x] Pinia 状态管理（user store）
- [x] 适配器架构（JSON 配置驱动组件映射）
  - [x] `adapters/config/components.json` — 组件映射配置
  - [x] `adapters/config/props-map.json` — 属性映射配置
  - [x] `adapters/resolver.ts` — 配置解析器
  - [x] `adapters/index.ts` — 统一导出
- [x] SCSS 变量体系（`styles/variables.scss`）
- [x] 旧组件库清理（删除 `ui-kit/`、`ui/`）

### 跨平台组件 ✅

- [x] `cross-platform/Timeline` — 时间轴组件（index.vue + TimelineItem.vue）

### 定制组件 ✅

- [x] `customized/StatCard.vue` — 统计卡片
- [x] `customized/ModuleCard.vue` — 模块入口卡片
- [x] `customized/UserInfo.vue` — 用户信息
- [x] `customized/UserAvatar.vue` — 用户头像
- [x] `customized/Permission.vue` — 权限控制

### 页面开发

> 所有页面均已完成 UI 布局和角色视图切换，但**全部使用 Mock 数据**，未对接后端接口。

#### 登录页 `pages/login` ✅

- [x] 登录表单 UI
- [x] 本地 Mock 登录逻辑
- [ ] 对接后端 `/auth/login` 接口

#### 工作台 `pages/index` ✅

- [x] CEO / 项目经理 / 财务 / 员工 / 劳工 五种角色视图
- [x] 待办事项、快捷统计、系统通知、模块入口卡片
- [x] Mock 数据 (`workbench-data.ts`)
- [ ] 对接后端 `/workbench/config` 聚合接口

#### 考勤管理 `pages/attendance` ✅（UI）

- [x] CEO/项目经理 审批视图（待审批列表 + 审批详情 + Timeline 审批流程）
- [x] 员工/劳工 申请视图（请假表单 + 加班表单 + 历史记录 + Timeline）
- [x] 本月考勤统计卡片
- [ ] 对接后端审批接口（`/forms/todo`, `/forms/{id}/approve`, `/forms/{id}/reject`）
- [ ] 对接后端表单提交接口（`/forms/leave`, `/forms/overtime`）
- [ ] 考勤统计图表（设计稿未明确，暂缓）

#### 薪资管理 `pages/payroll` ✅（UI）

- [x] 员工视图（薪资卡片 + 薪资明细 + 审批流程 Timeline + 历史记录）
- [x] CEO/财务视图（统计卡片 + 员工薪资管理表格 + 搜索 + 导出）
- [ ] 对接后端薪资接口（`/payroll/cycles`, `/payroll/slips`）
- [ ] 工资条确认/异议流程（`/payroll/slips/{id}/confirm`, `/payroll/slips/{id}/dispute`）

#### 项目管理 `pages/projects` ✅（UI）

- [x] 项目列表（卡片布局 + 进度条 + 成员头像 + 状态筛选 + 搜索）
- [x] 施工日志 Timeline
- [x] 新建项目弹窗（CEO 可见）
- [ ] 对接后端项目接口（`/projects`）
- [ ] 项目详情页（独立页面，目前点击仅 toast 提示）

#### 员工管理 `pages/employees` ✅（UI）

- [x] 员工列表表格（头像 + 工号 + 部门 + 职位 + 状态 + 操作）
- [x] 搜索/筛选（姓名/工号 + 部门过滤）
- [x] 添加/编辑员工弹窗
- [x] 部门人员分布统计（CEO/财务可见）
- [ ] 对接后端员工接口（`/employees`）
- [ ] 员工详情页
- [ ] 角色分配功能

#### 角色管理 `pages/role` ✅（UI）

- [x] 角色列表 + 角色详情/编辑
- [x] 权限配置 checkbox
- [x] CEO/财务差异权限控制
- [ ] 对接后端角色接口（`/roles`）

### 前端待办汇总

- [ ] 所有页面从 Mock 数据切换到后端接口
- [ ] 工伤补偿申请页面（劳工可见，设计稿有但未实现）
- [ ] 通讯录导入页面（财务可见，后端已有接口）
- [ ] 数据有效期配置页面（CEO 可见）
- [ ] 响应式适配优化（手机/平板布局）
- [ ] 前端单元测试（当前 0 个 spec 文件）

---

## 后端进度

### 工程基础 ✅

- [x] Spring Boot 3 + Java 17 项目初始化
- [x] PostgreSQL + MyBatis-Plus 集成
- [x] 统一响应封装 + 全局异常处理
- [x] Spring Security + JWT 认证
- [x] 角色权限注解（`@PreAuthorize`）

### 实体层 ✅

- [x] User, Role, Employee, Department, Project
- [x] FormRecord（请假/加班/工伤/日志通用表单）
- [x] PayrollCycle, PayrollSlip

### Mapper 层

- [x] UserMapper, EmployeeMapper, RoleMapper
- [ ] FormRecordMapper, ProjectMapper, DepartmentMapper
- [ ] PayrollCycleMapper, PayrollSlipMapper

### Controller 层（接口骨架已有，Service 实现程度不一）

- [x] AuthController — 登录/登出/Token 刷新
- [x] RoleController — 角色 CRUD
- [x] EmployeeController — 员工 CRUD
- [x] ProjectController — 项目 CRUD
- [x] PayrollController — 薪资周期/工资单/结算/确认/异议
- [x] WorkbenchController — 工作台聚合配置
- [x] DirectoryImportController — 通讯录导入
- [x] AttendanceController — 考勤
- [x] WorkLogController — 施工日志
- [x] NotificationController — 通知
- [x] RetentionController, BackupController, CleanupController — 数据留档

### Service 层

- [x] OaDataService — 表单/审批/薪资核心业务逻辑
- [x] AccessManagementService — 角色权限管理
- [x] JwtTokenService — Token 生成/解析
- [x] UserService / UserServiceImpl — 用户查询
- [ ] 考勤统计 Service（打卡、统计接口）
- [ ] 薪资计算 Service（算薪规则引擎）
- [ ] 施工日志 Service（日志审批流程）

### 数据库

- [x] `schema.sql` 建表脚本
- [ ] 初始化测试数据脚本（`data.sql`）
- [ ] 数据库迁移管理（Flyway / Liquibase）

### 后端测试

- [x] AuthControllerTest — 登录认证测试
- [x] OaApiIntegrationTest — API 集成测试
- [ ] Service 层单元测试（OaDataService, AccessManagementService）
- [ ] 权限隔离测试（角色 vs 接口访问控制）

---

## 废弃项

> 以下任务曾出现在历史规划中，目前确认不在当前版本范围内。

- ~~企业微信身份登录对接~~ — 后续版本
- ~~数据有效期与清理任务管理~~ — 后续版本
- ~~composables/useComponent.ts~~ — 曾规划但未实现，适配器层 `getComponent()` 已满足需求

---

## 历史记录

### 2026-04-01 文档整改

- [x] 删除 `documentation/ai/` 目录（AGENTS.md）
- [x] 删除 `app/frontend/REFACTOR_TODO.md`
- [x] 重写 TODO.md，按代码实际拆解任务
- [x] 更新 PROJECT.md、README.md 等文档对齐

### 2026-04-01 前端架构重构完成

- [x] 适配器架构搭建（JSON 配置驱动）
- [x] 7 个页面迁移到适配器架构
- [x] 旧组件库删除（ui-kit/, ui/）
- [x] TypeScript 类型检查修复
- [x] Web 构建验证通过

### 2026-03-31 前期完成

- [x] 工程稳定性修复（前后端编译、测试通过）
- [x] 门户工作台与统一视觉基线
- [x] 后端基础 API 骨架
- [x] 角色权限矩阵
