# 博渊 OA 平台 — 开发路线图

> **唯一进度管理入口。** 完成一项立即打勾并提交。
>
> 状态：`[ ]` 待开发 / `[~]` 开发中 / `[>]` 待测试 / `[?]` 待验收 / `[x]` 已完成
>
> 状态流转：`[ ]` → 开始编码前改为 `[~]` → 代码完成后改为 `[>]` → 自动化测试通过后改为 `[?]` → 浏览器人工验收通过后改为 `[x]`
>
> 验收标准：**以真实浏览器可操作为准**，不接受仅代码存在、无法使用的功能。

---

## 当前阶段目标

**Phase A（当前）：对照 DESIGN.md 完整实现 Web 端全部功能，达到可真实上线测试状态**

Phase A 完成标准：
1. 所有角色登录后，菜单内每一个页面均可正常使用
2. 每个页面的字段、交互与 DESIGN.md 完全一致，无缺失字段、无错误权限
3. 核心业务链路（请假/加班/报销/工伤/薪资/施工日志）可端到端跑通
4. 无 TODO 注释、无死路由、无硬编码占位数据

> **当前状态（2026-04-16 Review 结论）**：经对照 DESIGN.md 全文代码审查，发现 20 项功能缺口，全部列为 P0 必须完成。原"Phase A 代码已全部实现"的判断有误——多个页面存在关键字段缺失、整页未实现、权限逻辑错误等问题。以下任务列表为修正后的完整清单。

**Phase B（Phase A 完成后）：集成测试 + 生产部署验证**

**Phase C（Phase B 完成后）：微信小程序开发**

---

## Phase A — Web 端功能全量实现

### A1 — 全新页面（整页代码缺失，需从零实现）

- [>] **假期配额管理 `/leave-types`**（HR 菜单）
  - 内容：假期类型列表（年假/事假/病假/婚假/产假/自定义）CRUD；每条含：名称、配额、是否扣款、扣款比例、扣款基准
  - 后端接口：`GET/POST/PUT/DELETE /config/leave-types`（需确认是否已存在，不存在则新增）
  - ROLE_MENUS.hr 添加入口
  - 请假申请下拉"假种"改为从此接口动态加载，不再硬编码
  > 验收：HR 登录可进入，可新增"调休假"并设置配额 3 天，员工请假下拉可选到"调休假"

- [>] **数据导出 `/data-export`**（CEO 菜单）
  - 内容：选择时间范围 → 触发导出 → 下载 `.obk` 文件（§10.2）
  - ROLE_MENUS.ceo 添加"数据导出"入口
  > 验收：CEO 可选择时间范围并点击导出，浏览器弹出文件下载

- [>] **历史数据查看 `/data-viewer`**（CEO 菜单）
  - 内容：拖拽或选择 `.obk` 文件 → 只读方式展示历史数据（§10.3）
  - ROLE_MENUS.ceo 添加"数据文件查看"入口
  > 验收：CEO 上传 .obk 文件后以只读视图展示历史记录

---

### A2 — 人员与组织

- [>] **员工创建/编辑表单补全缺失字段**（`/employees`）
  - 缺少：**性别**（必填，男/女单选）
  - 缺少：**部门/岗位/等级** 级联下拉（部门列表 → 该部门岗位 → 该岗位等级，三级联动）
  - 缺少：**直系领导** 可搜索下拉（系统自动匹配部门经理/项目经理，可手动覆盖）
  - 缺少：身份证号、出生日期字段（选填）
  - 修复：主角色改为下拉菜单（从 `/roles` 加载），不再使用文本输入
  > 验收：HR 新建员工时可选择部门并联动岗位/等级；性别为必填；保存后员工详情正确显示所有字段

- [>] **组织架构拖拽汇报关系配置**（`/org`）
  - 当前实现仅为部门 CRUD 树，设计要求双面板拖拽汇报关系树（§3.5）
  - 需实现：左侧备选节点区 + 右侧汇报关系树，支持拖拽配置上下级关系
  - 后端接口：`GET/PUT /org/tree`（汇报关系树读写）
  - CEO 固定在顶层不可移动，系统防止循环汇报校验
  > 验收：HR 可将员工节点拖入汇报树，保存后员工直系领导自动更新

---

### A3 — 考勤管理

- [>] **请假申请表单补全缺失字段**（`/attendance` leave Tab）
  - 缺少：**请假时长**只读展示（按开始/结束日期 × 最小单位自动计算，§7.2）
  - 缺少：**附件**文件上传（选填，病假单证明材料）
  - 缺少：**追溯申请**复选框（§7.2，住院等紧急情况补录用）
  > 验收：选择日期后时长自动计算显示；可上传附件；追溯申请勾选后提交成功

- [>] **加班申报表单补全缺失字段**（`/attendance` overtime Tab）
  - 缺少：**加班时长**只读展示（自动计算，§7.3）
  - 缺少：**附件**文件上传（选填）
  > 验收：选择开始/结束时间后加班时长自动显示

- [>] **考勤页 isPmOrCeo 逻辑修复**（`/attendance` line 407）
  - 当前：`isPmOrCeo = role === 'project_manager' || role === 'ceo'`
  - 修复为：包含 `department_manager`（§7.3 部门经理也可录入团队加班通知）
  - 同步修复 tab 显示条件和发起通知接口调用权限
  > 验收：dept_manager 登录可见"发起通知"和"已发起"Tab，可创建加班通知

