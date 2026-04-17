# 博渊OA 全角色全流程测试报告

**测试日期：** 2026-04-17  
**测试环境：** localhost:4134（Nuxt H5）+ localhost:8080（Spring Boot）  
**测试方法：** Playwright 无头浏览器 + 网络请求抓包  
**测试账号：** ceo.demo / hr.demo / finance.demo / pm.demo / dept_manager.demo / employee.demo / worker.demo（统一密码 123456）  
**截图目录：** `test/manual-test-2026-04-17/screenshots/`  
**原始日志：** `issues.json` / `network_failures.json`

---

## 一、测试通过概览

| 角色 | 可访问页面 | 路由拦截正常 | 整体状态 |
|------|-----------|------------|--------|
| CEO（首席经营者 陈明远） | 17/17 可达 | ✅ | ⚠️ 含 API 错误 |
| HR（人力资源 李思文） | 8/9（/payroll 被拦截）| ⚠️ | ❌ 多处 403 |
| Finance（财务 李静） | 5/5 可达 | ✅ | ⚠️ 含 API 错误 |
| PM（项目经理 王建国） | 6/6 可达 | ✅ | ⚠️ 含 API 错误 |
| 部门经理（周伟） | 4/4 可达 | ✅ | ⚠️ 含 API 错误 |
| 员工（张晓宁） | 5/5 可达 | ✅ | ⚠️ 含 API 错误 |
| 劳工（赵铁柱） | 3/3 可达 | ✅ | ⚠️ 含 API 错误 |

---

## 二、问题清单

### P0 — 核心功能阻塞（Critical，用户无法完成基本业务）

#### BUG-01：HR 角色完全无法管理员工
- **现象：** `/employees`（员工管理）列表空白，显示"暂无数据"
- **根因：** `GET /api/employees` → 403 Forbidden（后端权限未给 HR）
- **附带：** `GET /api/positions` → 403（新增员工时部门/岗位级联下拉无法加载）
- **影响：** HR 是员工管理的主要角色，整个员工 CRUD 功能对 HR 不可用
- **截图：** `hr_employees.png`

#### BUG-02：PM 无法查看团队成员
- **现象：** `/team`（团队成员）页面有内容框但数据为空
- **根因：** `GET /api/team/members` → 403 Forbidden（后端权限未给 PM）
- **影响：** PM 核心业务场景之一（查看/管理项目团队）完全失效
- **截图：** `pm_team.png`

#### BUG-03：费用报销申请类型接口 500
- **现象：** `/expense/apply` 打开后"报销类型"下拉为空，无法选择任何类型
- **根因：** `GET /api/expense/types` → 500 Internal Server Error（后端异常）
- **影响：** employee、finance 等需要提交报销的角色均受影响；报销流程全程阻断
- **截图：** `employee_expense_apply.png`

---

### P1 — 新功能接口未实现（High，功能页面已上线但后端 API 缺失）

#### BUG-04：系统配置页三个 Config API 均 404
- **现象：** `/config` 页面中以下三个区域加载失败：企业名称、薪资周期配置、数据保留期
- **根因：**
  - `GET /api/config/company-name` → 404
  - `GET /api/config/payroll-cycle` → 404
  - `GET /api/config/retention-period` → 404
- **影响：** CEO 无法查看/修改企业名称（DESIGN §2.2）、薪资发放日（DESIGN §5.0.5）、数据保留天数
- **截图：** `ceo_config.png`（页面结构存在，数据区域空白）

#### BUG-05：请假类型 API 404，所有角色考勤页请假 Tab 失效
- **现象：** 所有角色进入 `/attendance` → "请假申请" Tab → 假种下拉列表为空，无法选择
- **根因：** `GET /api/config/leave-types` → 404
- **影响：** 全角色（CEO/HR/PM/dept_manager/employee/worker）均无法提交请假申请
- **截图：** `ceo_attendance.png`, `hr_attendance.png` 等

#### BUG-06：假期配额管理页数据接口 404
- **现象：** HR 访问 `/leave-types`（假期配额管理），列表空白
- **根因：** `GET /api/config/leave-types/all` → 404（与 BUG-05 同源，后端该模块 controller/service 未实现）
- **影响：** HR 无法配置请假类型，直接导致 BUG-05 的请假下拉为空
- **截图：** `hr_leave-types.png`

---

### P2 — 导航 / 路由 / 权限配置错误（Medium）

