# 博渊OA 全量测试报告

**测试日期：** 2026-04-17  
**测试环境：** `localhost:4134`（Nuxt H5）+ `localhost:8080`（Spring Boot + H2）  
**测试工具：** Playwright 无头浏览器（`playwright` npm 包，Chromium）  
**测试轮次：** Round 1 正向全流程 + Round 2 边界/异常  
**截图目录：** `test/manual-test-2026-04-17/screenshots/`  
**原始数据：** `issues.json` / `edge_results.json` / `network_failures.json`

---

## 一、测试账号

| 角色代码 | 账号 | 姓名 | 密码 |
|--------|------|------|------|
| ceo | ceo.demo | 陈明远 | 123456 |
| hr | hr.demo | 李思文 | 123456 |
| finance | finance.demo | 李静 | 123456 |
| project_manager | pm.demo | 王建国 | 123456 |
| department_manager | dept_manager.demo | 周伟 | 123456 |
| employee | employee.demo | 张晓宁 | 123456 |
| worker | worker.demo | 赵铁柱 | 123456 |

---

## 二、测试用例清单

### 2.1 系统初始化（Setup Wizard）

| 编号 | 操作 | 预期 | 实际 | 结论 |
|------|------|------|------|------|
| S01 | 未初始化时访问 `/` | 跳转 `/setup` | 跳转 `/setup` | ✅ |
| S02 | 未初始化时访问 `/login` | 跳转 `/setup` | 跳转 `/setup` | ✅ |
| S03 | 第1步空提交 | Toast 提示姓名必填 | "请输入CEO姓名" | ✅ |
| S04 | 填姓名不填手机 → 提交 | Toast 提示手机必填 | "请输入CEO手机号" | ✅ |
| S05 | 密码输入3位 → 提交 | Toast 提示不足8位 | "密码至少8位" | ✅ |
| S06 | 两次密码不一致 → 提交 | Toast 提示不一致 | "两次输入的密码不一致" | ✅ |
| S07 | 手机号输入"abcdefghijk" → 提交 | Toast 提示格式错误 | 无提示，直接进入第2步 | ❌ **BUG-E01** |
| S08 | 填写有效CEO信息 → 下一步 | 进入 HR 账号步骤 | 正常跳转 | ✅ |
| S09 | 填写HR信息 → 下一步 | 进入可选人员步骤 | 正常跳转 | ✅ |
| S10 | 可选人员步骤 → 跳过 | 进入确认信息页 | 正常跳转 | ✅ |
| S11 | 确认信息页 → 提交 | 进入恢复码页 | 恢复码正常显示* | ✅* |
| S12–S18 | 恢复码勾选门控、步骤6–10跳过、完成初始化 | — | 未执行（测试脚本时序误报导致跳过） | — |

> *S11 脚本误报：`isVisible()` 时序问题导致代码判定 false，但截图 `edge_010_S11_step4_submit.png` 确认页面已正确加载至恢复码步骤。

---

### 2.2 登录 / 认证

| 编号 | 操作 | 预期 | 实际 | 结论 |
|------|------|------|------|------|
| L01 | 空用户名 + 空密码 提交 | 前端拦截，显示表单错误 | 2个表单错误（"请输入工号或手机号" + "请输入密码"） | ✅ |
| L02 | 空用户名 + 有效密码 提交 | 前端拦截 | 1个表单错误 | ✅ |
| L03 | 有效用户名 + 空密码 提交 | 前端拦截 | 1个表单错误 | ✅ |
| L04 | 不存在的用户名 + 密码 | 后端拒绝，页面内显示错误 | 停留登录页，内联显示错误提示 | ✅ |
| L05 | 正确用户名 + 错误密码 | 后端拒绝 | 停留登录页 | ✅ |
| L06 | 用户名输入 SQL 注入（`' OR '1'='1' --`） | 被拒绝，无法登录 | 被拒绝 | ✅ |
| L07 | 用户名输入 XSS（`<script>alert...`） | 被拒绝，无法登录 | 被拒绝 | ✅ |
| L08 | 用户名输入300字符超长字符串 | 被拒绝 | 被拒绝 | ✅ |
| L09 | ceo.demo / 123456 正常登录 | 进入工作台 | 正常登录 | ✅ |
| L10 | 未登录直接访问 `/employees` | 跳转 `/login` | 跳转 `/login` | ✅ |