- [>] **Worker 菜单添加考勤管理入口**（`default.vue` ROLE_MENUS.worker）
  - 当前 worker 菜单无 `/attendance`，但劳工需要提交请假/加班申请（§5.8）
  - 添加 `{ key: '/attendance', label: '考勤申请', path: '/attendance' }` 到 worker 菜单
  - 同步更新后端 WorkbenchController worker 菜单配置
  > 验收：worker 账号登录，侧边栏可见考勤入口，可提交请假申请

---

### A4 — 薪资、报销、工伤

- [>] **报销申请表单补全缺失字段**（`/expense/apply`）
  - 缺少：**发票文件上传**（DESIGN.md §9.2 明确为**必填**）
  - 缺少：**关联项目**下拉（从本人参与项目列表选择，审批通过后自动计入项目差旅成本，§9.2）
  - 缺少：单条明细的附件上传字段（当前明细行有 attachmentId 但无上传组件）
  > 验收：员工提交报销时发票上传为必填（不上传无法提交）；可选关联项目；提交后该项目成本视图出现此报销记录

- [>] **工伤申报表单补全缺失字段**（`/injury`）
  - 缺少：**受伤时间**时间选择器（§7.4 必填）
  - 缺少：独立的**医生诊断结果**多行文本字段（§7.4 必填）
  - 缺少：独立的**事故经过**多行文本字段（§7.4 必填，现合并在"伤情描述"中）
  - 修复：财务录入理赔弹窗的 formRecordId 和 employeeId 改为从已通过申报单列表选择，不再手动输入数字 ID
  > 验收：劳工提交工伤申报时三个独立字段均可填写；财务录入理赔可从下拉选择已通过的申报单

---

### A5 — 项目管理

- [>] **项目详情基本信息字段补全**（`/projects/[id].vue` info Tab）
  - 缺少：**合同编号**、**合同附件**、**客户名称**、**项目说明**字段的展示与编辑（§8.1）
  - 修复：成员添加改为员工搜索下拉（按姓名/工号），不再用数字 ID 输入框
  > 验收：PM 创建项目时可填客户名称和合同编号；项目详情可看到这些字段

- [>] **施工日志 PM 审批流程验证与修复**（`/construction-log` 和 `/projects/[id].vue` logs Tab）
  - `/construction-log/index.vue` 有 TODO 注释表明审批按钮缺失（line 28-30）
  - 确认 `/projects/[id].vue` 的"施工日志审批"Tab 中 approve/reject 功能完整可用
  - 若缺失则实现：工长日志列表 + 通过/驳回按钮 + 驳回原因填写
  > 验收：PM 在项目详情"施工日志审批"Tab 中可看到待审核日志并完成通过/驳回操作

---

### A6 — 系统配置

- [>] **`/config` 补全企业名称编辑**
  - 新增 Card "企业信息"：企业名称文本输入 + 保存按钮
  - 后端接口：`PUT /config/company-name`（或复用 `/system-config`，key = company_name）
  - 保存后 `app.vue` 的动态标题同步更新
  > 验收：CEO 修改企业名后，浏览器标签页标题变为"{新企业名}OA管理系统"

- [>] **`/config` 补全薪资周期配置**（DESIGN.md §5.0.5 全局配置视图）
  - 新增配置项：发薪日（默认 15 日，遇节假日提前/顺延选项）、结算截止日（发薪日前 N 天）
  - 后端接口：`GET/PUT /config/payroll-cycle`
  > 验收：CEO 修改发薪日为 20 日并保存，薪资周期创建时默认使用新发薪日

- [>] **`/config` 补全数据保留期配置**
  - 新增配置项：全局数据保留期下拉（1年/2年/3年/5年，默认3年）
  - 后端接口：`GET/PUT /config/retention-period`（或确认现有 `/retention` 页是否已覆盖）
  > 验收：CEO 修改保留期后，retention 页展示新值

- [>] **`/config` 审批流配置补全 EXPENSE 类型**（`config/index.vue` line 207）
  - `BUSINESS_TYPE_LABELS` 添加 `EXPENSE: '报销申请'`
  - 确认后端 approval_flow 表有 EXPENSE 类型记录（若无则在 V2__init_data.sql 或 seed 中补充）
  > 验收：CEO 在审批流配置中可看到"报销申请"审批流并可编辑节点

---

### A7 — 权限 / 路由 / 布局修复

- [>] **Layout todo 数量统计修复**（`default.vue` line 244）
  - 当前：`canAccessAttendanceTodo = role === 'ceo' || role === 'project_manager'`
  - 修复为：所有角色均调用 `/forms/todo`（或等效接口）获取自身待办数，todo 角标对 finance/hr/dept_manager/employee/worker 均生效
  > 验收：dept_manager 账号顶部待办角标显示待审批考勤数；finance 账号显示待审批报销数

