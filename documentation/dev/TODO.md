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
- [ ] `[P0]` 补全 `data.sql`：写入 5 个测试账号（employee.demo、worker.demo、pm.demo、ceo.demo、finance.demo）及对应角色、部门数据
- [ ] `[P1]` 补全 Mapper：`EmployeeMapper`（扩展现有）、`ProjectMapper`、`DepartmentMapper`
- [ ] `[P1]` `ApprovalFlowNode` 实体新增 `skipCondition` JSON 字段（用于工伤补偿动态路由，见 WORKFLOW_CONFIG §1.3）

### 前端任务

- [ ] `[P0]` 迁移所有 HTTP 请求到 `utils/http.ts`：清理 `access.ts` 和 `forms.ts` 中的私有 `request()` 函数
- [ ] `[P0]` `http.ts` 补全：自动携带 `X-Client-Type`、401 自动跳转登录、错误 toast 提示
- [ ] `[P1]` `http.ts` 新增 loading 状态管理（同一接口请求中禁止重复提交）
- [ ] `[P1]` `components.json` 补全注册：`Upload`、`Tabs`/`Tab`、`Tag`、`Steps`/`Step`、`Popup`、`Textarea`、`Canvas`
- [ ] `[P2]` `getComponentSync` 补充条件编译实现（当前为空壳）

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
- [ ] `[P0]` 排查并修复所有页面 `onMounted` 报错（组件缺失 crash、undefined 引用等）
- [ ] `[P1]` 补全 `components/cross-platform/Table/` 组件（当前文件缺失，MP 会 crash）
- [ ] `[P1]` 验证 AntD CSS 变量覆盖（`--ant-color-primary` 对齐 `--oa-primary: #003466`）
- [ ] `[P1]` 验证 Vant CSS 变量覆盖（`--van-primary-color` 对齐 `--oa-primary`）
- [ ] `[P1]` 修复 `components.json` 中 `Textarea` H5 端来源错误（应为 `Textarea` 而非 `Input.TextArea`）
- [ ] `[P2]` 验证双端主色、圆角、字体、间距视觉一致性（H5 Chrome + 微信开发者工具模拟器）
- [ ] `[P2]` 各页面使用 mock 数据填充，确保表格、列表、表单均有内容可看

### 后端任务

- [ ] `[P1]` `GET /setup/status` 接口可用（初始化向导入口）
- [ ] `[P1]` `POST /auth/login` 可使用 `data.sql` 中 5 个测试账号登录，返回 JWT + 用户信息

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
- [ ] `[P0]` 登录响应补充 `employeeType` 字段
- [ ] `[P1]` 员工 CRUD 接口（`GET/POST/PUT/DELETE /employees`），含员工类型、部门、角色关联
- [ ] `[P1]` 角色 CRUD 接口（`GET/POST/PUT/DELETE /roles`），含权限项配置
- [ ] `[P1]` 将 `OaDataService` 员工/账号内存逻辑迁移到真实 Service + Mapper
- [ ] `[P2]` 密码重置接口（`POST /employees/{id}/reset-password`，CEO 专用）
- [ ] `[P2]` 账号禁用/启用接口（`PATCH /employees/{id}/status`，CEO 专用）
- [ ] `[P2]` 预留企业微信 OAuth 骨架（`/auth/wework`，当前返回 501）

### 前端任务

- [ ] `[P0]` 登录成功后将 `employeeType` 写入 `userStore`
- [ ] `[P1]` 员工列表接入真实接口，支持部门/角色/类型/状态筛选、关键字搜索
- [ ] `[P1]` 员工新增/编辑弹窗对接接口
- [ ] `[P1]` 角色管理页（列表、新增、编辑权限矩阵）对接接口
- [ ] `[P2]` 员工详情页（独立页面，见 COMPONENT_LAYOUT §5）

---

## Phase 3 — 组织管理

**目标：** 部门树、项目列表、项目成员关系完整可管理。

### 检查点（全部通过才进入 Phase 4）

- [ ] 部门树可展示，支持新增部门节点
- [ ] 项目列表可管理（新增/编辑/关闭）
- [ ] 项目经理可查看本项目成员，CEO 可添加/移除任意项目成员

### 后端任务

- [ ] `[P0]` 部门树接口（`GET /departments`）
- [ ] `[P1]` 项目 CRUD 接口（`GET/POST/PUT/DELETE /projects`）
- [ ] `[P1]` 项目成员管理接口（`POST/DELETE /projects/{id}/members`）
- [ ] `[P1]` 将 `OaDataService` 部门/项目内存逻辑迁移到真实 Service + Mapper