---

### 2.3 角色正向访问测试（Round 1）

#### CEO（17页）

| 页面 | 加载 | API 状态 |
|------|------|---------|
| `/` 工作台 | ✅ | 正常 |
| `/employees` 员工管理 | ✅ | 正常（7名员工） |
| `/org` 组织架构 | ✅ | 双面板树正常 |
| `/positions` 岗位管理 | ✅ | 表格为空（无种子数据，BUG-14） |
| `/allowances` 补贴配置 | ✅ | 表格为空（无种子数据，BUG-15） |
| `/role` 角色管理 | ✅ | 仅5个角色（缺 hr/dept_manager，BUG-09） |
| `/config` 系统配置 | ✅ | 3个 API 404（BUG-04） |
| `/projects` 项目管理 | ✅ | 2个项目正常显示 |
| `/payroll` 薪资管理 | ✅ | 2026-05周期正常 |
| `/construction-log` 施工日志 | ✅ | 列表正常 |
| `/injury` 工伤补偿 | ✅ | 正常 |
| `/expense/apply` 费用报销申请 | ✅ | 报销类型下拉空（BUG-03） |
| `/expense/records` 报销记录 | ✅ | 正常 |
| `/attendance` 考勤管理 | ✅ | 请假类型404（BUG-05），我的记录空（BUG-16） |
| `/data-export` 数据导出 | ✅ | 结构完整 |
| `/data-viewer` 历史数据 | ✅ | 文件格式描述错误（BUG-17） |
| `/operation-logs` 操作日志 | ✅ | 正常 |
| `/me/password` 修改密码 | ✅ | 正常 |
| **侧边栏** | ⚠️ | 缺 `/attendance`、`/data-export`、`/data-viewer` 入口（BUG-10） |

#### HR（9页）

| 页面 | 加载 | API 状态 |
|------|------|---------|
| `/` 工作台 | ✅ | 待办/员工数 403（BUG-13） |
| `/employees` 员工管理 | ✅ | 列表空白 403（BUG-01） |
| `/leave-types` 假期配额 | ✅ | 数据 404（BUG-06） |
| `/attendance` 考勤管理 | ✅ | 请假类型404（BUG-05） |
| `/directory` 通讯录导入 | ✅ | 403 |
| `/positions` 岗位管理 | ✅ | 403（BUG-01 附带） |
| `/payroll` 薪资管理 | ❌ | 被重定向到首页（BUG-11） |
| `/forms` 表单中心 | ✅ | 403 |
| `/me` 个人中心 | ✅ | 403 |
| **侧边栏** | ⚠️ | 缺 `/leave-types` 入口（BUG-07） |

#### Finance（6页）

| 页面 | 加载 | API 状态 |
|------|------|---------|
| `/` 工作台 | ✅ | 正常 |
| `/expense/records` 报销记录 | ✅ | 正常 |
| `/payroll` 薪资管理 | ✅ | 正常 |
| `/injury` 工伤补偿 | ✅ | 加载记录失败 Toast（BUG-12） |
| `/forms` 表单中心 | ✅ | 正常 |
| `/me` 个人中心 | ✅ | 正常 |
| **侧边栏** | ⚠️ | 含"通讯录导入"入口（待确认，BUG-18） |

#### PM（7页）

| 页面 | 加载 | API 状态 |
|------|------|---------|
| `/` 工作台 | ✅ | 正常 |
| `/projects` 项目管理 | ✅ | 正常 |
| `/construction-log` 施工日志 | ✅ | 列表正常 |
| `/team` 团队成员 | ✅ | 数据空 403（BUG-02） |
| `/forms` 表单中心 | ✅ | 正常 |
| `/attendance` 考勤管理 | ✅ | 请假类型404（BUG-05） |
| `/me` 个人中心 | ✅ | 正常 |

#### 部门经理（5页）

| 页面 | 加载 | API 状态 |
|------|------|---------|
| `/` 工作台 | ✅ | 待办数 403（BUG-13） |
| `/team` 团队成员 | ✅ | 正常 |
| `/attendance` 考勤管理 | ✅ | 请假类型404（BUG-05） |
| `/forms` 表单中心 | ✅ | 正常 |
| `/me` 个人中心 | ✅ | 正常 |