- [>] **财务菜单补全独立路由**（DESIGN.md §5.4）
  - 确认岗位薪资配置（`/payroll` 某 Tab）和社保配置是否已可用；若作为独立页面则添加路由
  - ROLE_MENUS.finance 确认包含：薪资管理、岗位薪资配置、社保配置、项目成本、营收管理、报销审批入口
  - 如相关功能已在 `/payroll` 子 Tab 中实现，则添加菜单入口指向对应路径；如缺失则实现
  > 验收：finance 账号侧边栏可进入岗位薪资配置并修改等级薪资；可进入社保配置并修改比例

- [>] **运维角色基础支持**（DESIGN.md §5.9）
  - ROLE_MENUS 添加 `ops` 角色菜单（工作台 + 操作日志）
  - 若向导步骤3已创建运维账号，登录后不再显示空白工作台
  > 验收：ops.demo 账号登录后工作台不报错，可进入操作日志页

- [>] **侧边栏 Logo 硬编码修复**（`default.vue` line 8）
  - 当前：`众维OA工作台`（硬编码）
  - 修复为：动态读取 company_name，与 `app.vue` 动态标题保持一致
  > 验收：初始化时企业名"博渊"，侧边栏 Logo 显示"博渊OA"

---

### A8 — 待浏览器验收（代码已有，无已知 gap）

以下页面代码已存在，目前未发现实现缺口，但尚未浏览器实测通过。完成 A1–A7 后统一走查。

- [?] 个人信息页 `/me` — 展示姓名/角色/手机号/部门
  > 验收：登录后头像菜单进入，信息正确显示

- [?] 修改密码页 `/me/password` — 旧密码验证 + 新密码确认
  > 验收：旧密码错误报错；修改成功后新密码可登录

- [?] 表单中心 `/forms` — 我的提交记录 + 审批历史
  > 验收：PM 可看到施工日志记录，点击查看审批历史 Timeline

- [?] 通讯录导入 `/directory` — CSV 预览 → 导入
  > 验收：粘贴 CSV 可预览，确认后显示导入成功

- [?] 岗位管理 `/positions` — 岗位 + 等级 CRUD
  > 验收：CEO 新建岗位并添加等级，员工创建时岗位下拉可选

- [?] 角色管理 `/role` — 内置角色 + 自定义角色 + 权限矩阵
  > 验收：CEO 可新建自定义角色并配置权限

- [?] 操作日志 `/operation-logs` — 分页查看 + 时间范围筛选
  > 验收：CEO 可查看日志列表，finance 访问返回无权限提示

- [?] 补贴配置 `/allowances` — 三级补贴定义与配置
  > 验收：finance 可创建补贴项并按全局/岗位/员工三级配置

- [?] 工作台首次登录密码提醒 — isDefaultPassword 横幅
  > 验收：新建员工初始密码登录，工作台顶部出现修改提醒横幅

- [?] 工作台活跃项目卡片可点击跳转
  > 验收：CEO 工作台点击活跃项目数字跳转到 /projects

- [?] 考勤驳回后重新发起 — REJECTED 记录显示驳回原因 + 重新发起按钮
  > 验收：请假被驳回后，我的记录中可看到驳回原因并重新发起（预填表单）

- [?] 施工日志模板 `/construction-log/templates` — 工作项模板 CRUD
  > 验收：PM 可新建工作项模板，填写施工日志时可从模板填入

- [?] 通知中心 `/notifications` — 分类 Tab + 标记已读
  > 验收：收到请假通过通知，可在通知中心查看并标记已读

- [?] 数据保留 `/retention` — 保留期配置与清理预览
  > 验收：CEO 可查看各类数据保留状态

---

### A10 — 手动测试发现缺陷修复（2026-04-17，共 25 条）

> 来源：`test/manual-test-2026-04-17/TEST_REPORT.md`。所有缺陷均经手动测试截图确认，按优先级排序。

#### P0 — 核心业务阻断（3条）

- [ ] **BUG-01 HR 角色无法读取员工与岗位数据**
  - `EmployeeController.java:44` `@PreAuthorize` 缺 `'HR'`；`PositionController.java` GET 端点同缺
  - 修复：两处注解追加 `'HR'`
  > 验收：HR 登录 `/employees` 可看到员工列表；新增员工弹框中部门/岗位下拉有数据

- [ ] **BUG-02 PM 角色无法读取团队成员数据**
  - `TeamController.java:35` `@PreAuthorize("hasRole('DEPARTMENT_MANAGER')")` 缺 `'PROJECT_MANAGER'`
  - 修复：改为 `hasAnyRole('DEPARTMENT_MANAGER','PROJECT_MANAGER')`
  > 验收：PM 访问 `/team` 可看到项目成员列表

- [ ] **BUG-03 报销类型接口 500，报销申请全程阻断**
  - `ExpenseController.java:41` 调 `expenseService.getExpenseTypes()` → 查 `expense_type_def` 表但表内无数据
  - 修复：`local/seed-data.sql` 补充报销类型记录（差旅费/餐饮费/办公耗材等）；如表结构缺失则补 DDL
  > 验收：任意角色访问 `/expense/apply` 报销类型下拉有选项

#### P1 — 接口缺失 / 权限泄露（4条）