#### BUG-07：HR 侧边栏缺少「假期配额管理」入口
- **现象：** HR 工作台侧边栏无 `/leave-types` 菜单项；只能手动输入 URL 才能访问
- **根因：** `ROLE_MENUS.hr` 未配置 `/leave-types` 路由
- **影响：** HR 的核心配置功能（假期类型管理）不可发现
- **截图：** `hr_.png`

#### BUG-08：Worker 侧边栏缺少「考勤管理」入口
- **现象：** worker 工作台侧边栏无 `/attendance` 菜单项
- **当前菜单：** 工作台、施工日志、工伤补偿、表单中心、工资条、费用报销
- **根因：** `ROLE_MENUS.worker` 未包含 `/attendance`（DESIGN §A3 记录的已知缺口）
- **影响：** 劳工无法提交请假/加班申请
- **截图：** `worker_.png`

#### BUG-09：角色管理页仅显示 5 个角色，缺少 hr / department_manager
- **现象：** `/role` 页面只展示 employee、finance、project_manager、ceo、worker 五个角色
- **影响：** CEO 无法查看和配置 HR、部门经理的角色权限；管理后台不完整
- **截图：** `ceo_role.png`

#### BUG-10：CEO 侧边栏无「考勤管理」「数据导出」「历史数据查看」入口
- **现象：** CEO 侧边栏中找不到以上三个页面的菜单项，但 URL 可直接访问
- **根因：** `ROLE_MENUS.ceo` 缺少这三个路由
- **影响：** 功能上线但用户不可发现；数据导出和历史查看是 CEO 独有功能应在菜单中
- **截图：** `ceo_.png`

#### BUG-11：HR 访问 `/payroll` 被重定向到首页
- **现象：** HR 点击薪资管理被直接跳转回 `/`
- **判断：** 若 HR 需查看工资条（DESIGN 可能有此需求），则为权限配置错误；需确认是否预期行为
- **截图：** `hr_payroll.png`（跳回首页截图）

#### BUG-12：Finance 工伤页面出现"加载记录失败"弹窗
- **现象：** Finance 进入 `/injury`，页面顶部出现红色 Toast："加载记录失败"
- **根因：** `GET /api/logs/records` → 403（后端未给 Finance 操作日志读取权限）
- **影响：** 功能可用但有明显错误提示；用户体验差
- **截图：** `finance_injury.png`

#### BUG-13：工作台「待审批事项」/「员工总数」计数对多角色报 403
- **现象：** HR、dept_manager、employee、worker 登录后工作台顶部 Badge 恒为 0
- **根因：**
  - `GET /api/forms/todo` → 403（HR / dept_manager / employee / worker）
  - `GET /api/employees?size=1` → 403（HR / dept_manager / employee / worker）
- **影响：** 待办 Badge 失效；员工总数卡片对非 CEO/Finance 角色不显示
- **截图：** `hr_.png`, `dept_manager_.png`, `employee_.png`, `worker_.png`

---

### P3 — UI / 数据展示问题（Low）

#### BUG-14：岗位管理（/positions）无种子数据
- **现象：** CEO/HR 访问岗位管理，表格显示"暂无数据"
- **判断：** 本地 seed-data.sql 未包含岗位数据，导致功能无法演示
- **建议：** 补充至少 3-5 条岗位种子数据
- **截图：** `ceo_positions.png`

#### BUG-15：补贴配置（/allowances）无种子数据
- **现象：** CEO 访问补贴配置，表格显示"暂无数据"
- **与 BUG-14 同类**
- **截图：** `ceo_allowances.png`

#### BUG-16：CEO 考勤页「我的记录」为空
- **现象：** CEO 登录查看 `/attendance`，"我的记录" Tab 无数据
- **判断：** seed-data.sql 中 ceo.demo 未插入考勤记录
- **截图：** `ceo_attendance.png`

#### BUG-17：数据查看器（/data-viewer）描述与设计不符
- **现象：** 页面提示"上传 .zip 文件"，DESIGN §10.3 定义为 `.obk` 格式
- **影响：** 用户使用预期不一致（轻微）
- **截图：** `ceo_data-viewer.png`

#### BUG-18：Finance 工作台含「通讯录导入」入口
- **现象：** Finance 侧边栏底部有"通讯录导入"菜单项
- **判断：** 通讯录 CSV 导入属于 HR 职能，Finance 包含此入口可能为误配置，需确认

---

## 三、正常通过的功能点

