# 博渊 OA 平台 — 0→1 开发路线图

> **唯一进度管理入口。** 完成一项立即打勾并提交。
>
> 优先级说明：`[P0]` 当前阶段阻塞项 / `[P1]` 本阶段核心功能 / `[P2]` 本阶段完整性补充 / `[P3]` 低优先级，延后迭代
>
> 状态说明：`[ ]` 未开始 / `[-]` 进行中 / `[x]` 已完成
>
> 架构决策见 `ARCHITECTURE.md`，页面布局见 `COMPONENT_LAYOUT.md`，测试用例见 `TEST_DESIGN.md`。

---

## 里程碑总览

| Phase | 目标                     | 当前状态  | 验收标准                                      |
|-------|--------------------------|---------|-----------------------------------------------|
| **0** | 工程基础：DB + HTTP 层     | 未开始   | 后端真实启动，前端 HTTP 层统一，无控制台报错       |
| **1** | 前端壳 + 设计确认          | 未开始   | 5个 mock 账号能点遍所有页面，视觉设计已确认        |
| **2** | 身份认证 + 账号/角色管理    | 未开始   | 真实账号登录，CEO 可增删改员工和角色              |
| **3** | 组织管理（部门/项目/成员）  | 未开始   | 项目、成员关系可管理，不依赖内存 mock             |
| **4** | 考勤申请 + 审批流引擎       | 未开始   | 请假单从提交跑到归档，状态流转完整                |
| **5** | 施工专属（日志 + 工伤补偿） | 未开始   | 劳工功能完整，工伤动态路由生效                    |
| **6** | 薪资体系（结算 + 电子签名） | 未开始   | 财务完成结算，员工签名确认工资条                  |
| **7** | 工作台 + 通知系统          | 未开始   | 工作台数据真实，待办角标实时更新                  |
| **8** | 数据管理（保留策略 + 清理）  | 未开始   | 保留策略可配置，到期前 30 天提醒                  |
| **9** | 测试 + 上线准备            | 未开始   | 核心链路自动化测试覆盖，可部署到生产               |

---

## Phase 0 — 工程基础

**目标：** 后端能真实启动并连接数据库，前端 HTTP 层统一，两端可独立运行。

### 检查点（全部通过才进入 Phase 1）

- [ ] `mvn spring-boot:run` 无报错启动，H2 控制台可访问
- [ ] `sys_user` 和 `sys_role` 以外的业务表 schema 已全部建好
- [ ] 前端 `npm run dev:h5` 无控制台报错
- [ ] 所有 HTTP 请求均经过 `utils/http.ts`，无私有 request 函数

### 后端任务

- [ ] `[P0]` 补全 `schema.sql`：新增 `employee`、`department`、`project`、`project_member`、`form_record`、`approval_record`、`approval_flow_def`、`approval_flow_node`、`salary_grade`、`payroll_cycle`、`payroll_slip`、`payroll_item`、`payroll_adjustment`、`payroll_confirmation`、`employee_signature`、`injury_claim`（工伤理赔记录，独立于 form_record）、`operation_log`（审批操作日志，永久保留）、`notification`、`retention_policy`、`retention_reminder`、`cleanup_task`、`export_backup_task`
  > 检查: `app/backend/src/main/resources/db/schema.sql` — 搜索每个表名，确认21张业务表 CREATE TABLE 语句全部存在

- [ ] `[P0]` 补全 `data.sql`：写入 5 个测试账号（employee.demo、worker.demo、pm.demo、ceo.demo、finance.demo）及对应角色、部门数据
  > 检查: `app/backend/src/main/resources/db/data.sql` — 搜索 employee.demo / worker.demo / pm.demo / ceo.demo / finance.demo，确认5条 INSERT 记录均存在

- [ ] `[P1]` 补全 Mapper：`EmployeeMapper`（扩展现有）、`ProjectMapper`、`DepartmentMapper`
  > 检查: `app/backend/src/main/java/com/oa/backend/mapper/` — 确认 ProjectMapper.java 和 DepartmentMapper.java 文件存在且有基础 CRUD 方法

- [ ] `[P1]` `ApprovalFlowNode` 实体新增 `skipCondition` JSON 字段（用于工伤补偿动态路由，见 WORKFLOW_CONFIG §1.3）
  > 检查: `app/backend/src/main/java/com/oa/backend/entity/ApprovalFlowNode.java` — 搜索 `skipCondition` 字段声明

### 前端任务

- [ ] `[P0]` 迁移所有 HTTP 请求到 `utils/http.ts`：清理 `access.ts` 和 `forms.ts` 中的私有 `request()` 函数
  > 检查: `app/frontend/src/utils/access.ts` 和 `forms.ts` — 确认无独立 request/axios 函数；`http.ts` 包含唯一导出的 request 函数

- [ ] `[P0]` `http.ts` 补全：自动携带 `X-Client-Type`、401 自动跳转登录、错误 toast 提示
  > 检查: `app/frontend/src/utils/http.ts` — 搜索 `X-Client-Type`、`401`、`toast`（或 uni.showToast），三项均存在

- [ ] `[P1]` `http.ts` 新增 loading 状态管理（同一接口请求中禁止重复提交）
  > 检查: `app/frontend/src/utils/http.ts` — 搜索防重复提交标志（如 pendingMap / requesting Set），确认同 URL 并发请求被拦截

- [ ] `[P1]` `components.json` 补全注册：`Upload`、`Tabs`/`Tab`、`Tag`、`Steps`/`Step`、`Popup`、`Textarea`、`Canvas`
  > 检查: `app/frontend/src/adapters/config/components.json` — 搜索上述7个组件名，确认全部有 h5 / mp 来源注册

- [ ] `[P2]` `getComponentSync` 补充条件编译实现（当前为空壳）
  > 检查: `app/frontend/src/composables/useComponent.ts` — 查看 `getComponentSync` 函数体，确认有 `#ifdef H5` 和 `#ifdef MP-WEIXIN` 分支