- [ ] **BUG-04 系统配置页 3 个 Config API 404**
  - `SystemConfigController` 缺失：`GET/PUT /api/config/company-name`、`GET/PUT /api/config/payroll-cycle`、`GET/PUT /api/config/retention-period`
  - 修复：在 `SystemConfigController` 实现上述 6 个端点，读写 `system_config` 表对应 key
  > 验收：CEO `/config` 三个配置区域均可加载并保存

- [ ] **BUG-05 / BUG-06 请假类型 404，考勤请假 Tab 与假期配额页全失效**
  - `LeaveTypeController` 已实现，但后端运行中 JAR 为旧版（需重启）；`local/seed-data.sql` 无 `leave_type_def` 记录
  - 修复：① 重启后端服务；② `local/seed-data.sql` 补充年假/病假/事假/婚假/产假等初始数据
  > 验收：所有角色 `/attendance` 假种下拉有选项；HR `/leave-types` 列表有数据

- [ ] **BUG-E02 Employee 角色可完整访问 `/data-export`（前端权限泄露）**
  - `auth.global.ts:12` `PAGE_ACCESS` 白名单中无 `/data-export` 条目；未列出的路由默认对已登录用户全开
  - 修复：`auth.global.ts` 追加 `'/data-export': ['ceo']`，同时补全 `/data-viewer': ['ceo']`
  > 验收：employee 直接访问 `/data-export` 被重定向到首页

#### P2 — 权限 / 路由 / 错误提示（8条）

- [ ] **BUG-07 HR 侧边栏缺少「假期配额管理」入口**
  - `default.vue` `ROLE_MENUS.hr` 缺 `/leave-types` 菜单项
  > 验收：HR 登录侧边栏可见"假期配额管理"

- [ ] **BUG-08 Worker 侧边栏缺少「考勤管理」入口**
  - `default.vue` `ROLE_MENUS.worker` 缺 `/attendance` 菜单项
  > 验收：Worker 登录侧边栏可见"考勤申请"

- [ ] **BUG-09 角色管理页仅显示 5 个角色（缺 hr / department_manager）**
  - `GET /api/roles` 查询条件过滤，或 seed-data 中这两个角色 `status` 值不正确；待代码排查
  > 验收：CEO `/role` 显示至少 7 个内置角色

- [ ] **BUG-10 CEO 侧边栏缺少 3 个独有功能入口**
  - `default.vue` `ROLE_MENUS.ceo` 缺 `/attendance`、`/data-export`、`/data-viewer`
  > 验收：CEO 侧边栏可见数据导出、数据文件查看、考勤管理三项

- [ ] **BUG-11 HR 访问 `/payroll` 被重定向到首页**
  - `auth.global.ts:23` `'/payroll': ['ceo', 'finance', 'worker', 'employee']` 缺 `'hr'`（需产品确认 HR 是否应可访问）
  > 验收：确认后修复或明确排除

- [ ] **BUG-12 Finance 工伤页面"加载记录失败" Toast**
  - `GET /api/logs/records` 对应 controller `@PreAuthorize` 缺 `'FINANCE'`
  > 验收：Finance 访问 `/injury` 可看到工伤申报列表

- [ ] **BUG-13 工作台待办/员工总数对多角色报 403，角标恒为 0**
  - `FormController.java:38` `GET /forms/todo` 缺 `'HR'`、`'EMPLOYEE'`、`'WORKER'`；`EmployeeController.java:44` 同缺 HR 等
  - 修复：两处注解补全所有应有角色
  > 验收：dept_manager/HR/employee/worker 工作台顶部待办角标显示真实数值

- [ ] **BUG-E03 修改密码错误提示暴露原始 HTTP 错误字符串**
  - `pages/me/password.vue` catch 块中 `error.toString()` 直接用于 Toast
  - 修复：`message.error(error.data?.message || '密码修改失败，请检查当前密码是否正确')`
  > 验收：输入错误当前密码，Toast 显示业务语言而非"[POST] /api/... 400 Bad Request"

#### P3 — 种子数据 / 前端校验轻微问题（10条）

- [ ] **BUG-14 岗位管理无种子数据** — `local/seed-data.sql` 补 3–5 条 position 记录
- [ ] **BUG-15 补贴配置无种子数据** — `local/seed-data.sql` 补 allowance_def 记录
- [ ] **BUG-16 CEO 考勤「我的记录」为空** — `local/seed-data.sql` 为 ceo.demo 补考勤记录
- [ ] **BUG-17 数据查看器文件格式描述错误** — 页面提示"上传 .zip"，应为".obk"（DESIGN.md §10.3）
- [ ] **BUG-18 Finance 侧边栏含「通讯录导入」入口（待产品确认是否应删除）**
- [ ] **BUG-E01 初始化向导 CEO 手机号无格式校验** — `pages/setup/index.vue` 追加 `/^1[3-9]\d{9}$/` 正则校验
- [ ] **BUG-E04 新增员工身份证号无格式校验** — `pages/employees/index.vue` 追加 18 位格式规则
- [ ] **BUG-E05 密码策略不一致（setup ≥8位 vs change ≥6位）** — `pages/me/password.vue` 中 `min: 6` 改为 `min: 8`
- [ ] **BUG-E06/E07 报销明细金额接受负数和零** — `pages/expense/apply/index.vue` 金额输入框追加 `:min="0.01"`

---

## Phase A 验收检查点