### 前端任务

- [ ] `[P1]` 员工管理接入部门树筛选
- [ ] `[P1]` 项目列表接入真实接口（`GET /projects`）
- [ ] `[P1]` 项目详情页（独立页面，见 COMPONENT_LAYOUT §4）
- [ ] `[P1]` 项目成员管理：添加/移除成员
- [ ] `[P2]` 员工管理项目经理视图（只读，仅显示本项目成员，见 COMPONENT_LAYOUT §5.3）
- [ ] `[P2]` 通讯录导入页（`pages/directory/`，财务/CEO 可见，见 COMPONENT_LAYOUT §6）
  - 导入预览（`POST /directory/import/preview`）
  - 字段映射配置
  - 重复检查结果展示
  - 执行导入（`POST /directory/import/apply`）
  - 导入结果明细

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
- [ ] `[P0]` 系统启动时写入 LEAVE、OVERTIME 默认两级审批流配置
- [ ] `[P0]` 所有审批节点操作（提交、审批、驳回、归档、追溯驳回）写入 `operation_log`，永久保留（不受数据保留策略删除）
- [ ] `[P1]` 将 `OaDataService` 表单/审批内存逻辑迁移到真实 Service + Mapper
- [ ] `[P1]` 请假/加班提交接口（`POST /attendance/leave`、`POST /attendance/overtime`）
- [ ] `[P1]` 待办列表接口（`GET /forms/todo`，按角色过滤 PENDING/APPROVING 单据）
- [ ] `[P1]` 审批操作接口（`POST /forms/{id}/approve`、`POST /forms/{id}/reject`）
- [ ] `[P1]` 历史记录接口（`GET /attendance/history`，本人或项目范围）
- [ ] `[P1]` 考勤计量单位配置（`GET/POST /config/attendance-unit`，选项：小时/半天/天，影响请假和加班精度）
- [ ] `[P2]` 加班代录接口（`project_manager`/`ceo` 代他人提交，含 `proxyEmployee` 字段）

### 前端任务

- [ ] `[P0]` 考勤页接入真实接口（提交请假/加班、获取历史记录）
- [ ] `[P1]` 待办中心页（`pages/todo/`，聚合所有待我审批，按类型/状态/项目筛选）
- [ ] `[P1]` 审批通过/驳回对接（含驳回原因输入）
- [ ] `[P2]` 新建 `components/customized/ApprovalTimeline.vue` — 审批历史时间轴组件
- [ ] `[P2]` 审批详情页使用 `ApprovalTimeline` 展示历史流转
- [ ] `[P2]` 驳回后可查看驳回原因，支持重新发起

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
- [ ] `[P1]` 施工日志提交接口（`POST /construction-logs`，含 `workItems` JSON 数组字段）
- [ ] `[P1]` 施工日志 CEO 追溯驳回接口（`POST /construction-logs/{id}/recall`，状态变为 RECALLED）
- [ ] `[P1]` 工伤补偿申请接口（`POST /forms/injury`，不含 `injuryType` 和 `compensationAmount`）
- [ ] `[P1]` 工伤理赔录入接口（`POST /injury-claims`，finance 专用，关联 `formRecordId` + `payrollCycleId` + `amount`）
- [ ] `[P1]` 附件上传接口（`POST /attachments/upload`）+ 本地文件系统存储（路径规范见 ARCHITECTURE §9.1）
- [ ] `[P1]` 附件下载接口（`GET /attachments/{id}`，鉴权后返回文件流）

### 前端任务

- [ ] `[P0]` 新建 `components/cross-platform/FileUpload/` — 附件上传组件（封装 uni 上传 API，支持预览和删除）
- [ ] `[P1]` 施工日志填报页（`pages/construction-log/`，劳工专用）
  - `workItems` 动态列表：每行 [目标名称 + 数量 + 单位]，支持增删行
  - 补充说明文本框（可选）
  - 系统提交后渲染表格 + 自动生成文字摘要
  - 图片附件上传（多张）
- [ ] `[P1]` 工伤补偿申请页（`pages/injury/`，劳工专用，任何员工可代录入，见 COMPONENT_LAYOUT §1.6）
- [ ] `[P1]` 工伤理赔录入入口（finance 视图，归档后可见"录入理赔金额"按钮，选择关联薪资周期）
- [ ] `[P2]` 新建 `components/cross-platform/Steps/` — 审批流步骤条（MP 端无 AntD Steps，需自实现）