---

## Phase 1 — 前端壳 + 设计确认

**目标：** 用 5 个 mock 账号在本地跑起来，能点遍所有页面，确认设计风格和功能入口。

### 检查点（全部通过才进入 Phase 2）

- [ ] 5 个测试账号均可登录，路由跳转正确
- [ ] 工作台、考勤、薪资、人员管理、审批、系统配置页面均可打开（允许 mock 数据）
- [ ] CEO/财务/项目经理/员工/劳工视图差异正确（菜单入口不同）
- [ ] 双端主色 `#003466` 视觉一致，无明显样式错位
- [ ] 设计风格已由开发者本人确认，可进入功能开发

### 前端任务

- [ ] `[P0]` 验证 5 个测试账号 mock 登录均可正常工作，路由分发正确（sysadmin → `/pages/setup`，其余 → `/pages/index`）
  > 检查: `app/frontend/src/pages/login/index.vue` — 查看 mock 账号列表和登录后 router.push 逻辑，确认 sysadmin 走 setup、其余走 index

- [ ] `[P0]` 排查并修复所有页面 `onMounted` 报错（组件缺失 crash、undefined 引用等）
  > 检查: 运行 `npm run build:h5` — 输出无 error（warning 可忽略）；浏览器 Console 在各页面切换时无红色报错

- [ ] `[P1]` 补全 `components/cross-platform/Table/` 组件（当前文件缺失，MP 会 crash）
  > 检查: `app/frontend/src/components/cross-platform/Table/index.vue` — 文件存在且包含 columns / data props 定义

- [ ] `[P1]` 验证 AntD CSS 变量覆盖（`--ant-color-primary` 对齐 `--oa-primary: #003466`）
  > 检查: `app/frontend/src/` 中的全局样式文件（如 app.vue 或 styles/）— 搜索 `--ant-color-primary`，确认值为 `#003466` 或引用 `--oa-primary`

- [ ] `[P1]` 验证 Vant CSS 变量覆盖（`--van-primary-color` 对齐 `--oa-primary`）
  > 检查: 同上全局样式文件 — 搜索 `--van-primary-color`，确认与主色一致

- [ ] `[P1]` 修复 `components.json` 中 `Textarea` H5 端来源错误（应为 `Textarea` 而非 `Input.TextArea`）
  > 检查: `app/frontend/src/adapters/config/components.json` — 搜索 Textarea 的 h5 字段，确认值为 `Textarea`（AntD）而非 `Input.TextArea`

- [ ] `[P2]` 验证双端主色、圆角、字体、间距视觉一致性（H5 Chrome + 微信开发者工具模拟器）
  > 检查: 同时打开 H5 和微信开发者工具预览相同页面 — 目测主色、卡片圆角、按钮样式无明显差异

- [ ] `[P2]` 各页面使用 mock 数据填充，确保表格、列表、表单均有内容可看
  > 检查: `app/frontend/src/pages/` 下各 index.vue — 搜索 mock 数据对象（如 const list = [] 或 ref([...])），确认有填充项

### 后端任务

- [ ] `[P1]` `GET /setup/status` 接口可用（初始化向导入口）
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/` — 搜索 `/setup/status` 路由或 SetupController 文件

- [ ] `[P1]` `POST /auth/login` 可使用 `data.sql` 中 5 个测试账号登录，返回 JWT + 用户信息
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/AuthController.java` — 确认 `/auth/login` 方法存在；用 Postman/curl 以 ceo.demo 账号验证返回 200 + token

---

## Phase 2 — 身份认证 + 账号/角色管理

**目标：** 真实账号体系，CEO 可管理员工和角色，无需改代码即可新增用户。

### 检查点（全部通过才进入 Phase 3）

- [ ] 使用错误密码登录返回 401，正确密码返回 token
- [ ] JWT payload 包含 `userId`、`roleCode`、`employeeType`
- [ ] CEO 可新增员工，设置角色，账号立即可登录
- [ ] 财务不能为任何角色开启终审权限（见 ROLE_CONFIG §4.3）

### 后端任务

- [ ] `[P0]` JWT payload 写入 `employeeType`、`roleCode`、`userId`
  > 检查: `app/backend/src/main/java/com/oa/backend/security/JwtTokenService.java` — 搜索 `employeeType` 和 `roleCode`，确认写入 Claims

- [ ] `[P0]` 登录响应补充 `employeeType` 字段
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/AuthController.java` — 查看登录接口返回的 DTO/Map，确认含 `employeeType` 字段

- [ ] `[P1]` 员工 CRUD 接口（`GET/POST/PUT/DELETE /employees`），含员工类型、部门、角色关联
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/EmployeeController.java` — 确认4个 HTTP 方法均存在，且 POST/PUT body 含 employeeType / departmentId / roleCode

- [ ] `[P1]` 角色 CRUD 接口（`GET/POST/PUT/DELETE /roles`），含权限项配置
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/RoleController.java` — 确认4个 HTTP 方法存在；PUT 接口支持传递权限项列表

- [ ] `[P1]` 将 `OaDataService` 员工/账号内存逻辑迁移到真实 Service + Mapper
  > 检查: `app/backend/src/main/java/com/oa/backend/service/OaDataService.java` — 确认员工/账号相关方法已删除或调用真实 Mapper（无内存 Map/List 存储）

- [ ] `[P2]` 密码重置接口（`POST /employees/{id}/reset-password`，CEO 专用）
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/EmployeeController.java` — 搜索 `reset-password` 路由和 `@PreAuthorize("hasRole('CEO')")` 注解

- [ ] `[P2]` 账号禁用/启用接口（`PATCH /employees/{id}/status`，CEO 专用）
  > 检查: EmployeeController.java — 搜索 `/status` 路由，确认 PATCH 方法和 CEO 权限校验