完成所有 A1–A8 任务后，逐角色执行以下端到端走查，全部通过后 Phase A 结束：

| 角色 | 检查点 |
|------|--------|
| CEO | 全菜单无死链；/config 可编辑企业名/发薪日/假期配额；/positions /role /operation-logs 可正常使用；工作台待办角标有值 |
| HR | /employees 可创建含部门/岗位/等级/直系领导的员工；/org 可配置汇报关系；/leave-types 可管理假期类型 |
| Finance | 岗位薪资配置和社保配置可访问；/payroll 可走完"创建周期→结算→发放"全流程；/expense 报销审批可操作 |
| PM | /projects/[id] 六个 Tab（里程碑/成本/营收/施工日志审批/第二角色/售后）均可打开并操作；待办中心考勤审批可通过/驳回 |
| Employee | /attendance 请假附件可上传，时长自动计算；/payroll 可查看并确认工资条；/expense 可提交含发票的报销 |
| Worker | /attendance 可提交请假；/injury 三字段表单可提交；/construction-log 工长可填施工日志 |
| DeptManager | 顶部待办角标显示待审批数；/attendance 可发起加班通知；/todo 考勤审批可操作 |

---

## Phase A — 测试补全（Web 端可上线标准）

> **前置条件**：Phase A 功能任务（A1–A10）代码完成后执行。  
> **目标**：覆盖核心业务链路 E2E、关键 CRUD、主要表单边界、文件上传、后端权限双层验证，达到 Web 端可上线测试标准。  
> **分工**：Kimi CLI 编写测试代码；Claude 逐条验收测试的准确性和覆盖深度（逐步核查断言是否覆盖需求、是否使用真实 DOM/HTTP，不接受空洞断言）。  
> **测试框架**：UI/E2E 用 Playwright CLI（`test/e2e/`），API 测试用 Vitest（`test/integration/`）。  
> **设计文档**：完整测试用例见 `test/TEST_DESIGN.md`（主文档）、`test/e2e/TEST_DESIGN.md`（E2E 用例详情）。

---

### T0 — API 集成测试扩展（`test/integration/api.test.ts`）

> 当前覆盖：M0 基础设施、M1 认证+员工、M2 组织+项目+操作日志、V5 补贴+薪资开关。  
> 以下为**缺失模块**，须扩展至同一文件。

- [ ] **假期类型 API**（HR 权限）
  - `GET /config/leave-types` → 200，数组
  - `POST /config/leave-types`（HR token）→ 201；（worker token）→ 403
  - `DELETE /config/leave-types/{id}`（HR token）→ 200
  > 验收：三条用例全部通过，验证假期类型 CRUD 权限控制

- [ ] **考勤/请假 API**
  - `POST /attendance/leave`（employee token，有效数据）→ 200，返回 formId
  - `POST /attendance/leave`（缺必填字段 leaveType）→ 400
  - `GET /attendance/records`（employee token）→ 200，仅含本人记录
  - `GET /attendance/records`（CEO token）→ 200，含全员记录
  > 验收：数据隔离验证（employee 看不到他人请假）

- [ ] **报销 API**
  - `GET /expense/types`（任意已登录 token）→ 200，数组非空
  - `POST /expense`（employee token，含 amount 字段）→ 201
  - `GET /expense/records`（employee token）→ 200，仅本人
  - `GET /expense/records`（finance token）→ 200，全员
  - `POST /expense/{id}/approve`（finance token，action=APPROVE）→ 200
  - `POST /expense/{id}/approve`（employee token）→ 403
  > 验收：报销审批权限双层验证（前后端）

- [ ] **工伤 API**
  - `POST /injury`（worker token，含必填字段）→ 200，含 formId
  - `GET /injury`（finance token）→ 200
  - `PUT /injury/{id}/compensation`（finance token，amount=5000）→ 200
  - `PUT /injury/{id}/compensation`（worker token）→ 403
  > 验收：工伤理赔仅财务可录入

- [ ] **系统配置 API**（CEO 专属）
  - `GET /config/company-name`（CEO token）→ 200，含 value 字段
  - `PUT /config/company-name`（CEO token，value='测试企业'）→ 200
  - `PUT /config/company-name`（HR token）→ 403
  - `GET /config/payroll-cycle`（CEO token）→ 200
  - `PUT /config/payroll-cycle`（CEO token）→ 200
  - `GET /config/retention-period`（CEO token）→ 200
  > 验收：6 条用例全通过，配置读写权限隔离正确

- [ ] **权限越权直调**（≥15 条）
  - employee → `GET /employees` → 403
  - worker → `GET /payroll/cycles` → 403
  - employee → `GET /operation-logs` → 403
  - employee → `DELETE /employees/1` → 403
  - worker → `POST /payroll/cycles` → 403
  - hr → `PUT /config/payroll-cycle` → 403（如 CEO 专属）
  - finance → `GET /config/company-name`（如 CEO 专属）→ 403
  - worker → `GET /expense/records` → 403（finance 专属列表）
  - worker → `POST /injury/{id}/compensation` → 403
  - employee → `GET /roles` as admin-op → 验证返回非 403（普通查看）
  > 验收：每个高敏感接口独立验证后端权限，不依赖前端路由守卫

