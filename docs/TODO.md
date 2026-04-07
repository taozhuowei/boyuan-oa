# 博渊 OA 平台 — 开发路线图

> **唯一进度管理入口。** 完成一项立即打勾并提交。
>
> 优先级说明：`[P0]` 当前模块阻塞项 / `[P1]` 本模块核心功能 / `[P2]` 本模块完整性补充 / `[P3]` 低优先级，延后迭代
>
> 状态说明：`[ ]` 未开始 / `[-]` 进行中 / `[x]` 已完成
>
> 架构决策见 `architecture.md`，测试用例见 `test_design.md`。

---

## 实现原则

- **模块顺序集成**：按依赖关系逐模块实现，每个模块的前后端任务一起完成，验收通过后再进入下一模块。
- **模块解耦约束**：模块间通信通过 `ApplicationEvent`，不允许跨模块直接注入 `Service`（见 `architecture.md §12`）。
- **可差分部署**：每个可选模块使用 `@ConditionalOnProperty` 守门，关闭后系统正常运行。

---

## 模块总览

| 模块                    | 状态      | 依赖                   | 验收标准                                   |
|------------------------|---------|----------------------|--------------------------------------------|
| **M0 基础设施**         | ✅ 已完成 | —                    | DB 建好，前后端可独立启动                  |
| **M1 身份 & 认证**      | ✅ 已完成 | M0                   | 真实账号登录，JWT 正常                     |
| **M2 组织管理**         | ✅ 已完成 | M1                   | 员工、部门、项目基础 CRUD 可用             |
| **M3 审批流引擎**       | 进行中   | M2                   | 引擎独立可测，skipCondition 生效           |
| **M4 考勤模块**         | 进行中   | M3                   | 请假/加班完整走审批流；前端接入真实接口    |
| **M5 薪资模块**         | 未开始   | M4                   | 结算+签名确认+存证 PDF 完整               |
| **M6 项目管理模块**     | 进行中   | M2                   | 里程碑、进度、Dashboard 可用              |
| **M7 报销模块**         | 预留     | M5                   | 预留骨架，功能暂不实现                    |
| **M8 施工 & 工伤模块**  | 未开始   | M3, M5               | 劳工日志+工伤跑通，动态路由生效            |
| **M9 通知 & 工作台**    | 未开始   | M3–M8                | 工作台数据真实，通知实时触发               |
| **M10 数据生命周期模块**| 未开始   | M5, M9               | 保留策略生效，清理/导出完整               |
| **M11 测试 & 上线**     | 未开始   | M0–M10               | 覆盖率达标，可部署到生产                   |
| **M12 初始化向导**      | 未开始   | M0–M10（低优先级）   | 向导走通，入口锁定                         |

> **模块优先级说明（2026-04-07 调整）**：考勤和薪资优先于其他业务模块；项目管理次之；报销预留骨架待后续实现；施工&工伤优先级低于薪资，最后实现。

---

## 已完成模块

### M0 — 基础设施（✅ 已完成）

前端基础（HTTP 层、组件注册）、前端壳（5账号可点通所有页面）、后端基础（35张表建好，5账号可登录）。

### M1 — 身份 & 认证（✅ 已完成）

JWT 认证、员工/角色 CRUD、组织架构树、忘记密码、修改手机号、岗位管理（含薪资/假期/社保配置）。

#### ⚠️ 浏览器验收待补（2026-04-04 测试脚本登录按钮选择器有误）

- [ ] TC-01: 错误密码有报错提示，正确登录跳转工作台
- [ ] TC-03: CEO 新建员工后员工出现在列表中
- [ ] TC-07: 财务账号无「组织架构」「角色管理」菜单；直接访问 `/pages/role/index` 被拦截
- [ ] TC-09: 忘记密码完整 4 步流程（手机号→验证码→新密码→成功跳转）

### M2 — 组织管理（✅ 已完成）

部门树、项目 CRUD（含成员管理/多 PM）、施工日志填写页入口（前端壳）。

**实际代码验证（2026-04-07）**：
- ProjectController.java：✅ 真实实现（使用 ProjectService）
- projects/index.vue：✅ 真实调用 GET /projects API
- 项目 CRUD、成员管理接口：✅ 全部存在

#### ⚠️ 浏览器验收待补

- [ ] TC-04: CEO 进入项目详情，成员列表展示，添加/移除成员正常
- [ ] TC-05: 组织架构页部门树展示5个种子部门，CEO 可新建部门
- [ ] TC-08: PM 账号只看到本人作为 PM 的项目，无「新建项目」按钮

---

## M3 — 审批流引擎

> **依赖：** M2（员工/岗位/角色体系）
>
> **模块职责：** 核心引擎，不含任何业务 UI，仅提供后端引擎能力和配置接口。M4–M8 均依赖此模块。
>
> **可关闭：** 否（核心模块，始终加载）

**实际代码验证（2026-04-07）**：
- ApprovalFlowService.java：✅ 真实实现（使用 FormRecordMapper/ApprovalFlowDefMapper/ApprovalFlowNodeMapper/ApprovalRecordMapper/EmployeeMapper）
- FormService.java：✅ 真实实现（submitForm() 写 DB，getHistory() 查 DB）
- approval_flow_def 种子数据：✅ data.sql 含 LEAVE/OVERTIME 两条记录
- TraceIdFilter.java：❌ filter/ 目录不存在
- OperationLogAspect.java：❌ aspect/ 目录不存在

### 检查点（全部通过才进入 M4）

- [ ] `ApprovalFlowService.advance()` 推进节点：通过→APPROVED；驳回→REJECTED
- [ ] `skipCondition` 评估：提交人角色匹配时节点标记 SKIPPED 并推进到下一节点
- [ ] 无直系领导时，节点1自动兜底给 CEO（DIRECT_SUPERVISOR 模式）
- [ ] TraceIdFilter 生效（每请求含 X-Trace-Id 响应头）
- [ ] 引擎单元测试全部通过（见 TEST_DESIGN §2.1 ApprovalFlowServiceTest）

### 后端任务

- [x] `[P0]` 写入 LEAVE、OVERTIME 默认两级审批流配置（系统启动时）
  > 验证：`data.sql` 含 `MERGE INTO approval_flow_def` 的 LEAVE 和 OVERTIME 两条记录 ✅

- [x] `[P0]` ApprovalFlowService：`advance()` 核心方法，含状态流转和 CEO 兜底
  > 验证：`ApprovalFlowService.java` 含 advance()/initFlow()/getTodo()/resolveApproverId()，Mapper 真实调用 ✅