- [ ] `[P2]` 预留企业微信 OAuth 骨架（`/auth/wework`，当前返回 501）
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/AuthController.java` — 搜索 `/auth/wework`，确认存在且返回 HTTP 501

### 前端任务

- [ ] `[P0]` 登录成功后将 `employeeType` 写入 `userStore`
  > 检查: `app/frontend/src/stores/user.ts` — 搜索 `employeeType` 字段，确认从登录响应中写入

- [ ] `[P1]` 员工列表接入真实接口，支持部门/角色/类型/状态筛选、关键字搜索
  > 检查: `app/frontend/src/pages/employees/index.vue` — 确认 onMounted 调用 `GET /employees`，筛选参数绑定到接口 query

- [ ] `[P1]` 员工新增/编辑弹窗对接接口
  > 检查: employees/index.vue 或弹窗组件 — 搜索 `POST /employees` 和 `PUT /employees` 调用

- [ ] `[P1]` 角色管理页（列表、新增、编辑权限矩阵）对接接口
  > 检查: `app/frontend/src/pages/role/index.vue` — 确认调用 `GET/POST/PUT /roles`，权限矩阵可勾选

- [ ] `[P2]` 员工详情页（独立页面，见 COMPONENT_LAYOUT §5）
  > 检查: `app/frontend/src/pages/employees/` — 确认有独立的 detail 或 `[id]` 页面文件，路由可跳转

---

## Phase 3 — 组织管理

**目标：** 部门树、项目列表、项目成员关系完整可管理。

### 检查点（全部通过才进入 Phase 4）

- [ ] 部门树可展示，支持新增部门节点
- [ ] 项目列表可管理（新增/编辑/关闭）
- [ ] 项目经理可查看本项目成员，CEO 可添加/移除任意项目成员

### 后端任务

- [ ] `[P0]` 部门树接口（`GET /departments`）
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/` — 确认 DepartmentController.java 存在，`GET /departments` 返回树形结构

- [ ] `[P1]` 项目 CRUD 接口（`GET/POST/PUT/DELETE /projects`）
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/ProjectController.java` — 确认4个方法均存在

- [ ] `[P1]` 项目成员管理接口（`POST/DELETE /projects/{id}/members`）
  > 检查: ProjectController.java — 搜索 `/members` 路由，确认 POST 添加成员、DELETE 移除成员

- [ ] `[P1]` 将 `OaDataService` 部门/项目内存逻辑迁移到真实 Service + Mapper
  > 检查: `app/backend/src/main/java/com/oa/backend/service/OaDataService.java` — 确认部门/项目相关方法已删除或调用 DepartmentMapper / ProjectMapper

### 前端任务

- [ ] `[P1]` 员工管理接入部门树筛选
  > 检查: `app/frontend/src/pages/employees/index.vue` — 搜索部门筛选组件，确认调用 `GET /departments` 获取树数据

- [ ] `[P1]` 项目列表接入真实接口（`GET /projects`）
  > 检查: `app/frontend/src/pages/projects/index.vue` — 确认 onMounted 调用 `GET /projects`，无 mock 数据

- [ ] `[P1]` 项目详情页（独立页面，见 COMPONENT_LAYOUT §4）
  > 检查: `app/frontend/src/pages/projects/` — 确认有 detail 或 `[id]` 页面，包含成员列表展示

- [ ] `[P1]` 项目成员管理：添加/移除成员
  > 检查: 项目详情页 — 搜索 `POST /projects/{id}/members` 和 `DELETE /projects/{id}/members` 调用

- [ ] `[P2]` 员工管理项目经理视图（只读，仅显示本项目成员，见 COMPONENT_LAYOUT §5.3）
  > 检查: employees/index.vue — 搜索 project_manager 角色的条件渲染，确认请求携带项目范围参数

- [ ] `[P2]` 通讯录导入页（`pages/directory/`，财务/CEO 可见，见 COMPONENT_LAYOUT §6）
  - 导入预览（`POST /directory/import/preview`）
  - 字段映射配置
  - 重复检查结果展示
  - 执行导入（`POST /directory/import/apply`）
  - 导入结果明细
  > 检查: `app/frontend/src/pages/directory/` — 确认目录存在，包含上传、预览、映射、执行、结果5个交互步骤；对应后端 DirectoryImportController.java 有 preview 和 apply 接口

---

## Phase 4 — 考勤申请 + 审批流引擎

**目标：** 请假/加班单可完整走完"提交→初审→终审→归档"全流程，审批流引擎可配置。

### 检查点（全部通过才进入 Phase 5）

- [ ] 员工提交请假单，状态为 PENDING
- [ ] 项目经理初审通过，状态变为 APPROVING
- [ ] CEO 终审通过，状态变为 APPROVED，自动归档
- [ ] 驳回后申请人可重新发起（新单据，历史保留）
- [ ] 无项目经理时，节点1自动转交 CEO（兜底机制）

### 后端任务

- [ ] `[P0]` 可配置审批流引擎：`ApprovalFlowDef` CRUD + 执行引擎（按节点推进，支持 `skipCondition`）
  > 检查: `app/backend/src/main/java/com/oa/backend/service/` — 确认 ApprovalFlowService.java（或 ApprovalEngine.java）存在，含 advance() / skip() 方法；`skipCondition` JSON 解析逻辑可搜索 `SUBMITTER_ROLE_MATCH`

- [ ] `[P0]` 系统启动时写入 LEAVE、OVERTIME 默认两级审批流配置
  > 检查: `app/backend/src/main/resources/db/data.sql` — 搜索 `INSERT INTO approval_flow_def` 含 `LEAVE` 和 `OVERTIME` 两条记录

- [ ] `[P0]` 所有审批节点操作（提交、审批、驳回、归档、追溯驳回）写入 `operation_log`，永久保留（不受数据保留策略删除）
  > 检查: `app/backend/src/main/java/com/oa/backend/service/` — 搜索 `OperationLogService` 或 `operationLog`（或对应 Mapper），确认在审批方法中调用

- [ ] `[P1]` 将 `OaDataService` 表单/审批内存逻辑迁移到真实 Service + Mapper
  > 检查: OaDataService.java — 确认表单/审批相关方法已删除或调用真实 Mapper；FormRecord 实体关联 DB 表

- [ ] `[P1]` 请假/加班提交接口（`POST /attendance/leave`、`POST /attendance/overtime`）
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/AttendanceController.java` — 确认两个 POST 方法存在，返回带 `status: PENDING` 的响应