- [ ] **密码变更 API**
  - `POST /auth/change-password`（正确旧密码，新密码≥8位）→ 200
  - `POST /auth/change-password`（错误旧密码）→ 400
  - `POST /auth/change-password`（新密码5位）→ 400
  > 验收：对应 BUG-E05 修复的回归测试

- [ ] **薪资结算链路 API**
  - `POST /payroll/cycles`（finance）→ 201，status=OPEN
  - `PUT /payroll/cycles/{id}/settle`（finance）→ 200，cycle.status=SETTLED
  - `GET /payroll/slips?cycleId={id}`（employee token，本人）→ 200，仅本人工资条
  - `POST /payroll/slips/{id}/confirm`（employee token）→ 200
  > 验收：薪资发放主链 API 层验证通过

---

### T1 — E2E 核心审批链

- [ ] **请假审批完整流程**（`test/e2e/leave_flow.js`）
  - 场景：employee.demo 提交请假申请（明天起 2 天年假，填写原因）→ dept_manager.demo 在待办中心审批通过 → employee 查看记录状态
  - 断言 1：提交后 employee 我的记录出现新记录，状态为"审批中"
  - 断言 2：dept_manager 待办列表出现该申请
  - 断言 3：审批通过后 employee 记录状态变为"已通过"，审批时间线显示审批人姓名
  > 验收：Claude 检查 — 三个断言均检查具体 DOM 文本（不接受仅 `expect(true).toBe(true)` 类型断言）；测试通过率 100%；`yarn playwright test test/e2e/leave_flow.js` 可独立运行

- [ ] **报销审批完整流程**（`test/e2e/expense_flow.js`）
  - 场景：employee.demo 提交报销申请（差旅费 500 元，上传测试用 JPG 图片作为发票，选择关联项目）→ finance.demo 审批通过 → employee 查看记录
  - 断言 1：不上传发票无法提交（Toast 含"请上传"字样）
  - 断言 2：提交成功后 finance 报销审批列表可见该记录，金额/类型正确
  - 断言 3：finance 审批通过后 employee 记录状态变为"已通过"
  > 验收：Claude 检查 — 包含文件上传交互；断言 1 验证必填拦截；断言 2/3 验证跨角色数据可见性

- [ ] **加班申报审批流程**（`test/e2e/overtime_flow.js`）
  - 场景：employee.demo 提交加班申报（今日，2 小时，加班时长字段自动显示）→ dept_manager.demo 审批通过
  - 断言 1：选择开始/结束时间后加班时长自动计算并显示（非空）
  - 断言 2：审批通过后记录状态变为"已通过"
  > 验收：Claude 检查 — 断言 1 验证自动计算字段（对应 A3 补全任务）；与 leave_flow 相同的状态验证深度

- [ ] **申请驳回后重新提交**（`test/e2e/rejection_resubmit.js`）
  - 场景：employee 提交请假 → dept_manager 驳回（填写驳回原因"时间冲突"）→ employee 查看驳回原因并点击重新发起 → 修改日期后提交
  - 断言 1：驳回后 employee 记录显示驳回原因文本"时间冲突"
  - 断言 2：重新发起后是新的申请记录（ID 不同），状态为"审批中"
  > 验收：Claude 检查 — 断言 1 验证 DOM 中驳回原因可读；断言 2 通过记录数量或 ID 变化验证新建而非修改

- [ ] **施工日志提交和 PM 审批**（`test/e2e/construction_log_flow.js`）
  - 场景：worker.demo 提交施工日志（包含工作项和工作量）→ pm.demo 在项目详情"施工日志审批"Tab 通过
  - 断言 1：worker 日志列表出现新记录，状态为待审核
  - 断言 2：pm 施工日志审批 Tab 可见该日志
  - 断言 3：审批通过后 worker 日志状态更新
  > 验收：Claude 检查 — 覆盖 A5 施工日志审批修复（construction_log 审批按钮补全后才能通过）

---

### T2 — 薪资发放主链 E2E

- [ ] **薪资周期完整流程**（`test/e2e/payroll_cycle_flow.js`）
  - 步骤 1：finance.demo 创建薪资周期（当月）→ 断言周期状态为"窗口开放"
  - 步骤 2：employee.demo 确认本月出勤（或工资单出现）
  - 步骤 3：finance.demo 关闭窗口并结算 → 断言周期状态变为"已结算"
  - 步骤 4：employee.demo 查看工资单并点击确认签收 → 断言签收成功（工资单出现签收标记）
  - 步骤 5：employee.demo 工资单金额 > 0（底薪已正确计入）
  > 验收：Claude 检查 — 4 步状态断言均有；步骤 5 金额断言防止"结算为 0"的隐性 bug

---

### T3 — CRUD 正向路径

- [ ] **员工管理 CRUD**（`test/e2e/employee_crud.js`）
  - 创建：HR 填写所有必填字段（姓名/性别/部门/岗位/等级/角色）→ 断言员工列表出现新员工，工号非空
  - 修改：修改该员工的部门 → 断言详情页显示新部门名
  - 停用：点击停用 → 断言该员工账号尝试登录被拒绝（返回 401/403 或登录页报错）
  > 验收：Claude 检查 — 停用验证必须真实登录尝试，不接受仅检查状态标签文字

