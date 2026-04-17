# 博渊OA 测试报告 — 2026-04-17

**环境：** `localhost:4134`（Nuxt H5）+ `localhost:8080`（Spring Boot + H2）  
**工具：** Playwright Chromium，无头模式，视口 1440×900  
**轮次：** Round 1 正向全流程 · Round 2 边界/异常/越权

---

## 一、测试用例

### 1.1 系统初始化（Setup Wizard）

- **S01** 未初始化访问 `/` → ✅ 跳转 `/setup`
- **S02** 未初始化访问 `/login` → ✅ 跳转 `/setup`
- **S03** 第1步空提交 → ✅ Toast "请输入CEO姓名"
- **S04** 只填姓名不填手机 → ✅ Toast "请输入CEO手机号"
- **S05** 密码输入3位 → ✅ Toast "密码至少8位"
- **S06** 两次密码不一致 → ✅ Toast "两次输入的密码不一致"
- **S07** 手机号输入字母字符串 "abcdefghijk" → ❌ 无提示，直接进入第2步（**→ BUG-E01**）
- **S08** 填写有效CEO信息 → ✅ 进入HR账号步骤
- **S09** 填写HR信息 → ✅ 进入可选人员步骤
- **S10** 可选人员步骤点击跳过 → ✅ 进入确认信息页
- **S11** 确认信息页提交 → ✅ 进入恢复码页（截图 `edge_010_S11_step4_submit.png` 确认，脚本时序误报）
- **S12–S18** 恢复码复选框门控、步骤6–10跳过流程、完成初始化 → **未执行**（受 S11 误报影响跳过）

---

### 1.2 登录 / 认证

- **L01** 空用户名 + 空密码提交 → ✅ 前端拦截，2个表单错误
- **L02** 空用户名 + 有效密码提交 → ✅ 前端拦截
- **L03** 有效用户名 + 空密码提交 → ✅ 前端拦截
- **L04** 不存在的用户名登录 → ✅ 被拒绝，页面内显示错误提示
- **L05** 正确用户名 + 错误密码登录 → ✅ 被拒绝
- **L06** 用户名输入 SQL 注入（`' OR '1'='1' --`）→ ✅ 被拒绝，无绕过
- **L07** 用户名输入 XSS 字符串（`<script>alert('xss')</script>`）→ ✅ 被拒绝，无绕过
- **L08** 用户名输入 300 字符超长字符串 → ✅ 被拒绝
- **L09** ceo.demo / 123456 正常登录 → ✅ 进入工作台
- **L10** 未登录直接访问 `/employees` → ✅ 跳转 `/login`

---

### 1.3 角色正向访问（Round 1 全页面覆盖）

#### CEO（17 个页面）

- `/` 工作台 → ✅ 正常
- `/employees` 员工管理 → ✅ 7名员工，搜索可用
- `/org` 组织架构 → ✅ 双面板汇报关系树
- `/positions` 岗位管理 → ✅ 页面加载，表格空（**→ BUG-14**）
- `/allowances` 补贴配置 → ✅ 页面加载，表格空（**→ BUG-15**）
- `/role` 角色管理 → ✅ 页面加载，仅显示5个角色（**→ BUG-09**）
- `/config` 系统配置 → ✅ 页面结构完整，3个API返回404（**→ BUG-04**）
- `/projects` 项目管理 → ✅ 2个项目正常显示
- `/payroll` 薪资管理 → ✅ 2026-05周期"待处理"
- `/construction-log` 施工日志 → ✅ 列表正常
- `/injury` 工伤补偿 → ✅ 正常
- `/expense/apply` 报销申请 → ✅ 页面结构完整，报销类型500（**→ BUG-03**）
- `/expense/records` 报销记录 → ✅ 正常
- `/attendance` 考勤管理 → ✅ 结构完整，请假类型404（**→ BUG-05**），我的记录空（**→ BUG-16**）
- `/data-export` 数据导出 → ✅ 结构完整
- `/data-viewer` 历史数据 → ✅ 页面加载，文件格式描述错误（**→ BUG-17**）
- `/operation-logs` 操作日志 → ✅ 正常
- `/me/password` 修改密码 → ✅ 正常
- 侧边栏 → ⚠️ 缺 `/attendance`、`/data-export`、`/data-viewer` 入口（**→ BUG-10**）