- [ ] `[P1]` 待办列表接口（`GET /forms/todo`，按角色过滤 PENDING/APPROVING 单据）
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/` — 搜索 `/forms/todo` 路由，确认 project_manager 返回 PENDING 单据、CEO 返回 APPROVING 单据

- [ ] `[P1]` 审批操作接口（`POST /forms/{id}/approve`、`POST /forms/{id}/reject`）
  > 检查: 对应 Controller — 搜索 `/approve` 和 `/reject` 路由，确认调用审批引擎推进节点

- [ ] `[P1]` 历史记录接口（`GET /attendance/history`，本人或项目范围）
  > 检查: AttendanceController.java — 搜索 `/history` 路由，确认本人查询自己，项目经理可按项目筛选

- [ ] `[P1]` 考勤计量单位配置（`GET/POST /config/attendance-unit`，选项：小时/半天/天，影响请假和加班精度）
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/` — 搜索 `attendance-unit` 路由，确认 GET 读取、POST 更新，取值限于 HOUR/HALF_DAY/DAY

- [ ] `[P2]` 加班代录接口（`project_manager`/`ceo` 代他人提交，含 `proxyEmployee` 字段）
  > 检查: AttendanceController.java `POST /attendance/overtime` — 确认 requestBody 含 `proxyEmployeeId` 字段，且权限校验限于 project_manager / ceo

### 前端任务

- [ ] `[P0]` 考勤页接入真实接口（提交请假/加班、获取历史记录）
  > 检查: `app/frontend/src/pages/attendance/index.vue` — 确认 onMounted 调用 `GET /attendance/history`，提交按钮调用对应 POST 接口

- [ ] `[P1]` 待办中心页（`pages/todo/`，聚合所有待我审批，按类型/状态/项目筛选）
  > 检查: `app/frontend/src/pages/todo/` — 确认目录存在，调用 `GET /forms/todo`，支持筛选条件传参

- [ ] `[P1]` 审批通过/驳回对接（含驳回原因输入）
  > 检查: pages/todo/ 相关组件 — 搜索 `POST /forms/{id}/approve` 和 `POST /forms/{id}/reject` 调用；驳回时弹出原因输入框

- [ ] `[P2]` 新建 `components/customized/ApprovalTimeline.vue` — 审批历史时间轴组件
  > 检查: `app/frontend/src/components/customized/ApprovalTimeline.vue` — 文件存在，接受 steps 数组 prop，每步包含操作人/时间/结果

- [ ] `[P2]` 审批详情页使用 `ApprovalTimeline` 展示历史流转
  > 检查: 审批详情页 — 搜索 `<ApprovalTimeline` 或 `ApprovalTimeline` 引用

- [ ] `[P2]` 驳回后可查看驳回原因，支持重新发起
  > 检查: attendance/index.vue 或 todo 页面 — 确认驳回单据卡片展示 rejectReason 字段，并有"重新发起"按钮跳转新建页

---

## Phase 5 — 施工专属功能

**目标：** 劳工可提交施工日志和工伤补偿，工伤动态路由（skipCondition）正确生效，施工日志作为独立系统运行。

### 检查点（全部通过才进入 Phase 6）

- [ ] 劳工可提交施工日志（含 workItems 动态列表），项目经理可审批，无 CEO 终审
- [ ] CEO 可对已归档施工日志发起追溯驳回，状态变为 RECALLED，劳工收到通知
- [ ] 劳工发起工伤补偿 → 节点1: 同项目项目经理 → 节点2: CEO（表单无金额字段）
- [ ] 项目经理代录工伤补偿 → 直接跳过节点1进入 CEO 终审
- [ ] 其他员工代录工伤补偿 → 路由同 finance 代录
- [ ] 工伤归档后生成待理赔记录，财务可在任意时间录入理赔金额并关联至指定薪资周期

### 后端任务

- [ ] `[P0]` 系统启动时写入 INJURY、CONSTRUCTION_LOG 默认审批流配置（含 `skipCondition`）
  > 检查: `app/backend/src/main/resources/db/data.sql` — 搜索 `INSERT INTO approval_flow_def` 含 INJURY（2节点，skipCondition 字段有值）和 CONSTRUCTION_LOG（1节点）记录

- [ ] `[P1]` 施工日志提交接口（`POST /construction-logs`，含 `workItems` JSON 数组字段）
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/WorkLogController.java` — 确认 POST 方法存在，requestBody 支持 workItems（List）字段

- [ ] `[P1]` 施工日志 CEO 追溯驳回接口（`POST /construction-logs/{id}/recall`，状态变为 RECALLED）
  > 检查: WorkLogController.java — 搜索 `/recall` 路由，确认调用后 DB 中对应记录 status 变为 RECALLED，写入 operation_log

- [ ] `[P1]` 工伤补偿申请接口（`POST /forms/injury`，不含 `injuryType` 和 `compensationAmount`）
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/` — 搜索 `/forms/injury` POST，确认 requestBody 不含金额字段；可含 proxyEmployeeId 字段

- [ ] `[P1]` 工伤理赔录入接口（`POST /injury-claims`，finance 专用，关联 `formRecordId` + `payrollCycleId` + `amount`）
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/` — 搜索 `/injury-claims` POST，确认含 formRecordId / payrollCycleId / amount 字段，且权限校验为 finance

- [ ] `[P1]` 附件上传接口（`POST /attachments/upload`）+ 本地文件系统存储（路径规范见 ARCHITECTURE §9.1）
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/` — 搜索 `/attachments/upload`，确认上传成功后返回 attachmentId 和文件路径