- [ ] **岗位与薪级 CRUD**（`test/e2e/position_crud.js`）
  - 创建岗位"测试岗 T"，添加等级"初级"底薪 5000
  - 断言：列表出现"测试岗 T"；等级列表出现"初级 5000"
  - 删除有在职员工的岗位 → 断言弹出拦截提示（不可删除）
  > 验收：Claude 检查 — 约束删除场景断言必须验证提示文本（防止后端未做约束校验就静默删除）

- [ ] **假期类型 CRUD**（`test/e2e/leave_type_crud.js`）
  - HR 创建"调休假"（配额 3 天，不扣款）→ 断言列表出现"调休假"
  - employee 进入请假申请，假种下拉 → 断言选项中包含"调休假"
  > 验收：Claude 检查 — 验证前后端联动：新建假期类型后员工端下拉立即可选，覆盖 A1 `/leave-types` 任务

- [ ] **项目与里程碑 CRUD**（`test/e2e/project_crud.js`）
  - CEO 创建项目（含客户名称/合同编号，上传合同附件）→ 断言项目详情各字段正确显示、附件链接可访问
  - 添加里程碑（名称/截止日期/权重 30%）→ 断言里程碑列表出现新条目
  - 修改里程碑进度为 50% → 断言进度条/进度值更新
  > 验收：Claude 检查 — 合同附件验证覆盖 A5 字段补全；进度修改断言防止"更新成功但页面不刷新"的问题

---

### T4 — 文件上传专项

- [ ] **报销发票上传边界**（`test/e2e/expense_upload.js`）
  - 场景 A（必填拦截）：不上传任何发票直接提交 → 断言 Toast/表单报错含"发票"字样
  - 场景 B（有效上传）：上传有效 JPG（< 5MB）→ 预览出现缩略图，提交后详情中可见发票
  - 场景 C（数量上限）：若有上传数量限制则上传超量 → 断言拦截提示
  > 验收：Claude 检查 — 场景 B 需验证服务端存储成功（提交后从详情页可访问到上传的附件，非仅前端预览）

- [ ] **工伤申报附件上传**（`test/e2e/injury_attachment.js`）
  - 依照 DESIGN.md §7.4 确认附件是否为必填
  - 场景 A：若必填 → 不上传无法提交，断言校验提示
  - 场景 B：上传 PDF 附件，提交成功 → 详情可查看附件
  > 验收：Claude 核查 DESIGN.md §7.4 对附件要求的描述，场景 A 断言与设计文档要求一致

---

### T5 — 表单边界补充

- [ ] **日期边界校验**（`test/e2e/date_boundaries.js`）
  - 请假结束日期早于开始日期 → 断言无法提交，显示日期校验提示
  - 加班申报超出窗口期日期 → 断言被后端拒绝（若后端有窗口期限制则验证 4xx 响应）
  > 验收：Claude 检查 — 每个场景断言明确错误提示文本；若为后端拦截则验证 Toast 不是原始 HTTP 错误字符串

- [ ] **数字计算与零值校验**（`test/e2e/calculation_accuracy.js`）
  - 报销明细多行自动汇总：添加 3 行明细（100/200/300）→ 断言总金额字段显示 600
  - 零金额拦截：报销金额填 0 → 断言无法提交（修复 BUG-F_X03 后此用例应通过）
  - 负数金额拦截：报销金额填 -100 → 断言无法提交（修复 BUG-F_X02 后此用例应通过）
  > 验收：Claude 检查 — 汇总断言需读取 DOM 实际数值而非仅验证字段存在；零值和负数场景是对应 bug 的回归测试

---

### T6 — 权限安全补充

- [ ] **后端 API 越权直调**（`test/integration/api_escalation.test.ts`）
  - 使用 employee JWT 直接调用 `GET /api/employees`（仅 HR/CEO 权限）→ 断言返回 403
  - 使用 worker JWT 直接调用 `GET /api/payroll/cycles`（仅 Finance/CEO 权限）→ 断言返回 403
  - 使用 employee JWT 直接调用 `GET /api/operation-logs`（仅 CEO 权限）→ 断言返回 403
  - 至少覆盖 5 个高敏感接口，每个接口测试 2 个无权角色
  - 不依赖前端路由守卫，使用真实 HTTP 请求独立验证后端权限层
  > 验收：Claude 检查 — 扩展现有 `test/integration/api.test.ts`（同一 Vitest 运行器）；`yarn test:integration` 全部通过；越权场景全部 403，无遗漏

- [ ] **密码修改错误提示回归**（`test/e2e/password_error_toast.js`）
  - 输入正确工号、错误当前密码，点击提交
  - 断言：Toast 文本为"当前密码不正确"或类似业务语言（不接受"[POST] /api/... 400 Bad Request"格式）
  - 验证 BUG-E03（`pages/me/password.vue` catch 块）修复后此用例通过
  > 验收：Claude 检查 — Toast 文本断言用正则或精确匹配，明确排除 HTTP 状态码格式字符串

---

### 测试补全验收检查点（Claude 验收标准）

完成 T0–T6 全部任务后，Claude 按以下维度验收，全部通过后测试补全阶段结束：