| 模块 | 验证结果 |
|------|---------|
| 登录 / 登出 | ✅ 7 个角色均正常登录，显示姓名+角色 |
| 初始密码警告 Banner | ✅ 所有角色首次登录均出现警告，含「去修改密码」链接 |
| 动态页面标题 | ✅「博渊建筑OA管理系统」正确显示 |
| 侧边栏 Logo | ✅「博渊建筑OA工作台」（已修复硬编码问题） |
| CEO 员工管理 | ✅ 正确加载 7 名员工，可搜索 |
| CEO 组织架构 | ✅ 双面板汇报关系树正常渲染，CEO 固定顶端 |
| CEO 系统配置页结构 | ✅ 四大配置区域（考勤计量单位、审批流、薪资调整审批、企业信息/薪资周期/数据保留）结构完整 |
| CEO 审批流配置 | ✅ 7 条审批流可见（请假/加班/施工日志/工伤/PAYROLL_BONUS/PAYROLL_CORRECTION/PAYROLL_REVENUE_CHANGE），注意缺"报销申请" |
| CEO 项目管理 | ✅ 2 个项目正常显示 |
| CEO 数据导出页 | ✅ 时间范围选择器 + 导出历史结构完整 |
| CEO 薪资管理 | ✅ 2026-05 周期显示"待处理"，开放申报窗口 / 结算按钮可见 |
| HR 考勤管理（结构） | ✅ 5 Tab 可见（我的记录/请假申请/加班申报/自补加班/加班通知） |
| HR 假期配额管理（结构） | ✅ 页面框架存在，表头完整（假种名称/代码/年度配额/扣款比例/扣款基准/系统内置/状态） |
| Finance 薪资管理 | ✅ 与 CEO 视图一致，可创建周期、结算 |
| PM 施工日志 | ✅ 列表页正常，有"填写日志"按钮 |
| 员工 费用报销申请（页面结构） | ✅ 表单字段完整：报销类型/出差日期/目的地/事由/关联项目/报销明细（费用类型/日期/金额/发票号） |
| 劳工 工作台 | ✅ 包含施工日志/工伤补偿/表单中心/工资条/费用报销 5 个入口 |
| 工资条密码设置 | ✅ /me/password 页正常加载 |

---

## 四、问题汇总统计

| 优先级 | 数量 | 说明 |
|--------|------|------|
| P0 Critical | 3 | 阻塞核心业务 |
| P1 High | 3 | 新功能接口缺失 |
| P2 Medium | 7 | 权限/导航/错误提示 |
| P3 Low | 5 | 数据展示/轻微不一致 |
| **合计** | **18** | |

---

## 五、修复优先级建议

**立即处理（阻塞测试 / 演示）：**

1. 后端 `EmployeeController` — 给 HR 角色补 `GET /api/employees` 和 `GET /api/positions` 权限
2. 后端 `TeamController` — 给 PM 角色补 `GET /api/team/members` 权限
3. 后端 `ExpenseController` — 修复 `GET /api/expense/types` 500 错误
4. 后端实现 `GET /api/config/leave-types` 和 `GET /api/config/leave-types/all`（依赖 LeaveTypeController 已建）
5. 前端 `ROLE_MENUS.hr` 补 `/leave-types` 入口
6. 前端 `ROLE_MENUS.worker` 补 `/attendance` 入口

**次优先处理（配置完善）：**

7. 后端实现 `GET/PUT /api/config/company-name`、`payroll-cycle`、`retention-period`
8. `/role` 角色管理页加载全角色（含 hr、department_manager）
9. `ROLE_MENUS.ceo` 补 `/attendance`、`/data-export`、`/data-viewer` 三个入口
10. `GET /api/forms/todo` 权限扩展至 HR / dept_manager / employee / worker
11. `GET /api/employees?size=1`（工作台卡片）扩展权限至非 CEO 角色（或改用专用 count API）

**低优先处理：**

12. 补充岗位 / 补贴 / CEO 考勤的种子数据
13. 修正 data-viewer 文件格式描述（.zip → .obk）
14. 确认 Finance 是否应包含「通讯录导入」菜单
15. 确认 HR 访问 `/payroll` 是否应重定向

---

## 六、补充测试：初始化流程 + 登录边界 + 表单边界值（2026-04-17 第二轮）

**测试方法：** Playwright 无头浏览器，每用例独立上下文，避免状态污染  
**测试脚本：** `test/manual-test-2026-04-17/run_edge_tests.js`  
**结果文件：** `test/manual-test-2026-04-17/edge_results.json`  
**汇总：** ✓29 通过  ✗7 失败（含1个测试脚本误报）  ·2 信息项

---

### 6.1 初始化向导（Setup Wizard）测试结果