#### HR（9 个页面）

- `/` 工作台 → ✅ 加载，待办/员工数403（**→ BUG-13**）
- `/employees` 员工管理 → ✅ 页面加载，列表空白403（**→ BUG-01**）
- `/leave-types` 假期配额管理 → ✅ 页面结构存在，数据404（**→ BUG-06**）
- `/attendance` 考勤管理 → ✅ 页面加载，请假类型404（**→ BUG-05**）
- `/directory` 通讯录导入 → ✅ 页面加载，导入接口403
- `/positions` 岗位管理 → ✅ 页面加载，数据403（**→ BUG-01** 附带）
- `/payroll` 薪资管理 → ❌ 被重定向到首页（**→ BUG-11**）
- `/forms` 表单中心 → ✅ 页面加载，数据403
- `/me` 个人中心 → ✅ 页面加载，403
- 侧边栏 → ⚠️ 缺 `/leave-types` 入口（**→ BUG-07**）

#### Finance（6 个页面）

- `/` 工作台 → ✅ 正常
- `/expense/records` 报销记录 → ✅ 正常
- `/payroll` 薪资管理 → ✅ 正常
- `/injury` 工伤补偿 → ✅ 页面加载，显示"加载记录失败"Toast（**→ BUG-12**）
- `/forms` 表单中心 → ✅ 正常
- `/me` 个人中心 → ✅ 正常
- 侧边栏 → ⚠️ 含"通讯录导入"入口（待确认，**→ BUG-18**）

#### PM（7 个页面）

- `/` 工作台 → ✅ 正常
- `/projects` 项目管理 → ✅ 正常
- `/construction-log` 施工日志 → ✅ 列表正常，有"填写日志"按钮
- `/team` 团队成员 → ✅ 页面加载，数据空403（**→ BUG-02**）
- `/forms` 表单中心 → ✅ 正常
- `/attendance` 考勤管理 → ✅ 页面加载，请假类型404（**→ BUG-05**）
- `/me` 个人中心 → ✅ 正常

#### 部门经理（5 个页面）

- `/` 工作台 → ✅ 加载，待办数403（**→ BUG-13**）
- `/team` 团队成员 → ✅ 正常
- `/attendance` 考勤管理 → ✅ 页面加载，请假类型404（**→ BUG-05**）
- `/forms` 表单中心 → ✅ 正常
- `/me` 个人中心 → ✅ 正常

#### Employee（5 个页面）

- `/` 工作台 → ✅ 加载，待办/员工数403（**→ BUG-13**）
- `/attendance` 考勤管理 → ✅ 页面加载，请假类型404（**→ BUG-05**）
- `/expense/apply` 报销申请 → ✅ 页面结构完整，报销类型500（**→ BUG-03**）
- `/forms` 表单中心 → ✅ 页面加载，403
- `/me` 个人中心 → ✅ 页面加载，403

#### Worker（4 个页面）

- `/` 工作台 → ✅ 加载，待办/员工数403（**→ BUG-13**）
- `/attendance` 考勤管理 → ✅ 页面加载，请假类型404（**→ BUG-05**）
- `/forms` 表单中心 → ✅ 页面加载，403
- `/me` 个人中心 → ✅ 页面加载，403
- 侧边栏 → ⚠️ 缺 `/attendance` 入口（**→ BUG-08**）

---

### 1.4 权限越权测试（employee 角色）

- `/operation-logs` → ✅ 被拦截，跳转首页
- `/config` → ✅ 被拦截，跳转首页
- `/role` → ✅ 被拦截，跳转首页
- `/data-export` → ❌ 页面完整加载，未被拦截（**→ BUG-E02**）
- `/employees` → ✅ 被拦截，跳转首页

---

### 1.5 表单边界值

#### 修改密码（/me/password，CEO 账号）