| 类别 | 验收项 | 最低通过标准 |
| --- | --- | --- |
| API 集成 | T0 所有用例 `yarn test:integration` 通过 | 覆盖假期/报销/工伤/配置/权限 |
| E2E 审批链 | T1 五条跨角色流程全部运行通过 | `pass: true` for all cases |
| E2E 薪资主链 | T2 四步状态断言全部通过 | 包含金额 > 0 断言 |
| CRUD | T3 四个模块均创建+查询通过 | 停用后登录验证通过 |
| 文件上传 | 报销必填拦截 + 有效上传 + 详情可查看 | 服务端存储验证通过 |
| 表单边界 | 日期倒序/零金额/负数金额均有校验 | 对应 bug 回归测试通过 |
| 后端安全 | API 越权直调 ≥15 个用例 | 全部返回 403 |
| 错误提示 | 密码修改 Toast 无 HTTP 格式字符串 | 业务语言断言通过 |

---

## Phase B — 生产部署验证（Phase A 全部通过后启动）

> **前置条件**：Phase A 验收检查点（含 A1–A10 功能修复、T0–T6 测试通过、7 角色浏览器走查）全部完成。  
> **Phase B 仅负责真实上线部署测试，所有功能开发与预上线测试均在 Phase A 完成。**

### B1 — 生产环境验证（原 B2）

- [ ] **Docker 构建测试**：`docker build -t boyuan-oa .` 成功，`/actuator/health` 返回 UP
- [ ] **PostgreSQL 迁移验证**：`-Dspring.profiles.active=prod` 启动，Flyway 迁移无报错，种子账号可登录
- [ ] **版本号注入**：git tag → JAR manifest + 前端 VITE_APP_VERSION
- [ ] **生产环境 7 角色浏览器走查**（在真实服务器上重跑 Phase A 验收检查点）

---

## Phase C — 微信小程序（Phase B 完成后启动）

> 启动条件：Phase B 全部完成，web+后端已在生产环境运行稳定。

### C1 — 前置清理

- [ ] 清理 `app/mp/src/pages.json`：仅保留 6 个入口（登录、工作台、待办、考勤、项目、忘记密码）
- [ ] 审查并清理 `app/mp/src/` 中残留的 `#ifdef H5` 条件编译块

### C2 — 核心页面

- [ ] 登录页：手机号/密码登录，token 写入 uni storage
- [ ] 工作台：动态菜单卡片（按角色），未读待办徽章
- [ ] 待办页：待审批列表，支持通过/驳回操作
- [ ] 考勤页：请假/加班申请入口，本月记录展示
- [ ] 项目页：项目列表，PM 查成员，劳工填施工日志
- [ ] 忘记密码：完整 4 步流程

### C3 — 验收测试

- [ ] TC-MP-01：各角色登录后菜单与权限一致
- [ ] TC-MP-02：提交请假后审批人待办出现，操作后状态同步
- [ ] TC-MP-03：施工日志（worker）可提交

---

## 已完成（Phase 0 + A9 历史记录）

M0 基础设施 / M1 身份认证 / M2 组织管理 / M3 审批流引擎 / M4 考勤模块 / M5 薪资模块（含签名/PDF/社保分叉） / V5 薪资构成扩展 / V6 薪资更正流程 / V7–V10 第二角色/售后/物资/营收/保险/施工考勤/审计/部门经理 / M6 项目管理 / M8 施工&工伤 / M9 通知&工作台 / M10 数据生命周期 / M11 CI/CD+部署脚本+Dockerfile / M12 初始化向导 / 动态页面标题 / Dev tools 鉴权修复

**A9 已完成后端接口**（原 A9 节，删除以保持 TODO 只列待开发任务）：  
`POST /auth/change-password`（旧密码验证+更新）、`GET /auth/me`（含isDefaultPassword）、`GET /operation-logs`（分页，CEO专属）、`@OperationLogRecord` 注解接入关键业务方法（审批/结算/员工更新/签名绑定）。

> 代码验证日期：2026-04-16（核心逻辑均在代码中确认，但 Phase A 功能完整性存在上述缺口）

---

## Phase D — 部署与发布（Phase C 完成后启动）

> 启动条件：Phase C（微信小程序）全部完成，系统整体经过端到端验收。

### D1 — 基础设施准备

- [ ] 选定服务器方案：云主机/VPS（Ubuntu 22.04 推荐）+ 域名 + HTTPS 证书
- [ ] 配置生产环境变量：DB_URL / DB_USERNAME / DB_PASSWORD / JWT_SECRET / APP_SIGNATURE_AES_KEY
- [ ] 创建 PostgreSQL 数据库，确认 Flyway V1–V9 迁移在 prod profile 下自动执行

### D2 — 部署方案设计

- [ ] 确定后端部署方式（Docker Compose / 裸 JAR + systemd / 云平台容器），编写部署脚本
- [ ] 确定 H5 前端托管方式（Nginx 静态文件 / CDN），配置 /api/ 反向代理
- [ ] 确定小程序服务器域名白名单配置（微信公众平台合法域名）

### D3 — 上线验证

- [ ] 生产环境健康检查：/actuator/health 返回 UP
- [ ] 7 个角色全菜单走查（与 Phase B B1 相同，在生产环境重跑）
- [ ] 配置日志采集方案（日志级别、持久化位置、轮转策略）