- [x] `[P1]` 请假/加班提交接口（`POST /attendance/leave`、`POST /attendance/overtime`）
  > 验证：`AttendanceController.java` 含两个 POST 方法，调用 `formService.submitForm()` ✅

- [x] `[P1]` 待办列表接口（`GET /attendance/todo`，按角色过滤）
  > 验证：`AttendanceController.java` 含 `GET /attendance/todo`，调用 `approvalFlowService.getTodo()` ✅

- [x] `[P1]` 审批操作接口（`POST /attendance/{id}/approve`、`POST /attendance/{id}/reject`）
  > 验证：`AttendanceController.java` 含两个方法，调用 `approvalFlowService.advance()` ✅

- [x] `[P0]` `TraceIdFilter`：每个 HTTP 请求生成 UUID trace_id，写入 MDC，响应头携带 `X-Trace-Id`（见 ARCHITECTURE §13.3）
  > 验证：`filter/TraceIdFilter.java` 存在，`MDC.put("trace_id",...)` 生效，`curl /api/health` 响应含 `X-Trace-Id` ✅

- [x] `[P1]` `OperationLogAspect`：`@OperationLogRecord` 注解驱动，自动拦截关键操作写日志（见 ARCHITECTURE §13.5）
  > 验证：`aspect/OperationLogAspect.java` + `annotation/OperationLogRecord.java` 已创建，`@Around("@annotation(logRecord)")` 切点，pom.xml 已添加 spring-boot-starter-aop ✅

- [x] `[P1]` 将 `OaDataService` 表单/审批内存逻辑迁移到真实 Service + Mapper
  > 验证：`WorkLogController.java` 重写，使用 `FormService.submitForm("LOG"/"INJURY")` + `ApprovalFlowService`；data.sql 新增 LOG/INJURY 审批流定义；`GET /logs/records` 返回 200 ✅

- [x] `[P1]` 审批流定义 CRUD 接口（`GET/PUT /approval/flows/{type}`）
  > 验证：`ApprovalFlowController.java` — GET 列表、GET /{businessType}、PUT /{businessType} 三个接口，CEO only，curl 验证 GET /api/approval/flows 返回 4 条流定义 ✅

### 前端任务

- [x] `[P1]` 待办中心页（`pages/todo/`）：聚合所有待我审批，按类型/状态筛选
  > 验证：`app/h5/pages/todo/index.vue` — 调用 `GET /attendance/todo`，Tab 筛选（全部/考勤/报销），浏览器自动化 16/16 通过 ✅

- [x] `[P1]` 审批通过/驳回操作（含驳回原因输入）
  > 验证：`pages/todo/index.vue` — 含 approve/reject 弹窗，意见输入框，调用 POST 接口 ✅

- [x] `[P1]` `components/customized/ApprovalTimeline.vue` — 审批历史时间轴组件
  > 验证：`components/customized/ApprovalTimeline.vue` — 接受 `steps: ApprovalStep[]` prop，每步含操作人/时间/操作类型/备注；Nuxt auto-import 为 `CustomizedApprovalTimeline`；`todo/index.vue` 弹窗中集成，a-empty 用于历史为空状态 ✅

---

## M4 — 考勤模块

> **依赖：** M3（审批流引擎）
>
> **模块职责：** 请假申请、加班通知、自补加班申请，以及审批流驱动的状态流转。
>
> **可关闭：** `modules.attendance = false`

**实际代码验证（2026-04-07）**：
- AttendanceController.java：✅ 真实实现（使用 FormService + ApprovalFlowService），基础接口已存在
- attendance/index.vue：❌ MOCK（硬编码数据，提交只显示 Toast，无真实接口调用）
- 高级功能（overtime-notifications, overtime-self-report, retroactive）：❌ 未实现

### 检查点（全部通过才进入 M5）

- [x] 员工提交请假单，状态 PENDING；PM 初审→APPROVING；CEO 终审→APPROVED
- [ ] 驳回后申请人可重新发起（新单据，历史保留）（P2，延后迭代）
- [x] 无直系领导时，节点1自动转交 CEO（resolveDirectSupervisor CEO兜底逻辑存在；data.sql已配置直系领导关系）
- [x] PM 发起加班通知，员工可确认/拒绝；CEO 发起的加班通知直接归档
- [x] 员工发起自补加班申请，走双审流程（直系领导+CEO）

### 后端任务

- [x] `[P1]` 请假提交接口（`POST /attendance/leave`）已存在
  > 验证：`AttendanceController.java` 含此方法，调用 `formService.submitForm()` ✅

- [x] `[P1]` 加班提交接口（`POST /attendance/overtime`）已存在
  > 验证：`AttendanceController.java` 含此方法 ✅

- [x] `[P1]` 记录列表接口（`GET /attendance/records`）已存在
  > 验证：`AttendanceController.java` 含此方法，调用 `formService.getHistory()` ✅

- [x] `[P1]` 历史记录接口（`GET /attendance/history`，支持按项目/时间范围筛选）
  > 验证：`AttendanceController.java` 新增 GET /history，PM/CEO 角色可查看全部记录；curl 测试返回 200 ✅

- [x] `[P1]` 考勤计量单位配置（`GET/POST /config/attendance-unit`，HOUR/HALF_DAY/DAY）
  > 验证：`SystemConfigController.java` 新建，GET /config/attendance-unit 返回 {leaveUnit:'HOUR',overtimeUnit:'HOUR'}；POST 需 CEO 权限 ✅

- [x] `[P1]` 加班通知发起接口（`POST /overtime-notifications`）
  > 验证：`OvertimeNotificationController.java` 已创建；CEO 发起状态 ARCHIVED，PM 发起状态 NOTIFIED；curl 测试 POST 返回 200 ✅

- [x] `[P1]` 加班通知响应接口（`POST /overtime-notifications/{id}/respond`）
  > 验证：Controller `/respond` 路由存在；worker 确认通知返回 200，accepted=true；curl 验证 ✅

- [x] `[P1]` 自补加班申请接口（`POST /attendance/overtime-self-report`，走双审流程）
  > 验证：`AttendanceController.java` 新增 `overtime-self-report` 路由，调用 `formService.submitForm("OVERTIME",...)` ✅

- [ ] `[P2]` 追溯请假接口（`POST /attendance/leave/retroactive`，任意时刻补录）
  > 检查：`AttendanceController.java` — 搜索 `retroactive`

### 前端任务

- [x] `[P0]` 考勤页接入真实接口（提交请假、获取历史记录）
  > 验证：`app/h5/pages/attendance/index.vue` — onMounted 调用 `GET /attendance/records`；提交请假/加班调用 POST 接口；浏览器自动化 ✅