#### Employee（5页）

| 页面 | 加载 | API 状态 |
|------|------|---------|
| `/` 工作台 | ✅ | 待办/员工数 403（BUG-13） |
| `/attendance` 考勤管理 | ✅ | 请假类型404（BUG-05） |
| `/expense/apply` 报销申请 | ✅ | 报销类型500（BUG-03） |
| `/forms` 表单中心 | ✅ | 403 |
| `/me` 个人中心 | ✅ | 403 |

#### Worker（4页）

| 页面 | 加载 | API 状态 |
|------|------|---------|
| `/` 工作台 | ✅ | 待办/员工数 403（BUG-13） |
| `/attendance` 考勤管理 | ✅ | 请假类型404（BUG-05） |
| `/forms` 表单中心 | ✅ | 403 |
| `/me` 个人中心 | ✅ | 403 |
| **侧边栏** | ⚠️ | 缺 `/attendance` 入口（BUG-08） |

---

### 2.4 权限边界测试（employee 角色越权）

| 编号 | 目标页面 | 预期 | 实际 | 结论 |
|------|---------|------|------|------|
| L11-a | `/operation-logs` | 被拦截 → 首页 | 跳转首页 | ✅ |
| L11-b | `/config` | 被拦截 → 首页 | 跳转首页 | ✅ |
| L11-c | `/role` | 被拦截 → 首页 | 跳转首页 | ✅ |
| L11-d | `/data-export` | 被拦截 → 首页 | **页面完整加载** | ❌ **BUG-E02** |
| L11-e | `/employees` | 被拦截 → 首页 | 跳转首页 | ✅ |

---

### 2.5 表单边界值测试

#### 修改密码（/me/password）

| 编号 | 操作 | 预期 | 实际 | 结论 |
|------|------|------|------|------|
| F_P01 | 空提交 | 3 个表单错误 | ✅ 3 个错误（当前密码/新密码/确认密码各1条） | ✅ |
| F_P02 | 错误当前密码 | 友好提示"密码不正确" | Toast 显示 `[POST] "/api/auth/change-password": 400 Bad Request` | ❌ **BUG-E03** |
| F_P03 | 两次新密码不一致 | 表单错误"两次输入的密码不一致" | ✅ 表单错误 | ✅ |
| F_P04 | 新密码输入3位 | 长度不足提示 | ✅ 提示"密码长度至少6位"（但初始化要求8位，**BUG-E05**） | ✅* |

#### 新增员工（/employees）

| 编号 | 操作 | 预期 | 实际 | 结论 |
|------|------|------|------|------|
| F_E01 | 空提交 | 必填字段校验 | Toast "请填写姓名" | ✅ |
| F_E02 | 身份证号输入"12345"（5位） | 格式校验错误 | 无身份证格式错误（触发姓名必填优先） | ❌ **BUG-E04** |
| F_E03 | 姓名输入 `<script>alert('xss')</script>` | — | 前端接受原始字符串（依赖后端转义） | ℹ️ INFO |

#### 费用报销申请（/expense/apply）

| 编号 | 操作 | 预期 | 实际 | 结论 |
|------|------|------|------|------|
| F_X01 | 空提交 | 必填字段校验 | ✅ 6 个表单错误 | ✅ |
| F_X02 | 明细金额输入 `-100` | 前端拦截负数 | 输入框接受 "-100" | ❌ **BUG-E06** |
| F_X03 | 明细金额输入 `0` 提交 | "金额须大于0"校验 | 仅触发其他必填字段错误，无金额正数校验 | ❌ **BUG-E07** |
| F_X04 | 金额输入 `9999999999`（99亿） | — | 输入框接受 | ℹ️ INFO |

#### 请假申请（/attendance → 请假 Tab）

| 编号 | 操作 | 预期 | 实际 | 结论 |
|------|------|------|------|------|
| F_A01 | 空提交 | 必填字段校验 | ✅ 4 个表单错误（假种/开始日期/结束日期/原因） | ✅ |

---

## 三、问题清单与代码定位

### P0 — 核心业务阻塞（3条）