---

## Phase 6 — 薪资体系

**目标：** 财务可完成结算发布，员工可手写签名确认工资条，更正流程完整。

### 检查点（全部通过才进入 Phase 7）

- [ ] 财务执行预结算，**4 项**校验（无施工日志项）可查看通过状态
- [ ] 财务执行正式结算，周期锁定，员工端工资条状态变为"待确认"
- [ ] 员工完成电子签名绑定（手写 + PIN 码），可确认工资条
- [ ] 工资条确认后生成存证 PDF，包含签名、意图声明、时间戳水印
- [ ] 财务可对已归档工伤记录录入理赔金额并关联薪资周期
- [ ] 财务可发起更正，CEO 审批解锁后重新结算，历史版本保留

### 后端任务

- [ ] `[P0]` 将 `OaDataService` 薪资内存逻辑迁移到真实 Service + Mapper
- [ ] `[P0]` 预结算校验（4项）+ 算薪引擎（按规则生成 `PayrollSlip` + `PayrollItem` 明细）
- [ ] `[P0]` 正式结算、锁定周期、工资条发布
- [ ] `[P1]` 薪资档位 CRUD（`SalaryGrade`：档位编码、名称、月基本工资，sysadmin 初始化时批量配置）
- [ ] `[P1]` 结算周期全量配置（起始日、结束日、发薪日、结算截止日、结算提醒前置天数）
- [ ] `[P1]` 社保模式配置（公司代缴 vs 并入工资，支持分项比例或总额百分比两种计算方式）
- [ ] `[P1]` 薪资规则配置 CRUD（加班倍率、请假扣款公式、公积金比例、个税参数）
- [ ] `[P1]` 考勤管理：手工录入/批量导入（CSV）、异常标记、异常列表查询
- [ ] `[P1]` 电子签名 Service（见 ARCHITECTURE §12）：
  - 签名加密存档 + `EmployeeSignature` 入库
  - PIN 码 bcrypt 哈希存储
  - 工资单内容 SHA-256 哈希
  - 签署 PDF 生成（明细 + 签名叠加 + 时间戳水印）
  - `PayrollConfirmation` 完整证据链写入
  - `SignatureProvider` 接口抽象，当前实现 `LocalSignatureProvider`
- [ ] `[P2]` 工资异议审批流 + 更正解锁重算（新版本 `version` 递增，历史版本保留）
- [ ] `[P2]` 工资异议接口（`POST /payroll/slips/{id}/dispute`）

### 前端任务

- [ ] `[P0]` 新建 `components/cross-platform/SignatureCanvas/` — 手写签名画板（双端兼容触控和鼠标，输出 base64）
- [ ] `[P1]` 薪资页接入真实接口（`GET /payroll/cycles`、`GET /payroll/slips`）
- [ ] `[P1]` 预结算发起页：展示 **4 项**校验清单，问题项可跳转处理
- [ ] `[P1]` 工资条详情页：工资项明细展示（社保按配置模式展示"扣款"或"补贴"）
- [ ] `[P1]` 电子签名流程：
  - 首次签名引导：实名确认 → `SignatureCanvas` 手写 → 预览 → 绑定（`POST /signature/bind`）
  - 设置 PIN 码（`POST /signature/set-pin`，4-6 位数字）
  - 工资确认弹窗：签名预览 + 意图声明文本 + PIN 码输入 → 提交（`POST /payroll/slips/{id}/confirm`）
- [ ] `[P2]` CEO 薪资审批视图（单独视图，见 COMPONENT_LAYOUT §3.1）
- [ ] `[P2]` 工资异议发起（`POST /payroll/slips/{id}/dispute`）
- [ ] `[P2]` 更正历史版本查看

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
- [ ] `[P1]` `GET /page-config/{routeCode}` 按 `X-Client-Type` 和角色返回页面字段/布局/按钮配置
- [ ] `[P1]` 通知触发：审批节点变更、工资条发布、到期提醒 → 写入 `notification` 表
- [ ] `[P1]` `GET /notifications`、`POST /notifications/{id}/read`

### 前端任务