- [x] `[P1]` 加班通知列表（员工/劳工视图）：展示收到的通知，支持确认/拒绝
  > 验证：attendance/index.vue 加班通知 Tab — `GET /overtime-notifications`；确认/拒绝按钮；浏览器自动化 ✅

- [x] `[P1]` 加班通知管理页（PM/CEO 视图）：发起通知、查看响应情况
  > 验证：attendance/index.vue 新增"发起通知"+"已发起" tabs（仅 PM/CEO 可见）；POST /overtime-notifications；GET /overtime-notifications/initiated 响应列表可展开 ✅

- [x] `[P1]` 自补加班申请表单（调用 `POST /attendance/overtime-self-report`）
  > 验证：attendance/index.vue 新增"自补加班" tab；所有角色可见；提交后跳转我的记录 ✅

- [ ] `[P2]` 驳回后可查看驳回原因，支持重新发起
  > 检查：待办/考勤页 — 驳回单据卡片展示 rejectReason，有"重新发起"按钮

---

## M5 — 薪资模块

> **依赖：** M4（考勤数据）
>
> **模块职责：** 结算周期管理、工资单生成、电子签名存证、更正流程。
>
> **可关闭：** `modules.payroll = false`
>
> **监听的 ApplicationEvent：** `LeaveApprovedEvent`、`OvertimeRecordedEvent`、`InjuryClaimSettledEvent`（M8 完成后可接入）

**实际代码验证（2026-04-08）**：
- PayrollEngine.java：✅ createCycle/openWindow/@Scheduled自动关窗/precheck/settle 已实现
- PayrollController.java：✅ 所有端点接入 PayrollEngine，集成测试 80 项全通过
- payroll/index.vue：✅ 分角色视图，Finance/CEO 可创建周期/开窗/预检/结算，Employee 可查看/确认/异议
- M5 浏览器测试：✅ 14/14 通过（2026-04-08）

### 检查点（全部通过才进入 M6）

- [x] 窗口期到期后自动锁定（`@Scheduled(fixedDelay=3600000)` 扫描关闭，无手动关闭接口）
- [x] 财务发起结算，2 项强制检查（无 PUBLISHED + 无并发结算）通过后结算
- [ ] 员工端工资单"待确认"，完成电子签名绑定 + PIN 设置后可确认（P1，签名流程待实现）
- [ ] 工资条确认后生成存证 PDF（含签名、意图声明、时间戳水印）（P1）
- [ ] 财务发起更正，CEO 审批解锁，重算后 version 递增，历史版本保留（P2）

### 后端任务

- [x] `[P0]` PayrollEngine + PayrollController 接入真实 DB（Mapper 写入 H2）
- [x] `[P0]` openWindow / 自动关窗 @Scheduled / precheck(2项) / settle
- [x] `[P0]` 正式结算生成 payroll_slip + payroll_slip_item 记录

- [ ] `[P1]` 自定义费目 CRUD（`GET/POST/PUT/DELETE /payroll/item-defs`，含 itemType ENUM）
  > 检查：`PayrollController.java` — 搜索 `/item-defs` 路由

- [ ] `[P1]` 工资确认协议管理（`POST /salary-confirmation-agreement` 上传；`GET .../current` 读取）
  > 检查：`SalaryConfirmationAgreementController.java` — 上传接受 multipart/form-data；历史版本保留

- [ ] `[P1]` 电子签名 Service：签名加密存档 + PIN bcrypt + 内容 SHA-256 + PDF 生成 + 存证链写入
  > 检查：`SignatureProvider.java`（接口）+ `LocalSignatureProvider.java`（实现）；搜索 SHA256/bcrypt/PDF 引用

- [ ] `[P1]` 社保模式配置（COMPANY_PAID / MERGED 两种计算路径）
  > 检查：`PayrollService.java` — 搜索两种模式枚举，确认走不同计算分支

- [ ] `[P2]` 工资异议 + 更正解锁重算（version 递增，旧版本 SUPERSEDED）
  > 检查：`PayrollController.java` — `/dispute` 和 `/correction` 路由；PayrollSlip 含 version 字段

### 前端任务

- [ ] `[P0]` `components/cross-platform/SignatureCanvas/` — 手写签名画板（双端兼容）
  > 检查：`SignatureCanvas/index.vue` — H5 鼠标可绘制；clear() 和 getBase64() 可调用

- [x] `[P1]` 薪资页接入真实接口（分角色：Finance 周期管理/结算，Employee 查看/确认/异议）
  > 已实现：`pages/payroll/index.vue` — 真实 API 调用，无 mock

- [x] `[P1]` 预结算发起页：展示 2 项强制检查清单；全通过后"发起结算"按钮激活
  > 已实现于"结算操作"Tab，预检 → 结算按钮联动

- [ ] `[P1]` 电子签名流程：首次绑定引导 → `SignatureCanvas` → 设置 PIN → 工资确认弹窗（含意图声明 + PIN 输入）
  > 检查：payroll 签名相关页面 — 搜索 SignatureCanvas 引用、`/signature/bind` 和 `/signature/set-pin` 调用

- [x] `[P1]` 工资条详情页：工资项明细展示（name + amount 列表）
  > 已实现于详情 Modal，EARNING 正数 / DEDUCTION 红色

- [x] `[P2]` 工资异议发起（`POST /payroll/slips/{id}/dispute`）
  > 已实现于详情 Modal 异议按钮

---

## M6 — 项目管理模块

> **依赖：** M2（项目基础数据）
>
> **模块职责：** 里程碑管理、进度确认、施工日志汇总报告、项目 Dashboard。
>
> **可关闭：** `modules.project = false`（关闭时施工日志仍可填报，但 Dashboard 和里程碑不可用）

**实际代码验证（2026-04-07）**：
- ProjectController.java：✅ 真实实现（使用 ProjectService）
  - GET /projects（分页+角色过滤）✅
  - GET /projects/{id} ✅
  - POST/PUT/DELETE /projects ✅
  - PATCH /projects/{id}/status ✅
  - POST/DELETE /projects/{id}/members ✅
- projects/index.vue：✅ 真实调用 GET /projects API
- projects/detail.vue：✅ 存在
- 里程碑/进度/Dashboard/汇总报告接口：❌ 未实现

### 检查点（全部通过才进入 M7）

- [ ] PM 可管理里程碑（CRUD），可标记完成，进度记录保留历史
- [ ] 所有日志审批完成后，PM 可生成汇总报告，通知 CEO
- [ ] CEO 可通过 Dashboard 查看折线图/里程碑/工作项汇总，可钻取到单日日志