- [ ] `[P1]` 附件下载接口（`GET /attachments/{id}`，鉴权后返回文件流）
  > 检查: 同上 Controller — 搜索 `GET /attachments/{id}`，确认有 JWT 鉴权，返回 ResponseEntity<Resource>

### 前端任务

- [ ] `[P0]` 新建 `components/cross-platform/FileUpload/` — 附件上传组件（封装 uni 上传 API，支持预览和删除）
  > 检查: `app/frontend/src/components/cross-platform/FileUpload/index.vue` — 文件存在，接受 maxCount / accept props，触发 change 事件返回已上传附件列表

- [ ] `[P1]` 施工日志填报页（`pages/construction-log/`，劳工专用）
  - `workItems` 动态列表：每行 [目标名称 + 数量 + 单位]，支持增删行
  - 补充说明文本框（可选）
  - 系统提交后渲染表格 + 自动生成文字摘要
  - 图片附件上传（多张）
  > 检查: `app/frontend/src/pages/construction-log/index.vue` — 确认存在 workItems 数组和动态增删行逻辑；提交时 POST /construction-logs 携带 workItems JSON

- [ ] `[P1]` 工伤补偿申请页（`pages/injury/`，劳工专用，任何员工可代录入，见 COMPONENT_LAYOUT §1.6）
  > 检查: `app/frontend/src/pages/injury/index.vue` — 确认无金额字段；含 proxyEmployeeId 输入（代录时可见）；调用 POST /forms/injury

- [ ] `[P1]` 工伤理赔录入入口（finance 视图，归档后可见"录入理赔金额"按钮，选择关联薪资周期）
  > 检查: `app/frontend/src/pages/payroll/index.vue` 或 injury 相关页面 — 搜索 "录入理赔" 或 `POST /injury-claims` 调用，确认仅 finance 角色可见

- [ ] `[P2]` 新建 `components/cross-platform/Steps/` — 审批流步骤条（MP 端无 AntD Steps，需自实现）
  > 检查: `app/frontend/src/components/cross-platform/Steps/index.vue` — 文件存在，接受 steps 数组和 current 索引，在微信开发者工具中渲染正常

---

## Phase 6 — 薪资体系

**目标：** 财务可完成结算发布，员工可手写签名确认工资条，更正流程完整。

### 检查点（全部通过才进入 Phase 7）

- [ ] 财务执行预结算，**4 项**校验（无施工日志项）可查看通过状态
- [ ] 预结算例外申请可发起并经 CEO 审批，豁免记录写入审计日志
- [ ] 财务执行正式结算，周期锁定，员工端工资条状态变为"待确认"
- [ ] 员工完成电子签名绑定（手写 + PIN 码），可确认工资条
- [ ] 工资条确认后生成存证 PDF，包含签名、意图声明、时间戳水印
- [ ] 财务可对已归档工伤记录录入理赔金额并关联薪资周期
- [ ] 财务可发起更正，CEO 审批解锁后重新结算，历史版本保留

### 后端任务

- [ ] `[P0]` 将 `OaDataService` 薪资内存逻辑迁移到真实 Service + Mapper
  > 检查: OaDataService.java — 确认薪资相关方法已删除；`PayrollSlip` / `PayrollCycle` 实体通过真实 Mapper 写入 DB

- [ ] `[P0]` 预结算校验（4项）+ 算薪引擎（按规则生成 `PayrollSlip` + `PayrollItem` 明细）
  > 检查: `app/backend/src/main/java/com/oa/backend/service/` — 确认 PayrollService.java 存在，含 preSettle() 方法，内部逐一检查考勤完整性/审批完整性/工伤完整性/档案完整性；算薪逻辑含加班补贴、请假扣款、社保计算

- [ ] `[P0]` 正式结算、锁定周期、工资条发布
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/PayrollController.java` — 搜索 `/cycles/{id}/settle` POST，确认执行后 `payroll_cycle.locked = true`，生成 payroll_slip 记录

- [ ] `[P1]` 预结算例外申请（finance 提交例外原因 → CEO 审批 → 校验项 2/3 标记 EXCEPTED，写入 operation_log）
  > 检查: PayrollController.java — 搜索 `/cycles/{id}/pre-settle/exception` 或类似路由；PayrollService — 搜索 EXCEPTED 状态标记逻辑；operation_log 写入确认

- [ ] `[P1]` 薪资档位 CRUD（`SalaryGrade`：档位编码、名称、月基本工资，sysadmin 初始化时批量配置）
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/` — 搜索 `/salary-grades` 路由，确认 GET/POST/PUT/DELETE 均存在，entity SalaryGrade 含 gradeCode / gradeName / baseSalary 字段

- [ ] `[P1]` 结算周期全量配置（起始日、结束日、发薪日、结算截止日、结算提醒前置天数）
  > 检查: PayrollController.java — 搜索周期配置更新接口，requestBody 含 cycleType / startDay / endDay / payDay / settlementDeadline / reminderDaysBefore 字段

- [ ] `[P1]` 社保模式配置（公司代缴 vs 并入工资，支持分项比例或总额百分比两种计算方式）
  > 检查: `app/backend/src/main/java/com/oa/backend/service/PayrollService.java` — 搜索 `COMPANY_PAID` / `MERGED_SALARY` 枚举或字符串常量，确认两种模式走不同计算分支