| 用例 | 描述 | 结果 | 备注 |
|------|------|------|------|
| S01 | 未初始化访问 `/` → 跳转 `/setup` | ✅ 通过 | |
| S02 | 未初始化访问 `/login` → 跳转 `/setup` | ✅ 通过 | |
| S03 | 第1步空提交 → 提示"请输入CEO姓名" | ✅ 通过 | |
| S04 | 填写姓名但不填手机 → 提示"请输入CEO手机号" | ✅ 通过 | |
| S05 | 密码3位（不足8位）→ 提示"密码至少8位" | ✅ 通过 | |
| S06 | 两次密码不一致 → 提示"两次输入的密码不一致" | ✅ 通过 | |
| S07 | 手机号输入非数字"abcdefghijk" | ❌ **BUG-E01** | 见下 |
| S08–S10 | 完整向导流程（CEO→HR→可选→确认页） | ✅ 通过 | 各步骤跳转正确 |
| S11 | 确认页提交 → 进入恢复码页 | ✅ 实际通过* | 测试脚本时序误报 |

> **S11 说明：** 截图 `edge_010_S11_step4_submit.png` 显示恢复码页已正确加载，测试脚本因 `isVisible()` 的时序问题误判为失败。该步骤功能正常。
>
> **S12–S18 说明：** 因 S11 误报，恢复码复选框门控测试及后续步骤（角色管理、CSV导入、组织架构、系统配置、完成初始化）未执行。待修复脚本后补测。

---

### 6.2 登录异常/边界测试结果

| 用例 | 描述 | 结果 |
|------|------|------|
| L01 | 空用户名 + 空密码 → 前端验证拦截 | ✅ 通过（表单错误 × 2） |
| L02 | 空用户名 + 有效密码 → 前端验证拦截 | ✅ 通过 |
| L03 | 有效用户名 + 空密码 → 前端验证拦截 | ✅ 通过 |
| L04 | 不存在的用户名登录 → 被阻断 | ✅ 通过（页面内联显示错误提示） |
| L05 | 正确用户名 + 错误密码 → 被阻断 | ✅ 通过 |
| L06 | SQL 注入用户名（`' OR '1'='1' --`）| ✅ 通过（被阻断，无绕过） |
| L07 | XSS 用户名（`<script>alert...`）| ✅ 通过（被阻断，无绕过） |
| L08 | 300 字符超长用户名 | ✅ 通过（被阻断） |
| L09 | 正常登录 ceo.demo/123456 | ✅ 通过 |
| L10 | 未登录访问 `/employees` → 跳转登录页 | ✅ 通过 |
| L11 | employee 越权访问 `/operation-logs` | ✅ 通过（被拦截） |
| L11 | employee 越权访问 `/config` | ✅ 通过（被拦截） |
| L11 | employee 越权访问 `/role` | ✅ 通过（被拦截） |
| L11 | employee 越权访问 `/data-export` | ❌ **BUG-E02**（未被拦截） |
| L11 | employee 越权访问 `/employees` | ✅ 通过（被拦截） |

---

### 6.3 表单边界值测试结果

| 用例 | 描述 | 结果 |
|------|------|------|
| F_P01 | 修改密码页空提交 → 前端校验 | ✅ 通过（3个表单错误） |
| F_P02 | 修改密码输入错误当前密码 → 错误提示 | ❌ **BUG-E03** |
| F_P03 | 确认密码不一致 → 前端校验 | ✅ 通过（"两次输入的密码不一致"） |
| F_P04 | 新密码仅3字符 → 前端长度校验 | ✅* 通过，但提示"至少6位"，与向导"至少8位"不一致（**BUG-E05**） |
| F_E01 | 新增员工空提交 → 拦截并提示 | ✅ 通过（Toast "请填写姓名"） |
| F_E02 | 新增员工输入5位身份证号 | ❌ **BUG-E04**（无格式校验） |
| F_E03 | 新增员工姓名输入 XSS 字符串 | ℹ️ INFO（前端接受，依赖后端转义） |
| F_X01 | 费用报销空提交 → 前端校验 | ✅ 通过（6个表单错误） |
| F_X02 | 费用报销金额输入 -100（负数） | ❌ **BUG-E06**（前端接受负数） |
| F_X03 | 费用报销金额输入 0 | ❌ **BUG-E07**（无"金额须大于0"校验） |
| F_X04 | 费用报销金额输入 99 亿 | ℹ️ INFO（前端接受，需确认后端限制） |
| F_A01 | 请假申请空提交 → 前端校验 | ✅ 通过（4个表单错误） |

---