### 后端任务

- [x] `[P1]` 项目 CRUD 接口（`GET/POST/PUT/DELETE /projects`）
  > 验证：`ProjectController.java` 全部存在 ✅

- [x] `[P1]` 项目状态管理（`PATCH /projects/{id}/status`，CLOSED/ACTIVE）
  > 验证：`ProjectController.java` 含此方法 ✅

- [x] `[P1]` 项目成员管理（`POST/DELETE /projects/{id}/members`）
  > 验证：`ProjectController.java` 含此方法 ✅

- [ ] `[P1]` 里程碑 CRUD 接口（`GET/POST/PUT/DELETE /projects/{id}/milestones`）
  > 检查：`ProjectController.java` — 搜索 `/milestones` 路由，4个方法均存在

- [ ] `[P1]` 每日进度确认接口（`POST /projects/{id}/progress`，PM 调用，含 milestoneId/note）
  > 检查：`ProjectController.java` — 搜索 `/progress`；写入 `project_progress_log`

- [ ] `[P1]` 汇总报告生成接口（`POST /projects/{id}/construction-summary`，触发 CEO 通知）
  > 检查：Controller — 搜索 `construction-summary` 路由；写入 `construction_log_summary`；调用 NotificationService

- [ ] `[P1]` Dashboard 数据接口（`GET /projects/{id}/dashboard`，返回折线图 + 里程碑 + 工作项汇总）
  > 检查：`ProjectController.java` — 搜索 `/dashboard`；响应含 timeSeriesData/milestones/workItemSummary

- [ ] `[P1]` 施工日志申报周期配置（`PATCH /projects/{id}/config`，CEO 直接修改，无需审批）
  > 检查：Controller — 搜索 `/config`；仅 CEO 角色，写入 `project.log_report_cycle_days` 后立即生效

### 前端任务

- [x] `[P1]` 项目列表页（`pages/projects/index.vue`）接入真实接口
  > 验证：调用 GET /projects 分页接口，支持状态筛选 ✅

- [x] `[P1]` 项目详情页（`pages/projects/detail.vue`）
  > 验证：文件存在 ✅

- [ ] `[P1]` 里程碑管理 + 今日进度确认（PM 视图，集成在项目管理页施工日志 Tab 中）
  > 检查：项目管理页里程碑 Tab — 调用 GET/POST/PUT/DELETE `/projects/{id}/milestones`

- [ ] `[P1]` 汇总报告生成入口（PM 视图，所有日志审批完成后显示）
  > 检查：项目管理页 — 搜索 `POST /projects/{id}/construction-summary`

- [ ] `[P1]` 施工日志 Dashboard（CEO/PM 视图）— 折线图 + 里程碑时间轴 + 工作项汇总
  > 检查：`pages/projects/dashboard.vue` — 文件存在；LineChart 绑定 timeSeriesData

- [ ] `[P2]` 工作台项目进度卡片可点击跳转项目详情
  > 检查：`pages/index/index.vue` — 项目行有点击事件，跳转至 `/pages/projects/detail`

---

## M7 — 报销模块（预留）

> **依赖：** M5（薪资，报销挂钩工资条）
>
> **模块职责：** 费用报销申请、票据上传、审批流。
>
> **可关闭：** `modules.reimbursement = false`（当前默认关闭，功能待后续迭代）
>
> **当前状态：** 仅在 modules.yml 中预留配置项，代码骨架未实现。

- [ ] `[P3]` 在 modules.yml 添加 `modules.reimbursement = false` 配置项
- [ ] `[P3]` 功能设计待确认后再开始实现

---

## M8 — 施工 & 工伤模块

> **依赖：** M3（审批流引擎）、M5（薪资，工伤理赔挂钩薪资周期）
>
> **模块职责：** 施工日志填报与审批、工作项模板管理、工伤补偿申请、工伤理赔录入。
>
> **可关闭：** `modules.construction = false`

**实际代码验证（2026-04-07）**：
- WorkLogController.java：❌ 全部使用 OaDataService（内存），提交/审批均为内存操作
- 本模块所有后端/前端任务均未开始

### 检查点（全部通过才进入 M9）

- [ ] 劳工可提交施工日志（含 workItems 动态列表），PM 可审批，无 CEO 终审
- [ ] PM/CEO 可管理工作项模板（CRUD + 派生）
- [ ] 劳工发起工伤补偿（无金额字段）→ PM 初审 → CEO 终审
- [ ] PM 代录工伤补偿 → skipCondition 触发，直接进 CEO 终审
- [ ] 工伤归档后财务可录入理赔金额并关联薪资周期
- [ ] 附件上传/下载接口可用（图片/PDF）

### 后端任务

- [ ] `[P0]` 写入 INJURY、CONSTRUCTION_LOG 默认审批流（含 `skipCondition`）
  > 检查：`data.sql` — 搜索 INJURY（2节点，含 skipCondition）和 CONSTRUCTION_LOG（1节点）记录

- [ ] `[P0]` 将 `WorkLogController` 从 `OaDataService` 迁移到真实 `FormService`
  > 检查：`WorkLogController.java` — 不再注入 OaDataService，改为 FormService + ApprovalFlowService

- [ ] `[P1]` 工作项模板 CRUD 接口（`GET/POST/PUT/DELETE /work-item-templates`，含 items JSON）
  > 检查：`WorkItemTemplateController.java` — 确认4个方法；响应含 items 数组（name / defaultUnit）

- [ ] `[P1]` 模板派生接口（`POST /work-item-templates/{id}/derive`）
  > 检查：Controller — 搜索 `/derive`，返回新模板 ID，原模板不变

- [ ] `[P1]` 施工日志提交接口（`POST /construction-logs`，含 workItems JSON 数组）
  > 检查：`WorkLogController.java` — POST 方法存在，requestBody 支持 workItems 字段

- [ ] `[P1]` PM 批注接口（`PATCH /construction-logs/{id}/review`，含 pmNote）
  > 检查：Controller — 搜索 `/review`；pmNote 写入 DB 不影响日志正文

- [ ] `[P1]` CEO 追溯驳回接口（`POST /construction-logs/{id}/recall`，状态变为 RECALLED）
  > 检查：Controller — 搜索 `/recall`；写入 operation_log

- [ ] `[P1]` 工伤补偿申请接口（`POST /forms/injury`，不含 compensationAmount）
  > 检查：Controller — 搜索 `/forms/injury` POST；requestBody 不含金额字段；可含 proxyEmployeeId