- [ ] `[P1]` 薪资规则配置 CRUD（加班倍率、请假扣款公式、公积金比例、个税参数）
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/` — 搜索薪资规则配置接口（如 `/payroll/rules`），含 overtimeRateWeekend / housingFundRate 等字段

- [ ] `[P1]` 考勤管理：手工录入/批量导入（CSV）、异常标记、异常列表查询
  > 检查: AttendanceController.java — 搜索手工录入接口（`POST /attendance/records`）和导入接口（`POST /attendance/import`）；确认有异常标记字段（如 `hasAnomaly`）

- [ ] `[P1]` 电子签名 Service（见 ARCHITECTURE §12）：
  - 签名加密存档 + `EmployeeSignature` 入库
  - PIN 码 bcrypt 哈希存储
  - 工资单内容 SHA-256 哈希
  - 签署 PDF 生成（明细 + 签名叠加 + 时间戳水印）
  - `PayrollConfirmation` 完整证据链写入
  - `SignatureProvider` 接口抽象，当前实现 `LocalSignatureProvider`
  > 检查: `app/backend/src/main/java/com/oa/backend/service/` — 确认 SignatureProvider.java（接口）和 LocalSignatureProvider.java 存在；搜索 SHA256 / bcrypt / iTextPDF（或其他 PDF 库）引用；employee_signature 表有数据写入

- [ ] `[P2]` 工资异议审批流 + 更正解锁重算（新版本 `version` 递增，历史版本保留）
  > 检查: PayrollController.java — 搜索 `/correction` 或 `/unlock` 路由；PayrollSlip entity — 确认有 version 字段；重算后旧版本 status 标记 SUPERSEDED

- [ ] `[P2]` 工资异议接口（`POST /payroll/slips/{id}/dispute`）
  > 检查: PayrollController.java — 搜索 `/dispute` 路由，确认存在且调用方创建异议记录

### 前端任务

- [ ] `[P0]` 新建 `components/cross-platform/SignatureCanvas/` — 手写签名画板（双端兼容触控和鼠标，输出 base64）
  > 检查: `app/frontend/src/components/cross-platform/SignatureCanvas/index.vue` — 文件存在；在 H5 用鼠标可绘制签名，clear() 和 getBase64() 方法可调用

- [ ] `[P1]` 薪资页接入真实接口（`GET /payroll/cycles`、`GET /payroll/slips`）
  > 检查: `app/frontend/src/pages/payroll/index.vue` — 确认 onMounted 调用真实接口，无 hardcoded mock 数据

- [ ] `[P1]` 预结算发起页：展示 **4 项**校验清单，问题项可跳转处理；支持提交例外申请（CEO 审批豁免）
  > 检查: pages/payroll/ 预结算相关页面 — 确认展示4个校验项状态；有"提交例外申请"入口，调用例外申请接口

- [ ] `[P1]` 工资条详情页：工资项明细展示（社保按配置模式展示"扣款"或"补贴"）
  > 检查: pages/payroll/ 详情页 — 确认社保字段根据模式显示不同标签（公司代缴: "社保扣款（个人）"；并入工资: "五险一金补贴（合计）"）

- [ ] `[P1]` 电子签名流程：
  - 首次签名引导：实名确认 → `SignatureCanvas` 手写 → 预览 → 绑定（`POST /signature/bind`）
  - 设置 PIN 码（`POST /signature/set-pin`，4-6 位数字）
  - 工资确认弹窗：签名预览 + 意图声明文本 + PIN 码输入 → 提交（`POST /payroll/slips/{id}/confirm`）
  > 检查: pages/payroll/ 签名相关页面 — 搜索 SignatureCanvas 引用、/signature/bind 和 /signature/set-pin 调用；工资确认弹窗含意图声明文本（如"本人已阅读并确认以上工资明细"）

- [ ] `[P2]` CEO 薪资审批视图（单独视图，见 COMPONENT_LAYOUT §3.1）
  > 检查: pages/payroll/ 或 pages/index/ — 搜索 CEO 角色条件渲染，确认展示更正审批入口

- [ ] `[P2]` 工资异议发起（`POST /payroll/slips/{id}/dispute`）
  > 检查: pages/payroll/ 详情页 — 搜索 /dispute 调用，确认有异议原因输入框

- [ ] `[P2]` 更正历史版本查看
  > 检查: pages/payroll/ 详情页 — 搜索版本号展示（如 v1, v2）和历史版本列表入口

---

## Phase 7 — 工作台 + 通知系统

**目标：** 工作台数据真实，待办角标实时，通知中心可用。

### 检查点（全部通过才进入 Phase 8）

- [ ] 工作台摘要数据（待办数/薪资状态/项目数）来自真实接口
- [ ] 审批节点变更后，相关人员待办角标实时更新
- [ ] 工资条发布后，员工收到通知
- [ ] `usePageConfig` composable 可正确拉取页面配置

### 后端任务

- [ ] `[P0]` `GET /workbench/summary` 按角色返回摘要数据（待办数/薪资状态/项目数/到期提醒数）
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/WorkbenchController.java` — 确认 GET /workbench/summary 存在，按 JWT roleCode 区分返回字段

- [ ] `[P1]` `GET /page-config/{routeCode}` 按 `X-Client-Type` 和角色返回页面字段/布局/按钮配置
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/` — 搜索 `/page-config/{routeCode}` 路由，确认读取 X-Client-Type 请求头

- [ ] `[P1]` 通知触发：审批节点变更、工资条发布、到期提醒 → 写入 `notification` 表
  > 检查: `app/backend/src/main/java/com/oa/backend/service/` — 搜索 NotificationService 或 notification 写入调用，确认在审批 service 和 payroll settle 方法中均有调用

- [ ] `[P1]` `GET /notifications`、`POST /notifications/{id}/read`
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/NotificationController.java` — 确认 GET 列表和 POST 已读两个方法存在

### 前端任务

- [ ] `[P0]` 工作台接入聚合摘要接口替换 mock 统计数据
  > 检查: `app/frontend/src/pages/index/workbench-data.ts` — 确认 fetchSummary 函数调用 GET /workbench/summary，无 hardcoded 数字

- [ ] `[P1]` 待办数量接入真实接口，徽标实时更新
  > 检查: `app/frontend/src/stores/user.ts` 或 layout 组件 — 搜索 todoCount / badgeCount，确认从 GET /workbench/summary 读取并响应式更新

- [ ] `[P1]` 通知列表进入通知中心页面后懒加载（`GET /notifications`）
  > 检查: `app/frontend/src/pages/` — 搜索 notifications 目录或通知中心页面，确认滚动到底部触发下一页加载