- **F_P01** 空提交 → ✅ 3个必填表单错误
- **F_P02** 错误当前密码提交 → ❌ Toast 暴露原始 HTTP 错误（**→ BUG-E03**）
- **F_P03** 两次新密码不一致 → ✅ 表单错误"两次输入的密码不一致"
- **F_P04** 新密码输入3位 → ✅ 提示"密码长度至少6位"，但初始化要求8位（**→ BUG-E05**）

#### 新增员工（/employees，CEO 账号）

- **F_E01** 空提交 → ✅ Toast "请填写姓名"
- **F_E02** 身份证号输入5位"12345" → ❌ 无身份证格式校验（**→ BUG-E04**）
- **F_E03** 姓名输入 `<script>alert('xss')</script>` → ℹ️ 前端接受原始字符串，依赖后端转义

#### 费用报销申请（/expense/apply，employee 账号）

- **F_X01** 空提交 → ✅ 6个必填表单错误
- **F_X02** 明细金额输入 `-100` → ❌ 前端接受负数（**→ BUG-E06**）
- **F_X03** 明细金额输入 `0` 提交 → ❌ 无"金额须大于0"校验（**→ BUG-E07**）
- **F_X04** 明细金额输入 `9999999999` → ℹ️ 前端接受，需后端校验

#### 请假申请（/attendance，employee 账号）

- **F_A01** 空提交 → ✅ 4个必填表单错误（假种/开始日期/结束日期/原因）

---

## 二、问题报告与代码定位

### P0 — 核心业务阻塞

---

#### BUG-01 HR 角色无法读取员工与岗位数据