---

#### BUG-01：HR 角色无法访问员工与岗位数据

**现象**  
HR 访问 `/employees` 列表空白显示"暂无数据"；新增员工弹框中岗位/部门级联下拉无法加载。

**代码定位**

| 文件 | 行号 | 当前权限 | 问题 |
|------|------|---------|------|
| [EmployeeController.java](../server/src/main/java/com/oa/backend/controller/EmployeeController.java#L44) | 44 | `@PreAuthorize("hasAnyRole('CEO','FINANCE','PROJECT_MANAGER')")` | 缺少 `'HR'` |
| [EmployeeController.java](../server/src/main/java/com/oa/backend/controller/EmployeeController.java#L73) | 73 | `@PreAuthorize("hasAnyRole('CEO','FINANCE','PROJECT_MANAGER')")` | 缺少 `'HR'` |
| `PositionController.java` | GET `/positions` | 未确认，类似缺 HR | 需补 HR |

**修复方式**  
在 `EmployeeController.java` 第 44、73 行的 `hasAnyRole(...)` 中追加 `'HR'`；对 `/positions` 的 GET 端点同步操作。

---

#### BUG-02：PM 角色无法查看团队成员

**现象**  
PM 访问 `/team` 页面，数据区域为空，API 返回 403。

**代码定位**

| 文件 | 行号 | 当前权限 | 问题 |
|------|------|---------|------|
| [TeamController.java](../server/src/main/java/com/oa/backend/controller/TeamController.java#L35) | 35 | `@PreAuthorize("hasRole('DEPARTMENT_MANAGER')")` | 缺少 `'PROJECT_MANAGER'` |

**修复方式**  
将第 35 行改为 `@PreAuthorize("hasAnyRole('DEPARTMENT_MANAGER','PROJECT_MANAGER')")`。

---

#### BUG-03：费用报销类型接口 500，报销流程全程阻断

**现象**  
所有角色访问 `/expense/apply`，报销类型下拉列表为空，无法选择报销类型，报销申请无法提交。

**代码定位**

| 文件 | 说明 |
|------|------|
| [ExpenseController.java](../server/src/main/java/com/oa/backend/controller/ExpenseController.java#L41) | `GET /expense/types` → 调用 `expenseService.getExpenseTypes()` |
| `ExpenseServiceImpl.java` | `getExpenseTypes()` 查询 `expense_type_def` 表 |
| `local/seed-data.sql` | 无任何 `INSERT INTO expense_type_def` 记录 |

**根因**  
开发环境 H2 数据库的 `expense_type_def` 表无种子数据（或表不存在），MyBatis-Plus 查询时抛出异常。

**修复方式**  
在 `local/seed-data.sql` 中插入至少 3 条报销类型记录（如：差旅费、餐饮费、办公耗材）；若表结构缺失，需在 `V1__init_schema.sql` 中补充 DDL。

---

### P1 — 接口缺失（4条）

---

#### BUG-04：系统配置页 3 个 Config API 均 404

**现象**  
CEO 访问 `/config`，企业名称、薪资周期、数据保留期三个区域加载失败。

**代码定位**

| 缺失端点 | 预期控制器 | 现状 |
|---------|-----------|------|
| `GET /api/config/company-name` | `SystemConfigController` | 未实现或未注册 |
| `PUT /api/config/company-name` | `SystemConfigController` | 未实现 |
| `GET /api/config/payroll-cycle` | `SystemConfigController` | 未实现 |
| `PUT /api/config/payroll-cycle` | `SystemConfigController` | 未实现 |
| `GET /api/config/retention-period` | `SystemConfigController` | 未实现 |
| `PUT /api/config/retention-period` | `SystemConfigController` | 未实现 |

**修复方式**  
在 `SystemConfigController` 中实现上述6个端点，读写 `system_config` 表（key = `company_name` / `payroll_cycle_day` / `retention_days`）。

---

#### BUG-05：请假类型接口 404，所有角色无法申请请假

**现象**  
全角色访问 `/attendance` 请假申请 Tab，假种下拉列表为空；`GET /api/config/leave-types` 返回 404。

**代码定位**

| 文件 | 说明 |
|------|------|
| [LeaveTypeController.java](../server/src/main/java/com/oa/backend/controller/LeaveTypeController.java#L31) | 控制器已实现，`GET /config/leave-types` 已注册 |
| `local/seed-data.sql` | 无 `INSERT INTO leave_type_def` 记录 |

**根因**  
后端代码已存在但后端服务未重启（运行的 JAR 为旧版），且 `leave_type_def` 表无种子数据，导致 404。

**修复方式**  
① 重启后端服务使 `LeaveTypeController` 生效；② 在 `local/seed-data.sql` 补充请假类型记录（年假/病假/事假/婚假等）。

---

#### BUG-06：假期配额管理页 API 404

**现象**  
HR 访问 `/leave-types`，列表空白；`GET /api/config/leave-types/all` 返回 404。

**代码定位**  
与 BUG-05 同源——[LeaveTypeController.java:46](../server/src/main/java/com/oa/backend/controller/LeaveTypeController.java#L46) `GET /all` 已实现，需重启后端 + 补种子数据。

---

#### BUG-E02：Employee 角色可完整访问 `/data-export` 页（权限泄露）

**现象**  
以 `employee.demo` 身份直接访问 `/data-export`，页面完整加载，数据导出功能可操作（截图：`edge_024_L11_escalation_data-export.png`）。

**代码定位**

| 文件 | 行号 | 问题 |
|------|------|------|
| [auth.global.ts](../app/h5/middleware/auth.global.ts#L12) | 12–28 | `PAGE_ACCESS` 白名单中无 `/data-export` 条目 |

`PAGE_ACCESS` 机制说明：未列出的路由对所有已登录用户开放（第 9–10 行注释已说明）。`/data-export` 未加入白名单，导致任何角色均可访问。

**修复方式**  
在 `auth.global.ts` 第 28 行后追加：`'/data-export': ['ceo']`

---

### P2 — 权限 / 路由 / 错误提示（7条）

---

#### BUG-07：HR 侧边栏缺少「假期配额管理」入口

**代码定位**  
[default.vue](../app/h5/layouts/default.vue) 中 `ROLE_MENUS.hr` 数组——需核查是否包含 `{ path: '/leave-types', label: '假期配额管理' }` 条目。如缺失，补入即可。

---

#### BUG-08：Worker 侧边栏缺少「考勤管理」入口

**代码定位**  
[default.vue](../app/h5/layouts/default.vue) 中 `ROLE_MENUS.worker` 数组——需补入 `{ path: '/attendance', label: '考勤管理' }` 条目。

---

#### BUG-09：角色管理页仅显示 5 个角色（缺 hr / department_manager）

**现象**  
`/role` 页面只展示 employee / finance / project_manager / ceo / worker，CEO 无法配置 HR 和部门经理的角色权限。

**代码定位**  
需排查 `GET /api/roles` 端点的查询条件，确认是否过滤了 `hr` / `department_manager` 角色代码，或 seed-data 中这两个角色的 `status` 字段不正确。

---

#### BUG-10：CEO 侧边栏缺少 3 个独有功能入口

**现象**  
CEO 侧边栏中无「考勤管理」「数据导出」「历史数据查看」，但对应 URL 可直接访问。

**代码定位**  
[default.vue](../app/h5/layouts/default.vue) 中 `ROLE_MENUS.ceo` 数组——补入 `/attendance`、`/data-export`、`/data-viewer` 三个菜单项。

---

#### BUG-11：HR 访问 `/payroll` 被重定向到首页

**代码定位**  
[auth.global.ts](../app/h5/middleware/auth.global.ts#L23) 第 23 行：`'/payroll': ['ceo', 'finance', 'worker', 'employee']`——缺少 `'hr'`。  
需业务确认 HR 是否应查看薪资，如是则追加 `'hr'`。

---

#### BUG-12：Finance 访问工伤页出现"加载记录失败"Toast

**代码定位**  
`GET /api/logs/records` 对 Finance 角色返回 403——后端对应端点的 `@PreAuthorize` 中未包含 `'FINANCE'`。

---

#### BUG-13：工作台待办/员工总数计数对多角色返回 403

**现象**  
HR / dept_manager / employee / worker 登录后工作台顶部 Badge 恒为 0。

**代码定位**

| 端点 | 文件 | 当前权限 | 缺少角色 |
|------|------|---------|---------|
| `GET /api/forms/todo` | [FormController.java:38](../server/src/main/java/com/oa/backend/controller/FormController.java#L38) | `hasAnyRole('PROJECT_MANAGER','CEO','FINANCE','DEPARTMENT_MANAGER')` | HR / EMPLOYEE / WORKER |
| `GET /api/employees?size=1`（员工总数） | EmployeeController.java:44 | `hasAnyRole('CEO','FINANCE','PROJECT_MANAGER')` | 可改为专用 count API |

---

#### BUG-E03：修改密码错误提示为原始 HTTP 错误字符串

**现象**  
输入错误当前密码后，Toast 显示 `[POST] "/api/auth/change-password": 400 Bad Request`。

**代码定位**  
[pages/me/password.vue](../app/h5/pages/me/password.vue)——catch 块中直接使用 `error.toString()` 或未提取 `error.data?.message`。  

**修复方式**  
```typescript
// 将 catch(error) 中的 message 提取改为：
message.error(error.data?.message || '密码修改失败，请检查当前密码是否正确')
```

---

### P3 — 数据 / UI 轻微问题（7条）

---

#### BUG-14：岗位管理（/positions）无种子数据

`local/seed-data.sql` 中无 `INSERT INTO position` 记录，页面显示"暂无数据"。补充 3–5 条即可。

---

#### BUG-15：补贴配置（/allowances）无种子数据

同 BUG-14，补充 `allowance_def` 种子数据。

---

#### BUG-16：CEO 考勤页「我的记录」为空

`local/seed-data.sql` 未为 `ceo.demo` 插入考勤记录。

---

#### BUG-17：数据查看器（/data-viewer）文件格式描述错误

页面提示"上传 .zip 文件"，DESIGN.md §10.3 定义为 `.obk` 格式，需修正前端描述文案。

---

#### BUG-18：Finance 侧边栏含「通讯录导入」入口（待确认）

通讯录 CSV 导入属于 HR 职能，Finance 含此入口可能为 `ROLE_MENUS.finance` 误配置，需产品确认。

---

#### BUG-E01：初始化向导 CEO 手机号无格式校验

**代码定位**  
[pages/setup/index.vue](../app/h5/pages/setup/index.vue) `validateStep(0)` 函数——仅检查非空，无正则格式校验。

**修复方式**  
```typescript
// 追加正则校验（中国11位手机号）：
if (!/^1[3-9]\d{9}$/.test(formState.ceoPhone)) {
  message.error('请输入有效的11位手机号')
  return false
}
```

---

#### BUG-E04：新增员工身份证号无格式校验

**代码定位**  
[pages/employees/index.vue](../app/h5/pages/employees/index.vue) 新增员工弹框中身份证 `<a-form-item>` 的校验规则——缺少 pattern 规则。

**修复方式**  
```typescript
{ pattern: /^\d{17}[\dXx]$/, message: '请输入正确的18位身份证号' }
```

---

#### BUG-E05：密码策略不一致（setup ≥8位 vs change ≥6位）

**代码定位**

| 文件 | 规则 |
|------|------|
| [pages/setup/index.vue](../app/h5/pages/setup/index.vue) `validateStep(0)` | `≥8` |
| [pages/me/password.vue](../app/h5/pages/me/password.vue) 表单校验规则 | `min: 6` |

**修复方式**  
统一密码最小长度为 8 位，修改 `password.vue` 中 `min: 6` → `min: 8`。

---

#### BUG-E06：费用报销明细金额接受负数

**代码定位**  
[pages/expense/apply/index.vue](../app/h5/pages/expense/apply/index.vue) 报销明细中金额 `<a-input-number>` 组件——缺少 `:min="0.01"`。

---

#### BUG-E07：费用报销金额填 0 无正数校验

与 BUG-E06 同源，追加自定义 validator 或设置 `:min="0.01"` 可同时修复两个问题。

---

## 四、已确认正常的功能点

| 模块 | 验证结果 |
|------|---------|
| 登录 / 登出 | ✅ 7 个角色均正常，显示姓名 + 角色名 |
| 初始密码警告 Banner | ✅ 所有角色首次登录显示警告，含「去修改密码」链接 |
| 动态页面标题 | ✅ 「博渊建筑OA管理系统」正确显示 |
| 侧边栏 Logo / 企业名 | ✅ 「博渊建筑OA工作台」动态读取，无硬编码 |
| CEO 员工管理 | ✅ 7 名员工加载，搜索正常 |
| CEO 组织架构 | ✅ 双面板汇报关系树，CEO 固定顶端 |
| CEO 系统配置页结构 | ✅ 4 大配置区完整；审批流 7 条可见 |
| CEO 项目管理 | ✅ 2 个项目正常显示 |
| CEO 数据导出页结构 | ✅ 时间范围选择器 + 导出历史区域 |
| CEO 薪资管理 | ✅ 2026-05 周期「待处理」，开放申报窗口 |
| Finance 薪资管理 | ✅ 与 CEO 视图一致 |
| PM 施工日志 | ✅ 列表正常，含「填写日志」按钮 |
| 费用报销申请页面结构 | ✅ 字段完整（类型/日期/目的地/明细/发票上传） |
| 劳工工作台菜单 | ✅ 施工日志/工伤补偿/表单中心/工资条/费用报销 5 个入口 |
| 修改密码页结构 | ✅ 3 字段正常，前端必填 + 一致性校验通过 |
| 请假申请表单校验 | ✅ 假种/开始日期/结束日期/原因 4 个必填字段校验正常 |
| SQL 注入防护 | ✅ 登录无法绕过 |
| XSS 登录防护 | ✅ 脚本标签用户名登录被拒绝 |
| 未认证路由拦截 | ✅ 未登录访问跳转 `/login` |
| employee 越权访问（4/5项） | ✅ `/operation-logs`、`/config`、`/role`、`/employees` 均被拦截 |

---

## 五、问题汇总

| 优先级 | 数量 | Bug 编号 |
|--------|------|---------|
| P0 Critical | 3 | BUG-01、BUG-02、BUG-03 |
| P1 High | 4 | BUG-04、BUG-05、BUG-06、BUG-E02 |
| P2 Medium | 7 | BUG-07、BUG-08、BUG-09、BUG-10、BUG-11、BUG-12、BUG-13、BUG-E03 |
| P3 Low | 11 | BUG-14、BUG-15、BUG-16、BUG-17、BUG-18、BUG-E01、BUG-E04、BUG-E05、BUG-E06、BUG-E07 |
| **合计** | **25** | |

---

## 六、关于项目内可用的问题定位手段

本项目**未集成**任何外部错误追踪系统（Sentry / LogRocket / Rollbar）。定位问题可使用以下现有资源：

### 后端权限问题（403）
所有接口权限由 `@PreAuthorize` 注解控制。定位方式：

```bash
grep -rn "PreAuthorize" server/src/main/java/com/oa/backend/controller/
```

找到目标 endpoint 的注解后，对比 JWT 中携带的 `ROLE_XXX` 字符串（Spring Security 约定：角色代码前缀大写，如 `'HR'` 对应数据库中 `hr`）。

### 前端路由拦截问题（页面被跳转）
唯一入口：[app/h5/middleware/auth.global.ts](../app/h5/middleware/auth.global.ts)，`PAGE_ACCESS` 对象（第 12 行）。  
未列入 `PAGE_ACCESS` 的路由对所有已登录用户开放；列入后，只有白名单角色可访问。

### 前端菜单缺失问题
入口：[app/h5/layouts/default.vue](../app/h5/layouts/default.vue) 中的 `ROLE_MENUS` 对象。  
每个角色的菜单数组对应侧边栏显示内容，与 `PAGE_ACCESS` 互相独立。

### 后端 API 404
可能原因：① Controller 未被 Spring 扫描到（缺 `@RestController`）；② 服务未重启使新代码生效；③ 请求路径与 `@RequestMapping` 不匹配。  
验证方法：`curl http://localhost:8080/api/<path>` 直接调用确认。

### 运行时错误（500）
查看 Spring Boot 控制台输出（stdout），H2 SQL 错误、NPE 均会在此打印完整堆栈。  
项目内的操作日志（`/operation-logs`，仅 CEO 可见）记录的是业务操作审计，不包含 API 错误。