- [ ] `[P1]` 实现 `usePageConfig(routeCode)` composable，进入页面时拉取页面配置并 session 内缓存
  > 检查: `app/frontend/src/composables/` — 确认 usePageConfig.ts 存在，包含缓存逻辑（如 sessionStorage 或 Map 缓存）

---

## Phase 8 — 数据管理

**目标：** 数据保留策略生效（默认1年，全部类型统一），到期前30天提醒CEO，清理/导出流程完整。

### 检查点（全部通过才进入 Phase 9）

- [ ] 所有数据类型默认保留期均为1年，sysadmin 初始化时写入
- [ ] 模拟数据到期前 30 天，CEO 收到通知
- [ ] CEO 可选择"导出后删除"或"忽略"（无延期选项，延期为后续收费功能）
- [ ] 导出任务完成后可下载，链接 72 小时有效
- [ ] 操作日志不受保留策略影响，写入 `operation_log` 后永久保存

### 后端任务

- [ ] `[P1]` 将 `RetentionController`/`BackupController`/`CleanupController` 内存逻辑迁移到真实 Service
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/RetentionController.java` — 确认调用真实 RetentionService（有对应 Mapper），无内存 List/Map

- [ ] `[P1]` sysadmin 初始化时写入默认保留策略（所有类型默认 1 年）
  > 检查: `app/backend/src/main/resources/db/data.sql` — 搜索 `INSERT INTO retention_policy`，确认每种数据类型（请假/加班/工伤/施工日志/工资条/签名档案/审批历史）均有 1 年默认值

- [ ] `[P1]` 到期提醒定时任务（每日扫描，提前 30 天生成 `RetentionReminder`，写通知）
  > 检查: `app/backend/src/main/java/com/oa/backend/service/` — 搜索含 `@Scheduled` 注解的方法，确认执行时计算 `expiryDate - 30 days <= today` 条件并写入 retention_reminder

- [ ] `[P1]` 异步导出任务：按周期/项目/类型分包 → 压缩 → 生成下载链接（72 小时有效）
  > 检查: `app/backend/src/main/java/com/oa/backend/service/` — 搜索 ExportService 或 BackupService，确认含异步执行（@Async）+ 生成带过期时间的下载 token

- [ ] `[P1]` 数据清理定时任务：先删物理文件 → 再删 DB 记录 → 失败进重试队列
  > 检查: `app/backend/src/main/java/com/oa/backend/service/` — 搜索 CleanupService，确认先处理 AttachmentMeta 物理文件，再删 DB；有 cleanup_task 表记录重试状态

- [ ] `[P1]` `operation_log` 写入 API（由审批引擎调用，不经 retention 策略删除）
  > 检查: `app/backend/src/main/java/com/oa/backend/service/` — 确认 OperationLogService.java 存在；retention_policy 表中 operation_log 类型的 retentionDays = -1（或标记为 PERMANENT）

- [ ] `[P2]` AOP 拦截薪资结算、更正、权限变更、签名绑定 → 写入 `operation_log`
  > 检查: `app/backend/src/main/java/com/oa/backend/` — 搜索 `@Aspect` 类，确认切点覆盖 settle / correction / roleUpdate / signatureBind 方法

- [ ] `[P3]` 延期接口预留（接口骨架，UI 隐藏，后续收费功能）
  > 检查: RetentionController.java — 搜索 `/retention/extend` 路由，确认返回 HTTP 501 Not Implemented

### 前端任务

- [ ] `[P1]` 数据有效期配置页（CEO 可见，展示各类型当前保留期）
  > 检查: `app/frontend/src/pages/` — 搜索 retention 目录，确认调用 GET /retention/policies，列出各数据类型名称和保留天数

- [ ] `[P1]` 到期提醒列表（`GET /retention/reminders`），支持"导出后删除"和"忽略"两个操作
  > 检查: retention 相关页面 — 搜索 /reminders 调用；操作按钮触发 `POST /retention/reminders/{id}/export-delete` 或 `POST /retention/reminders/{id}/ignore`

- [ ] `[P2]` 导出任务列表，展示进度和下载链接
  > 检查: retention 相关页面 — 搜索 export_backup_task 轮询逻辑（如每5秒拉取任务状态），完成后展示下载链接

---

## Phase 9 — 测试 + 上线准备

**目标：** 核心链路自动化测试覆盖，可稳定部署到生产环境。

### 检查点（全部通过即可上线）

- [ ] 后端 Service 层单元测试覆盖率 ≥ 80%（算薪引擎、审批流、签名存证核心路径 100%）
- [ ] 前端核心组件单元测试通过
- [ ] 联调冒烟测试通过（登录→提交单据→审批→工资确认完整链路）
- [ ] PostgreSQL 生产数据库 schema 迁移脚本就绪
- [ ] 应用可以 Docker 容器启动

### 测试任务

- [ ] `[P0]` 后端 Service 层单元测试（算薪引擎、审批流引擎、签名存证）— 见 TEST_DESIGN §2.1
  > 检查: `app/backend/src/test/java/` — 确认 PayrollServiceTest / ApprovalFlowServiceTest / SignatureServiceTest 存在；运行 `mvn test` 覆盖率报告 ≥ 80%

- [ ] `[P0]` 后端权限隔离测试（角色 vs 接口访问控制）— 见 TEST_DESIGN §3.1
  > 检查: `app/backend/src/test/java/` — 搜索 `@WithMockUser` 测试类，确认 employee 访问财务接口返回 403、worker 访问施工日志接口返回 200

- [ ] `[P1]` 联调冒烟测试（登录→提交单据→审批→工资确认完整链路）— 见 TEST_DESIGN §4
  > 检查: 手动执行 TEST_DESIGN §4.2~4.6 中各角色流程，记录每步截图；或编写 API 脚本自动化执行（`app/tests/`）

- [ ] `[P1]` 前端单元测试框架搭建（Vitest + Vue Test Utils）
  > 检查: `app/frontend/` — 确认 vitest.config.ts 存在，`npm run test:web` 可执行并输出测试结果

- [ ] `[P2]` `useComponent` composable 单元测试
  > 检查: `app/frontend/src/composables/` — 搜索 useComponent.spec.ts，测试 H5/MP 平台切换场景

- [ ] `[P2]` 适配层 `resolver.ts` 单元测试（平台切换、组件缺失降级）
  > 检查: `app/frontend/src/adapters/` — 搜索 resolver.spec.ts，确认组件缺失时返回降级组件而非 throw

### 部署任务

- [ ] `[P1]` PostgreSQL 生产 schema 迁移脚本（Flyway 或手写 SQL）
  > 检查: `app/backend/src/main/resources/db/` — 确认存在 migration/ 目录（Flyway）或 schema-pg.sql；内容与 H2 schema.sql 等价（语法适配 PostgreSQL）

- [ ] `[P1]` `application-prod.yml` 配置（PostgreSQL、文件存储路径、JWT 密钥外置）
  > 检查: `app/backend/src/main/resources/application-prod.yml` — 确认 spring.datasource 指向 PostgreSQL、JWT 密钥使用环境变量（${JWT_SECRET}）而非硬编码

- [ ] `[P2]` Dockerfile（前后端分离，Nginx + Spring Boot 各一个容器）
  > 检查: 项目根目录 — 确认 Dockerfile（后端）和 Dockerfile.frontend（或 frontend/Dockerfile）存在，`docker build` 可成功

- [ ] `[P2]` 健康检查接口（`GET /actuator/health`）
  > 检查: `app/backend/src/main/resources/application.yml` — 搜索 `management.endpoints.web.exposure.include`，确认含 health；启动后 GET /actuator/health 返回 `{"status":"UP"}`

---

## P3 低优先级（延后迭代）

> 以下功能在核心业务验证通过后再启动，不影响 MVP。

### 缓存层

- [ ] `[P3]` `GET /workbench/summary` 加 60 秒服务端缓存（当前每次直接查询 DB，性能足够时无需优先）
  > 检查: WorkbenchController.java 或 WorkbenchService — 搜索 `@Cacheable` 注解或 Redis 调用

### 企业微信接入（待账号信息就绪）

- [ ] `[P3]` 后端 `WeworkService` 接口替换为真实实现（当前为 mock 空实现）
  > 检查: `app/backend/src/main/java/com/oa/backend/service/` — 确认 WeworkService.java 已有真实 HTTP 调用逻辑，无 TODO/mock 注释

- [ ] `[P3]` 企业微信 OAuth 登录（`/auth/wework`）
  > 检查: AuthController.java — 搜索 `/auth/wework`，确认不再返回 501，可通过企业微信 code 换取用户信息

- [ ] `[P3]` 通讯录批量导入接入企业微信 API
  > 检查: `app/backend/src/main/java/com/oa/backend/controller/DirectoryImportController.java` — 确认 import/preview 逻辑从企业微信 API 拉取数据

- [ ] `[P3]` 应用消息推送（审批通知、工资条发布、到期提醒）
  > 检查: `app/backend/src/main/java/com/oa/backend/service/` — 搜索企业微信消息推送调用（WxCpService 或类似）

- [ ] `[P3]` 小程序端编译验证（`yarn dev:mp-weixin`）
  > 检查: `app/frontend/` — 运行 `npm run dev:mp-weixin`，微信开发者工具可正常预览，无编译报错

- [ ] `[P3]` 所有页面适配小程序竖屏布局（卡片化、底部操作区固定）
  > 检查: `app/frontend/src/pages/` — 各页面在微信开发者工具 375px 模拟器中无溢出、无重叠；操作按钮区域固定底部

- [ ] `[P3]` 审批详情支持折叠分段
  > 检查: 审批详情页 — 搜索折叠/展开逻辑（如 `isExpanded` 状态），点击可折叠长内容区域

- [ ] `[P3]` `SignatureCanvas` 在小程序触控环境验证可用
  > 检查: `app/frontend/src/components/cross-platform/SignatureCanvas/index.vue` — 在微信开发者工具触控模式下可绘制签名；`getBase64()` 返回非空字符串

### e签宝接入（待合同签订）

- [ ] `[P3]` 实现 `EsignSignatureProvider`（`SignatureProvider` 接口的第三方实现，替换 `LocalSignatureProvider`）
  > 检查: `app/backend/src/main/java/com/oa/backend/service/` — 确认 EsignSignatureProvider.java 实现 SignatureProvider 接口；配置开关（如 `signature.provider=esign`）可切换实现

---

## 变更记录

| 日期        | 内容                                                                                                                                           |
|-----------|------------------------------------------------------------------------------------------------------------------------------------------------|
| 2026-04-02 | 补充预结算例外申请任务（Phase 6），为全部任务添加逐项检查点（文件路径 + 验证内容）；社保并入工资模式明确为五险一金合计补贴 + 灵活就业说明 |
| 2026-04-02 | 更新多项业务规格：施工日志独立系统+workItems快捷录入+CEO追溯驳回；工伤表单去掉金额字段，finance事后录入理赔；薪资档位批量配置；社保模式可配置；数据保留全部默认1年；操作日志永久保留；预结算校验降为4项 |
| 2026-04-02 | 全量重写为阶段化 0→1 开发路线图：Phase 0-9 + P3 低优先级区块，含里程碑总览、检查点、优先级标注 [P0-P3]；确认关键架构决策（skipCondition、数据保留10年起步、缓存延后、e签宝延后） |
| 2026-04-01 | 基于前端代码审计全量重写 TODO：按业务模块组织，补充前端工程基础缺口                                                                                   |
| 2026-04-01 | 补充架构决策：可配置审批流、电子签名、设备类型协议、工作台混合加载、文件存储规范                                                                          |
| 2026-03-31 | 工程稳定性修复、门户工作台基线、后端 API 骨架、权限矩阵                                                                                              |