- [ ] `[P1]` 工伤理赔录入接口（`POST /injury-claims`，finance 专用，含 formRecordId + payrollCycleId + amount）
  > 检查：Controller — 搜索 `/injury-claims` POST；权限校验为 finance；发布 `InjuryClaimSettledEvent`

- [ ] `[P1]` 附件上传接口（`POST /attachments/upload`）+ 本地 FS 存储（见 ARCHITECTURE §8）
  > 检查：Controller — 搜索 `/attachments/upload`；上传成功返回 attachmentId 和文件路径

- [ ] `[P1]` 附件下载接口（`GET /attachments/{id}`，鉴权后返回文件流）
  > 检查：Controller — 含 JWT 鉴权，返回 `ResponseEntity<Resource>`

### 前端任务

- [ ] `[P0]` `components/cross-platform/FileUpload/` — 附件上传组件
  > 检查：`FileUpload/index.vue` — 接受 maxCount/accept props；触发 change 事件返回已上传列表

- [ ] `[P1]` 施工日志填报页（`pages/construction-log/`，劳工专用）
  - workItems 动态列表（增删行）、"从模板填入"弹窗、图片附件上传
  > 检查：`construction-log/index.vue` — workItems 动态逻辑存在；提交时 POST `/construction-logs`

- [ ] `[P1]` 工作项模板管理页（`pages/construction-log/templates/`，PM/CEO）— CRUD + 派生
  > 检查：`templates/index.vue` — 调用 GET/POST/PUT/DELETE `/work-item-templates`；派生按钮调用 `/derive`

- [ ] `[P1]` 施工日志审批页（PM 视图，含 PM 批注输入）
  > 检查：项目管理页日志审批 Tab — 审批操作调用 `PATCH /construction-logs/{id}/review`（含 pmNote）

- [ ] `[P1]` 工伤补偿申请页（`pages/injury/`，劳工专用，含代录入口）
  > 检查：`injury/index.vue` — 无金额字段；含 proxyEmployeeId（代录时可见）；调用 `POST /forms/injury`

- [ ] `[P1]` 工伤理赔录入入口（finance 视图，归档后可见"录入理赔金额"按钮）
  > 检查：payroll 或 injury 相关页面 — 搜索 `POST /injury-claims`；仅 finance 角色可见

- [ ] `[P2]` `components/cross-platform/Steps/` — 审批流步骤条（MP 端需自实现）
  > 检查：`Steps/index.vue` — 接受 steps 数组和 current 索引

---

## M9 — 通知 & 工作台模块

> **依赖：** M3–M8（所有业务模块的事件触发通知）
>
> **模块职责：** 系统内通知推送、工作台聚合摘要、页面配置下发（usePageConfig）。
>
> **可关闭：** 否（通知是核心基础设施）

**实际代码验证（2026-04-07）**：
- NotificationController.java：❌ 使用 OaDataService（内存）
- WorkbenchController.java：⚠️ 静态 switch/case 配置（无真实 DB 查询），summary 接口未实现

### 检查点（全部通过才进入 M10）

- [ ] 工作台摘要数据（待办数/薪资状态/项目数）来自真实接口
- [ ] 审批节点变更后，相关人员待办角标实时更新
- [ ] 工资条发布后，员工收到通知
- [ ] `usePageConfig` composable 可正确拉取页面配置并 session 内缓存

### 后端任务

- [ ] `[P0]` `GET /workbench/summary` 按角色返回摘要（待办数/薪资状态/项目数/到期提醒数）
  > 检查：`WorkbenchController.java` — 按 JWT roleCode 区分返回真实字段（非 hardcoded）

- [ ] `[P1]` 通知触发：`@EventListener` 监听审批节点变更/工资条发布/到期提醒 → 写入 `notification` 表
  > 检查：`NotificationService.java` — 确认在审批、payroll settle、RetentionExpiredEvent 方法中均有调用

- [ ] `[P1]` 通知接口完整实现（GET 列表、单条已读、全部已读、清除已读）
  > 检查：`NotificationController.java` — 确认4个方法存在，均调用真实 Mapper

- [ ] `[P1]` `GET /page-config/{routeCode}` 按 `X-Client-Type` 和角色返回页面字段/按钮配置
  > 检查：Controller — 搜索 `/page-config/{routeCode}`，读取 X-Client-Type 请求头

### 前端任务

- [ ] `[P0]` 工作台接入 `GET /workbench/summary` 替换 mock 数据
  > 检查：`pages/index/index.vue` 或 `workbench-data.ts` — fetchSummary 调用真实接口

- [ ] `[P1]` 待办数量实时更新，徽标响应式
  > 检查：userStore 或 layout 组件 — todoCount 从 `/workbench/summary` 读取并响应式更新

- [ ] `[P1]` 通知列表懒加载（`GET /notifications`，滚动加载下一页）
  > 检查：通知中心页 — 滚动到底部触发下一页加载

- [ ] `[P1]` `usePageConfig(routeCode)` composable，进入页面时拉取配置，session 内缓存
  > 检查：`composables/usePageConfig.ts` — 含缓存逻辑（sessionStorage 或 Map）

---

## M10 — 数据生命周期模块

> **依赖：** M5（工资单保留），M9（通知触发）
>
> **模块职责：** 数据保留策略配置、到期前 30 天提醒、异步导出、清理任务调度。
>
> **可关闭：** `modules.data_lifecycle = false`

### 检查点（全部通过才进入 M11）

- [ ] 所有数据类型默认保留期 1 年，sysadmin 初始化时写入
- [ ] 到期前 30 天，CEO 收到通知（`RetentionExpiredEvent` 触发）
- [ ] CEO 可选择"导出后删除"或"忽略"（无延期选项）
- [ ] 导出任务完成后，下载链接 72 小时有效
- [ ] `operation_log` 跟随全局保留策略，到期物理删除（无逻辑删除）

### 后端任务

- [ ] `[P1]` 将 Retention/Backup/Cleanup Controller 内存逻辑迁移到真实 Service
  > 检查：`RetentionController.java` — 调用真实 RetentionService（有 Mapper），无内存 List/Map

- [ ] `[P1]` sysadmin 初始化时写入默认保留策略（所有类型 1 年）
  > 检查：`data.sql` — 搜索 `INSERT INTO retention_policy`；每种类型均有 retentionYears = 1

- [ ] `[P1]` 到期提醒定时任务（每日扫描，提前 30 天生成 RetentionReminder + 通知 CEO）
  > 检查：`@Scheduled` 方法 — 计算 `expiryDate - 30 days <= today`；写入 retention_reminder；发布 `RetentionExpiredEvent`

- [ ] `[P1]` 异步导出任务（按周期/类型分包压缩，生成 72 小时有效下载链接）
  > 检查：ExportService — 含 `@Async`；生成带过期时间的 download token