- [ ] `[P0]` 工作台接入聚合摘要接口替换 mock 统计数据
- [ ] `[P1]` 待办数量接入真实接口，徽标实时更新
- [ ] `[P1]` 通知列表进入通知中心页面后懒加载（`GET /notifications`）
- [ ] `[P1]` 实现 `usePageConfig(routeCode)` composable，进入页面时拉取页面配置并 session 内缓存

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
- [ ] `[P1]` sysadmin 初始化时写入默认保留策略（所有类型默认 1 年）
- [ ] `[P1]` 到期提醒定时任务（每日扫描，提前 30 天生成 `RetentionReminder`，写通知）
- [ ] `[P1]` 异步导出任务：按周期/项目/类型分包 → 压缩 → 生成下载链接（72 小时有效）
- [ ] `[P1]` 数据清理定时任务：先删物理文件 → 再删 DB 记录 → 失败进重试队列
- [ ] `[P1]` `operation_log` 写入 API（由审批引擎调用，不经 retention 策略删除）
- [ ] `[P2]` AOP 拦截薪资结算、更正、权限变更、签名绑定 → 写入 `operation_log`
- [ ] `[P3]` 延期接口预留（接口骨架，UI 隐藏，后续收费功能）

### 前端任务

- [ ] `[P1]` 数据有效期配置页（CEO 可见，展示各类型当前保留期）
- [ ] `[P1]` 到期提醒列表（`GET /retention/reminders`），支持"导出后删除"和"忽略"两个操作
- [ ] `[P2]` 导出任务列表，展示进度和下载链接

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
- [ ] `[P0]` 后端权限隔离测试（角色 vs 接口访问控制）— 见 TEST_DESIGN §3.1
- [ ] `[P1]` 联调冒烟测试（登录→提交单据→审批→工资确认完整链路）— 见 TEST_DESIGN §4
- [ ] `[P1]` 前端单元测试框架搭建（Vitest + Vue Test Utils）
- [ ] `[P2]` `useComponent` composable 单元测试
- [ ] `[P2]` 适配层 `resolver.ts` 单元测试（平台切换、组件缺失降级）

### 部署任务

- [ ] `[P1]` PostgreSQL 生产 schema 迁移脚本（Flyway 或手写 SQL）
- [ ] `[P1]` `application-prod.yml` 配置（PostgreSQL、文件存储路径、JWT 密钥外置）
- [ ] `[P2]` Dockerfile（前后端分离，Nginx + Spring Boot 各一个容器）
- [ ] `[P2]` 健康检查接口（`GET /actuator/health`）

---

## P3 低优先级（延后迭代）

> 以下功能在核心业务验证通过后再启动，不影响 MVP。

### 缓存层

- [ ] `[P3]` `GET /workbench/summary` 加 60 秒服务端缓存（当前每次直接查询 DB，性能足够时无需优先）

### 企业微信接入（待账号信息就绪）

- [ ] `[P3]` 后端 `WeworkService` 接口替换为真实实现（当前为 mock 空实现）
- [ ] `[P3]` 企业微信 OAuth 登录（`/auth/wework`）
- [ ] `[P3]` 通讯录批量导入接入企业微信 API
- [ ] `[P3]` 应用消息推送（审批通知、工资条发布、到期提醒）
- [ ] `[P3]` 小程序端编译验证（`yarn dev:mp-weixin`）
- [ ] `[P3]` 所有页面适配小程序竖屏布局（卡片化、底部操作区固定）
- [ ] `[P3]` 审批详情支持折叠分段
- [ ] `[P3]` `SignatureCanvas` 在小程序触控环境验证可用

### e签宝接入（待合同签订）

- [ ] `[P3]` 实现 `EsignSignatureProvider`（`SignatureProvider` 接口的第三方实现，替换 `LocalSignatureProvider`）

---

## 变更记录

| 日期        | 内容                                                                                                                                           |
|-----------|------------------------------------------------------------------------------------------------------------------------------------------------|
| 2026-04-02 | 更新多项业务规格：施工日志独立系统+workItems快捷录入+CEO追溯驳回；工伤表单去掉金额字段，finance事后录入理赔；薪资档位批量配置；社保模式可配置；数据保留全部默认1年；操作日志永久保留；预结算校验降为4项 |
| 2026-04-02 | 全量重写为阶段化 0→1 开发路线图：Phase 0-9 + P3 低优先级区块，含里程碑总览、检查点、优先级标注 [P0-P3]；确认关键架构决策（skipCondition、数据保留10年起步、缓存延后、e签宝延后） |
| 2026-04-01 | 基于前端代码审计全量重写 TODO：按业务模块组织，补充前端工程基础缺口                                                                                   |
| 2026-04-01 | 补充架构决策：可配置审批流、电子签名、设备类型协议、工作台混合加载、文件存储规范                                                                          |
| 2026-03-31 | 工程稳定性修复、门户工作台基线、后端 API 骨架、权限矩阵                                                                                              |