### 6.4 本轮新增 Bug 清单

#### BUG-E01：初始化向导 CEO 手机号无格式校验（P2 Medium）
- **现象：** 初始化向导第1步，手机号输入字母字符串"abcdefghijk"，点击下一步成功进入第2步（HR账号创建），无任何错误提示
- **根因：** `pages/setup/index.vue` `validateStep(0)` 仅校验手机号是否为空，未校验格式（无正则校验）
- **影响：** 系统可能以无效手机号初始化 CEO 账号，后续通知/验证流程受影响
- **截图：** `edge_006_S07_step1_invalid_phone.png`

#### BUG-E02：Employee 角色可直接访问 `/data-export` 页（P1 High）
- **现象：** 以 employee.demo 登录后，直接访问 `/data-export`，页面完整加载，数据导出功能可用
- **根因：** 前端路由守卫（`middleware/auth.global.ts` 或 `ROLE_MENUS`）未将 `/data-export` 限制为 CEO 专属路由
- **影响：** 普通员工可触发全量数据导出，存在数据安全风险
- **截图：** `edge_024_L11_escalation_data-export.png`（显示员工身份加载导出页）

#### BUG-E03：修改密码错误提示为原始 HTTP 错误（P2 Medium）
- **现象：** 在修改密码页输入错误的当前密码后，Toast 显示 `[POST] "/api/auth/change-password": 400 Bad Request`，而非友好提示
- **根因：** `pages/me/password.vue` 直接将 `$fetch` 抛出的 HTTP 错误对象 `toString()` 展示，未提取 response body 中的 `message` 字段
- **影响：** 用户看到技术性错误信息，体验差；暴露内部 API 路径
- **截图：** `edge_027_F_P02_pw_wrong_current.png`

#### BUG-E04：新增员工身份证号无格式校验（P2 Medium）
- **现象：** 新增员工弹框中，身份证号输入"12345"（5位）提交后，无身份证格式错误提示（仅提示姓名必填）
- **根因：** 员工表单中身份证字段缺少 `pattern` 或自定义 validator 校验
- **影响：** 可写入格式错误的身份证号，影响后续证件核验和合规
- **截图：** `edge_031_F_E02_employee_invalid_id.png`

#### BUG-E05：密码策略不一致（P3 Low）
- **现象：** 初始化向导设置 CEO 密码要求 **≥8位**，而修改密码页校验规则为 **≥6位**
- **根因：** 两处密码长度校验规则硬编码不同：`pages/setup/index.vue` 中 `validateStep` 校验 `≥8`；`pages/me/password.vue` 中使用 `min: 6`
- **影响：** 密码策略不统一，用户体验混乱；6位密码强度弱

#### BUG-E06：费用报销明细金额接受负数（P2 Medium）
- **现象：** 报销申请页，明细金额输入框输入"-100"，前端不拦截，`<input>` 实际值为"-100"
- **根因：** 金额 `<a-input-number>` 未设置 `:min="0"` 或正数校验
- **影响：** 提交负数金额会导致报销总额计算异常或后端错误
- **截图：** `edge_034_F_X02_expense_negative.png`

#### BUG-E07：费用报销金额为0时无前端校验（P3 Low）
- **现象：** 金额填写 0，点击提交，仅触发其他必填字段错误，无"金额必须大于0"提示
- **根因：** 金额字段 Ant Design InputNumber 未设置 `:min="0.01"` 或自定义 `validator`

---

### 6.5 补充测试通过确认

以下安全场景经测试确认**无漏洞**：

| 场景 | 结论 |
|------|------|
| SQL 注入登录绕过 | ✅ 安全（被正确阻断） |
| XSS 用户名登录绕过 | ✅ 安全（被正确阻断） |
| 未登录访问受保护路由 | ✅ 安全（跳转登录页） |
| Employee 越权访问 `/operation-logs`、`/config`、`/role`、`/employees` | ✅ 安全（全部被拦截） |
| 空字段表单提交（登录/修改密码/新增员工/报销申请/请假申请）| ✅ 均有前端校验 |

---

### 6.6 更新后的总 Bug 统计

| 优先级 | 第一轮 | 本轮新增 | 合计 |
|--------|--------|----------|------|
| P0 Critical | 3 | 0 | 3 |
| P1 High | 3 | 1（BUG-E02） | 4 |
| P2 Medium | 7 | 4（BUG-E01/E03/E04/E06） | 11 |
| P3 Low | 5 | 2（BUG-E05/E07） | 7 |
| **合计** | **18** | **7** | **25** |