- [ ] `[P1]` 数据清理定时任务：先删物理文件 → 再删 DB 记录 → 失败进重试队列（cleanup_task 表）
  > 检查：CleanupService — 先处理 AttachmentMeta 物理文件，再删 DB；有重试逻辑

- [ ] `[P2]` AOP 拦截薪资结算、更正、权限变更、签名绑定 → 写入 `operation_log`
  > 检查：`@Aspect` 类 — 切点覆盖 settle/correction/roleUpdate/signatureBind 方法

- [ ] `[P3]` 延期接口预留（骨架，UI 隐藏，返回 501）
  > 检查：`RetentionController.java` — 搜索 `/retention/extend`，返回 HTTP 501

### 前端任务

- [ ] `[P1]` 数据有效期配置页（CEO 可见，展示各类型当前保留期）
  > 检查：retention 页 — 调用 `GET /retention/policies`，列出各类型名称和保留天数

- [ ] `[P1]` 到期提醒列表，支持"导出后删除"和"忽略"两个操作
  > 检查：retention 页 — 搜索 `/reminders` 调用；两个操作按钮分别触发对应接口

- [ ] `[P2]` 导出任务列表，展示进度和下载链接（轮询状态）
  > 检查：retention 页 — 每5秒拉取任务状态，完成后展示下载链接

---

## M11 — 测试 & 上线准备

> **依赖：** M0–M10 全部完成
>
> **目标：** 核心链路自动化测试覆盖，可稳定部署到生产环境。

### 检查点（全部通过即可上线）

- [ ] 后端 Service 层单元测试覆盖率 ≥ 80%（算薪引擎/审批流/签名存证核心路径 100%）
- [ ] 联调冒烟测试通过（登录→提交单据→审批→工资确认完整链路）
- [ ] PostgreSQL 生产数据库 schema 迁移脚本就绪
- [ ] 应用可以 Docker 容器启动
- [ ] 日志分析工具（`tools/log_analyzer/`）可运行，OA_DEPLOY_KEY 认证生效

### 测试任务

- [ ] `[P0]` 后端 Service 层单元测试（算薪引擎、审批流引擎、签名存证）— 见 TEST_DESIGN §2.1
  > 检查：`app/backend/src/test/java/` — PayrollServiceTest/ApprovalFlowServiceTest/SignatureServiceTest 存在；`mvn test` 覆盖率 ≥ 80%

- [ ] `[P0]` 后端权限隔离测试（角色 vs 接口访问控制）— 见 TEST_DESIGN §3.1
  > 检查：`@WithMockUser` 测试类 — employee 访问财务接口 403；worker 访问施工日志接口 200

- [ ] `[P1]` 联调冒烟测试（各角色完整主线）— 见 TEST_DESIGN §4
  > 检查：手动执行 TEST_DESIGN §4.2–4.6，或编写 API 脚本（`app/tests/`）自动化执行

- [ ] `[P1]` 前端单元测试框架搭建（Vitest + Vue Test Utils）
  > 检查：`vitest.config.ts` 存在，`npm run test:web` 可执行

- [ ] `[P2]` useComponent composable 单元测试、适配层 resolver.ts 单元测试

### 全局 npm 脚本任务

> **目标：** 在 `app/package.json`（workspace 根）提供统一的开发/构建/部署入口，无需进入子目录。
>
> **现状：** `app/package.json` 已有 `dev:web`、`dev:mp-weixin`、`dev:backend`、`build:web`、`build:mp-weixin` 等分散脚本，但缺少顶层 `dev`/`build` 聚合命令，缺少 deploy 脚本，生产构建也未配置压缩/混淆/剔除 debug。

- [ ] `[P1]` 安装 `concurrently` 为 workspace devDependency，用于并行启动多个进程
  > 检查：`app/package.json` devDependencies 含 `concurrently`；`app/node_modules/concurrently` 存在

- [ ] `[P1]` `npm run dev` — 并行启动 H5 前端 + 后端，单命令完成本地开发环境启动
  ```json
  "dev": "concurrently -n frontend,backend -c cyan,yellow \"yarn dev:web\" \"yarn dev:backend\""
  ```
  > 检查：`app/package.json` 含此脚本；执行后前后端均正常启动，输出带颜色前缀区分

- [ ] `[P1]` `npm run dev:mp` — 单独启动小程序编译（监听模式，配合微信开发者工具）
  ```json
  "dev:mp": "yarn --cwd frontend dev:mp-weixin"
  ```
  > 检查：执行后 `frontend/dist/dev/mp-weixin` 目录更新；微信开发者工具可导入预览

- [ ] `[P1]` `npm run build` — 生产构建：类型检查 → H5 build → 小程序 build（串行，任一失败终止）
  ```json
  "build": "yarn type-check && yarn build:h5 && yarn build:mp"
  ```
  > 检查：三步串行执行；类型错误时终止并报错；全部通过后 H5/小程序 dist 产物均存在

- [ ] `[P1]` `npm run build:h5` — H5 生产构建，含代码压缩、混淆、剔除所有 debug
  ```json
  "build:h5": "yarn --cwd frontend build:web"
  ```
  同步更新 `frontend/vite.config.ts` 生产构建配置：
  - `build.minify: 'terser'`
  - `terserOptions.compress.drop_console: true`、`drop_debugger: true`、`pure_funcs: ['console.log', 'console.debug']`
  - `build.sourcemap: false`（生产不输出 source map）
  - `import.meta.env.DEV = false` 由 Vite 自动注入，DevToolbar 被 tree-shake 剔除
  > 检查：`dist/build/h5/` 中 JS 文件内容压缩；搜不到 `console.log`、`DevToolbar`、`reset-setup` 字样；`sourcemap` 文件不存在

- [ ] `[P1]` `npm run build:mp` — 小程序生产构建，同样剔除 debug/dev 工具
  ```json
  "build:mp": "yarn --cwd frontend build:mp-weixin"
  ```
  > 检查：`dist/build/mp-weixin/` 产物存在；JS 中无 `import.meta.env.DEV` 为 true 的分支代码；产物可上传微信开发者工具

- [ ] `[P1]` `npm run type-check` — 全局 TypeScript 类型检查
  ```json
  "type-check": "yarn --cwd frontend type-check"
  ```
  > 检查：执行后 `vue-tsc --noEmit` 输出无错误；存在类型错误时退出码非零，CI 可感知