- **现象：** HR 访问 `/employees` 列表空白；新增员工弹框中岗位/部门下拉无数据
- **根因：**
  - [`EmployeeController.java:44`](../server/src/main/java/com/oa/backend/controller/EmployeeController.java#L44) `@PreAuthorize("hasAnyRole('CEO','FINANCE','PROJECT_MANAGER')")` — 缺 `'HR'`
  - [`EmployeeController.java:73`](../server/src/main/java/com/oa/backend/controller/EmployeeController.java#L73) 同上
  - `PositionController.java` GET 端点 `@PreAuthorize` — 同样缺 `'HR'`（待确认行号）
- **修复：** 两处注解追加 `'HR'`

---

#### BUG-02 PM 角色无法读取团队成员数据

- **现象：** PM 访问 `/team`，数据区域空白
- **根因：**
  - [`TeamController.java:35`](../server/src/main/java/com/oa/backend/controller/TeamController.java#L35) `@PreAuthorize("hasRole('DEPARTMENT_MANAGER')")` — 缺 `'PROJECT_MANAGER'`
- **修复：** 改为 `hasAnyRole('DEPARTMENT_MANAGER','PROJECT_MANAGER')`

---

#### BUG-03 报销类型接口 500，报销申请全程阻断

- **现象：** 所有角色 `/expense/apply` 报销类型下拉空
- **根因：**
  - [`ExpenseController.java:41`](../server/src/main/java/com/oa/backend/controller/ExpenseController.java#L41) 调用 `expenseService.getExpenseTypes()`
  - `getExpenseTypes()` 查询 `expense_type_def` 表
  - `local/seed-data.sql` 无任何 `expense_type_def` 记录，H2 表空或不存在，MyBatis-Plus 抛出异常
- **修复：** `local/seed-data.sql` 补充报销类型记录（差旅费/餐饮费/办公耗材等）；如表结构缺失，`V1__init_schema.sql` 补 DDL

---

### P1 — 接口缺失

---

#### BUG-04 系统配置页 3 个 Config API 404

- **现象：** CEO `/config` 企业名称、薪资周期、数据保留期区域加载失败
- **根因：** `SystemConfigController` 未实现以下端点
  - `GET/PUT /api/config/company-name`
  - `GET/PUT /api/config/payroll-cycle`
  - `GET/PUT /api/config/retention-period`
- **修复：** 在 `SystemConfigController` 中实现上述6个端点，读写 `system_config` 表对应 key

---

#### BUG-05 请假类型 404，所有角色考勤请假 Tab 失效

- **现象：** 所有角色 `/attendance` 假种下拉空
- **根因：**
  - [`LeaveTypeController.java:31`](../server/src/main/java/com/oa/backend/controller/LeaveTypeController.java#L31) Controller 已实现，但后端服务未重启，运行中的 JAR 为旧版
  - `local/seed-data.sql` 无 `leave_type_def` 记录
- **修复：** ① 重启后端服务；② `local/seed-data.sql` 补充请假类型（年假/病假/事假/婚假等）

---

#### BUG-06 假期配额管理页数据 404

- **根因：** 与 BUG-05 同源 — [`LeaveTypeController.java:46`](../server/src/main/java/com/oa/backend/controller/LeaveTypeController.java#L46) `GET /all` 需重启后端

---

#### BUG-E02 Employee 角色可完整访问 `/data-export`（权限泄露）

- **现象：** 员工 `employee.demo` 直接访问数据导出页，页面完整加载可操作（截图 `edge_024_L11_escalation_data-export.png`）
- **根因：**
  - [`auth.global.ts:12`](../app/h5/middleware/auth.global.ts#L12) `PAGE_ACCESS` 白名单中无 `/data-export` 条目
  - 白名单逻辑：未列出的路由对所有已登录用户开放（见文件第9–10行注释）
- **修复：** `auth.global.ts` 追加 `'/data-export': ['ceo']`

---

### P2 — 权限 / 路由 / 错误提示

---

#### BUG-07 HR 侧边栏缺少「假期配额管理」入口

- **根因：** [`default.vue`](../app/h5/layouts/default.vue) `ROLE_MENUS.hr` 数组中缺少 `/leave-types` 菜单项（需核查当前行）

---

#### BUG-08 Worker 侧边栏缺少「考勤管理」入口

- **根因：** [`default.vue`](../app/h5/layouts/default.vue) `ROLE_MENUS.worker` 数组中缺少 `/attendance` 菜单项

---

#### BUG-09 角色管理页仅显示 5 个角色（缺 hr / department_manager）

- **现象：** CEO 访问 `/role`，只显示 employee / finance / project_manager / ceo / worker
- **根因：** `GET /api/roles` 查询条件过滤，或 seed-data 中这两个角色 `status` 值不正确，待排查

---

#### BUG-10 CEO 侧边栏缺少 3 个独有功能入口

- **根因：** [`default.vue`](../app/h5/layouts/default.vue) `ROLE_MENUS.ceo` 缺少 `/attendance`、`/data-export`、`/data-viewer`

---

#### BUG-11 HR 访问 `/payroll` 被重定向到首页

- **根因：** [`auth.global.ts:23`](../app/h5/middleware/auth.global.ts#L23) `'/payroll': ['ceo', 'finance', 'worker', 'employee']` — 缺 `'hr'`（需业务确认是否应开放）

---

#### BUG-12 Finance 工伤页面出现"加载记录失败"Toast

- **根因：** `GET /api/logs/records` 对应 controller 的 `@PreAuthorize` 缺少 `'FINANCE'`

---

#### BUG-13 工作台待办/员工总数对多角色报 403

- **现象：** HR / dept_manager / employee / worker 工作台顶部 Badge 恒为 0
- **根因：**
  - [`FormController.java:38`](../server/src/main/java/com/oa/backend/controller/FormController.java#L38) `GET /forms/todo` — `hasAnyRole('PROJECT_MANAGER','CEO','FINANCE','DEPARTMENT_MANAGER')` 缺 `'HR'`、`'EMPLOYEE'`、`'WORKER'`
  - `EmployeeController.java:44` `GET /employees?size=1`（员工总数卡片）— 同 BUG-01，缺 HR 等角色

---

#### BUG-E03 修改密码错误提示暴露原始 HTTP 错误

- **现象：** 错误当前密码提交后，Toast 显示 `[POST] "/api/auth/change-password": 400 Bad Request`
- **根因：** [`pages/me/password.vue`](../app/h5/pages/me/password.vue) catch 块中未提取 `error.data?.message`，直接使用 `error.toString()`
- **修复：** catch 块改为

  ```typescript
  message.error(error.data?.message || '密码修改失败，请检查当前密码是否正确')
  ```

---

### P3 — 数据 / UI 轻微问题

---

#### BUG-14 岗位管理无种子数据

- `local/seed-data.sql` 无 `position` 表记录，补 3–5 条即可

---

#### BUG-15 补贴配置无种子数据

- `local/seed-data.sql` 无 `allowance_def` 表记录

---

#### BUG-16 CEO 考勤页「我的记录」为空

- `local/seed-data.sql` 未为 `ceo.demo` 插入考勤记录

---

#### BUG-17 数据查看器文件格式描述错误

- 页面提示"上传 .zip 文件"，DESIGN §10.3 定义为 `.obk`，修改前端文案

---

#### BUG-18 Finance 侧边栏含「通讯录导入」入口（待确认）

- 通讯录导入属 HR 职能，Finance 含此入口可能为 `ROLE_MENUS.finance` 误配置，需产品确认

---

#### BUG-E01 初始化向导 CEO 手机号无格式校验

- **根因：** [`pages/setup/index.vue`](../app/h5/pages/setup/index.vue) `validateStep(0)` 仅检查非空，无正则
- **修复：** 追加 `/^1[3-9]\d{9}$/.test(formState.ceoPhone)` 校验

---

#### BUG-E04 新增员工身份证号无格式校验

- **根因：** [`pages/employees/index.vue`](../app/h5/pages/employees/index.vue) 身份证 `<a-form-item>` 缺 `pattern` 规则
- **修复：** `{ pattern: /^\d{17}[\dXx]$/, message: '请输入正确的18位身份证号' }`

---

#### BUG-E05 密码策略不一致（setup ≥8位 vs change ≥6位）

- [`pages/setup/index.vue`](../app/h5/pages/setup/index.vue) `validateStep(0)` — `≥8`
- [`pages/me/password.vue`](../app/h5/pages/me/password.vue) 表单规则 — `min: 6`
- 修复：将 `password.vue` 中 `min: 6` 改为 `min: 8`

---

#### BUG-E06 费用报销明细金额接受负数

- **根因：** [`pages/expense/apply/index.vue`](../app/h5/pages/expense/apply/index.vue) 金额 `<a-input-number>` 缺 `:min="0.01"`

---

#### BUG-E07 费用报销金额为0无正数校验

- 同 BUG-E06，设置 `:min="0.01"` 可同时修复

---

## 三、已确认正常

- 登录 / 登出：7个角色均正常，显示姓名+角色
- 初始密码警告 Banner：所有角色首次登录展示，含修改密码链接
- 动态页面标题：「博渊建筑OA管理系统」正确读取
- 侧边栏动态企业名：「博渊建筑OA工作台」无硬编码
- CEO 员工管理 CRUD（CEO权限）、组织架构双面板树、项目管理2条记录、薪资管理2026-05周期
- CEO 审批流配置：7条规则可见（请假/加班/施工日志/工伤/PAYROLL系列）
- Finance 薪资管理与 CEO 视图一致
- PM 施工日志列表，有填写按钮
- 部门经理团队成员列表正常
- 费用报销申请页面结构完整（字段：类型/出差日期/目的地/明细/发票附件）
- 请假申请表单必填校验正常（4个字段）
- 修改密码表单必填 + 一致性校验正常
- SQL 注入 / XSS 登录绕过：已阻断
- 未认证路由拦截：跳转 `/login`
- employee 越权访问 `/operation-logs`、`/config`、`/role`、`/employees`：已阻断

---

## 四、缺陷汇总

- P0 Critical：3 条 — BUG-01、BUG-02、BUG-03
- P1 High：4 条 — BUG-04、BUG-05、BUG-06、BUG-E02
- P2 Medium：8 条 — BUG-07 至 BUG-13、BUG-E03
- P3 Low：10 条 — BUG-14 至 BUG-18、BUG-E01、BUG-E04 至 BUG-E07
- **合计：25 条**