- [ ] `[P1]` `npm run deploy:h5` — H5 生产产物部署到服务器（rsync over SSH）
  ```json
  "deploy:h5": "yarn build:h5 && rsync -avz --delete frontend/dist/build/h5/ $OA_DEPLOY_HOST:$OA_DEPLOY_PATH"
  ```
  - `OA_DEPLOY_HOST`、`OA_DEPLOY_PATH` 通过环境变量配置，不硬编码到脚本
  - 部署前自动触发 `build:h5`，保证产物是最新的
  > 检查：`app/.env.example` 含 `OA_DEPLOY_HOST=user@server` 和 `OA_DEPLOY_PATH=/var/www/oa-h5` 示例；执行后服务器目录内容更新

- [ ] `[P2]` `npm run test` — 运行前端单元测试
  ```json
  "test": "yarn --cwd frontend test:web"
  ```
  > 检查：执行后 vitest 输出测试结果；测试失败时退出码非零

### 部署任务

- [ ] `[P1]` PostgreSQL 生产 schema 迁移脚本（Flyway 分模块目录，见 ARCHITECTURE §12.5）
  > 检查：`db/migration/` 目录按模块前缀分组；内容与 H2 schema 等价

- [ ] `[P1]` `application-prod.yml`（PostgreSQL、文件存储路径、JWT 密钥环境变量）
  > 检查：JWT 密钥使用 `${JWT_SECRET}` 而非硬编码；OA_DEPLOY_KEY 通过环境变量注入

- [ ] `[P1]` `app/.env.example`：列出所有需要配置的环境变量（`OA_DEPLOY_HOST`、`OA_DEPLOY_PATH`、`OA_DEPLOY_KEY`）
  > 检查：文件存在于 `app/` 根目录；每个变量有注释说明；`.gitignore` 中排除 `.env`

- [ ] `[P2]` Dockerfile（后端 Spring Boot + 前端 Nginx）
  > 检查：根目录 Dockerfile 存在；`docker build` 可成功

- [ ] `[P2]` `GET /actuator/health` 健康检查接口
  > 检查：启动后 `/actuator/health` 返回 `{"status":"UP"}`

---

## M12 — 系统初始化向导

> **优先级：低（不阻塞 M3–M11 功能开发）**
>
> **设计依据：** design.md §8
>
> **目标：** 部署者通过一次性向导完成系统初始配置，向导完成后入口永久关闭。

### 检查点

- [ ] `GET /setup/status` 返回真实值（从 DB 读取）
- [ ] 向导 5 步流程可完整走通
- [ ] 初始化完成后，再次访问向导返回 403
- [ ] 恢复码可重置 CEO 密码，使用后自动轮换
- [ ] Dev 工具：一键重置初始化状态、一键跳过向导、快捷登录均可用（仅 H5 开发模式）

### 后端任务

- [ ] `[P1]` `system_config.initialized` 字段；`GET /setup/status` 读真实值
- [ ] `[P1]` `POST /setup/init` 接口：5步数据写入，完成后写 `initialized=true`，后续拦截所有 `/setup/**` 请求
- [ ] `[P1]` 恢复码生成与验证：明文仅返回一次，服务端存 bcrypt 哈希；验证通过后轮换新码
- [ ] `[P1]` `POST /dev/reset-setup`：重置 `system_config.initialized = false`，仅在 `spring.profiles.active=dev` 时挂载，生产环境返回 404
  > 检查：`DevController.java` — `@Profile("dev")` 注解；生产启动后此路由不存在
- [ ] `[P2]` 运维角色 `ops` 配置变更提案接口，CEO 审批后变更生效；ops 不能自审

### 前端任务

- [ ] `[P1]` 初始化向导页（`pages/setup/index.vue`，5步 Steps，完成后跳转登录页）
- [ ] `[P1]` 未初始化时自动跳向导，已初始化时正常走登录
- [ ] `[P1]` 恢复码展示页（一次性明文 + 复制按钮，确认勾选后"完成"按钮激活）

### Dev 快捷工具任务（双端，`import.meta.env.DEV` 守门，生产构建自动 tree-shake 剔除）

> **目标：** 方便在本地开发环境快速测试初始化向导和各角色业务流程，不影响生产代码。
>
> **实现约束：**
> - H5 端和小程序端均支持；不用 `#ifdef H5` 平台条件（平台判断）而用 `import.meta.env.DEV` 环境判断（开发/生产判断）
> - `import.meta.env.DEV` 在 `yarn build`（production 模式）时为 `false`，Vite/Rollup dead-code-elimination 自动剔除整个代码块，无需手动维护两套代码
> - 后端 Dev 接口必须加 `@Profile("dev")` — 生产环境 Spring 不加载，路由物理不存在
> - H5 端：`DevLoginPanel.vue` 已存在，扩展即可；小程序端：`DevToolbar` 以悬浮 `<button>` 形式呈现（小程序无 fixed 悬浮层限制，用 `position: fixed` CSS 实现）

- [ ] `[P1]` `components/customized/DevToolbar.vue` — 双端 Dev 工具悬浮面板
  - 组件顶层用 `v-if="is_dev"` 守门（`const is_dev = import.meta.env.DEV`），生产构建后整块被 tree-shake
  - H5 端：固定右下角悬浮卡片；小程序端：`position: fixed` 悬浮按钮，点击展开操作列表
  - 包含三个功能入口：重置向导、跳过向导、快捷登录
  > 检查：文件存在；`v-if="is_dev"` 守门；`yarn build:h5` 产物中搜不到"reset-setup"字样；小程序 dist 中同样搜不到

- [ ] `[P1]` **一键重置初始化向导**（双端）：调用 `POST /dev/reset-setup`，成功后清空 userStore session 并跳转 `/pages/setup/index`
  > 检查：DevToolbar — 点击后弹确认框；确认后调接口；后端 `@Profile("dev")` 接口存在；生产启动后此接口 404

- [ ] `[P1]` **一键跳过向导**（双端）：调用 `POST /dev/reset-setup` 后立即调 `POST /setup/init`（填入预设测试数据），跳转登录页
  > 检查：DevToolbar — 一次点击完成重置+初始化两步；跳过后 `/setup/status` 返回 `initialized: true`

- [ ] `[P1]` **快捷登录面板**（双端，扩展现有 `DevLoginPanel.vue`）：5个测试账号一键登录
  - 账号列表：employee.demo / finance.demo / pm.demo / ceo.demo / worker.demo，密码统一 `123456`
  - 点击后直接完成登录并跳转工作台（复用 `loginWithAccount`）
  - H5 端：已有 `DevLoginPanel` 入口，扩展按钮列表即可；小程序端：集成到 DevToolbar 展开面板中
  > 检查：`DevLoginPanel.vue` — 含5个账号按钮，点击直接调 `loginWithAccount`；DevToolbar 小程序面板同样含5个账号按钮；登录失败有错误提示

### 测试用例（M12 功能验收）

- [ ] `[P1]` TC-SETUP-01：全新环境下访问任意页面，自动跳转初始化向导
  > 步骤：清空 DB → 启动服务 → 访问 `/pages/index/index` → 验证跳转到 `/pages/setup/index`

- [ ] `[P1]` TC-SETUP-02：完整走通5步向导，完成后跳转登录页，再次访问向导返回 403
  > 步骤：向导第1步填企业名 → 第2步创建 CEO 账号 → 第3步配置部门 → 第4步审批流 → 第5步确认 → 登录 → 访问 `/setup` → 403

- [ ] `[P1]` TC-SETUP-03：恢复码重置 CEO 密码
  > 步骤：保存向导完成时展示的恢复码 → 用正确恢复码调重置接口 → 新密码可登录 → 同一恢复码第二次使用失败（已轮换）

- [ ] `[P1]` TC-SETUP-04：Dev 一键重置后向导可重走
  > 步骤：初始化完成态 → 点击 DevToolbar"重置向导" → 确认 → 跳转向导首页 → `/setup/status` 返回 `initialized: false`

- [ ] `[P1]` TC-SETUP-05：Dev 一键跳过向导
  > 步骤：全新态 → 点击"跳过向导" → 自动完成初始化 → 跳登录页 → 用 ceo.demo 可正常登录

- [ ] `[P1]` TC-SETUP-06：Dev 快捷登录5个账号逐一验证
  > 步骤：点击每个账号按钮 → 验证跳转工作台 → 工作台菜单与角色权限一致

### Dev 日志规范

- [ ] `[P2]` 初始化向导每步完成后，后端写入 `SystemLog`（level: INFO，module: setup，operation: setup.step.N.completed）
  > 检查：`SetupController.java` — 每步写结构化日志；可通过 log_analyzer 按 `module=setup` 过滤查看

- [ ] `[P2]` Dev Reset 操作写入 `SystemLog`（level: WARN，operation: dev.reset-setup，标注"仅开发环境"）
  > 检查：`DevController.java` — reset 成功后输出一条 WARN 日志

---

## M-MP — 微信小程序端（⚠️ 低优先级，H5 + 后端全部打通后再实施）

> **架构现状（2026-04-07 重构完成）：**
> - 小程序独立目录：`app/mp/`（uni-app，仅保留 MP-WEIXIN 平台）
> - 共享类型层：`app/shared/types/`（`SessionUser`、`FormConfig`、`EmployeeProfile` 等）
> - 共享工具层：`app/shared/utils/`（`getAvailableFormOptions` 等纯函数）
> - H5 端由 `app/h5/`（Nuxt 3）独立实现，已完成 12/12 浏览器自动化测试
>
> **优先级说明：** 小程序开发优先级**低于 H5 和后端**。  
> H5 端页面全部实现、后端模块全部打通（M3–M9）后，再回头实现小程序界面。
>
> **启动命令：**
> ```bash
> yarn dev:mp   # 编译监听，配合微信开发者工具导入 app/mp/dist/dev/mp-weixin/
> yarn build:mp # 生产构建
> ```

### 前置清理任务（重构遗留）

- [ ] `[P1]` **清理 pages.json 中的 H5 专属页面**：小程序端仅保留登录、工作台、待办、考勤、项目、忘记密码 6 个入口；移除 payroll（薪资）、employees（员工管理）、role（角色管理）、config（系统配置）、positions（岗位管理）、org（组织架构）等管理类页面（管理员在 H5 端操作）
  > 检查：`app/mp/src/pages.json` — 仅留 6 条页面路由；被删除页面目录可保留代码（未来扩展）但不注册路由

- [ ] `[P1]` **审核并清理 app/mp/src/ 中残留的 `#ifdef H5` 条件编译块**（如有）
  > 检查：`grep -r "#ifdef H5" app/mp/src/` 输出为空

### 核心页面实现（对标 H5 端）

- [ ] `[P2]` **登录页 `pages/login/index.vue`**：手机号/账号密码登录，接入真实 `POST /api/auth/login`，成功后跳工作台
  > 检查：employee.demo + 123456 可登录；错误密码有 Toast 提示；登录后 token 写入 uni storage

- [ ] `[P2]` **工作台 `pages/index/index.vue`**：动态菜单卡片（调 `GET /api/auth/menus` 按角色显示）、未读待办徽章、个人信息头部
  > 检查：CEO 看到全部菜单；employee 只看到 3–4 个授权菜单；徽章显示待审批数

- [ ] `[P2]` **待办页 `pages/todo/index.vue`**：待审批表单列表，支持审批操作（通过/拒绝）
  > 检查：提交请假单后，审批人待办出现记录；操作后状态变更

- [ ] `[P2]` **考勤页 `pages/attendance/index.vue`**：打卡（GPS）、本月出勤记录展示、请假/加班申请入口
  > 检查：模拟位置后可打卡；记录出现在列表；申请走完审批流后状态更新

- [ ] `[P3]` **项目页 `pages/projects/index.vue`**：项目列表，PM 可查成员，worker 可填施工日志
  > 检查：PM 账号只看到自己的项目；施工日志表单可提交

- [ ] `[P3]` **忘记密码 `pages/auth/forgot_password/index.vue`**：完整 4 步流程（手机号→验证码→新密码→成功）
  > 检查：完整走通，新密码可登录

### 体验 & 适配

- [ ] `[P3]` **底部 tabBar 图标**：为工作台和登录页配置本地 icon（当前使用文字占位）
  > 检查：`app/mp/src/static/tabbar/` 下有对应 png；pages.json iconPath 指向正确路径

- [ ] `[P3]` **AppShell 菜单权限适配**：小程序 AppShell 组件按 `GET /api/auth/menus` 动态渲染侧边栏/底部导航
  > 检查：不同角色账号登录，底部导航项目数量和内容不同

- [ ] `[P3]` **网络异常降级**：无网络时展示离线提示页，已有本地缓存数据可只读查看

### 测试用例（小程序端）

- [ ] `[P2]` TC-MP-01：employee.demo 登录后工作台可见菜单与角色权限一致
- [ ] `[P2]` TC-MP-02：考勤打卡后记录出现在本月出勤列表
- [ ] `[P2]` TC-MP-03：提交请假申请后，审批人待办列表出现记录，操作后状态同步
- [ ] `[P3]` TC-MP-04：施工日志（worker 角色）可提交，列表出现记录

