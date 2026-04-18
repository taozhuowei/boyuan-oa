# 测试覆盖缺口分析

> **基准**：2026-04-17 全量审查（手工测试 Round 1+2，代码审查，对照 DESIGN.md）  
> **对标标准**：等价类划分、边界值分析、状态转换测试、场景测试（ISTQB 基础级）  
> **已规划修复**：缺口对应的 TODO 任务见 [TODO.md](../TODO.md) §A10（bug 修复）、§T0-T6（测试任务）
> **详细用例规格**：[TEST_DESIGN.md](TEST_DESIGN.md)（主文档）、[e2e/TEST_DESIGN.md](e2e/TEST_DESIGN.md)（E2E 详情）

---

## 一、各层已覆盖情况

### 后端单元测试（`server/src/test/java/`）
已覆盖：PayrollEngine、ApprovalFlowService、FormService、SignatureService、ProjectService、PositionService、EmployeeService、AccessManagementService、RetentionService、NotificationService、SetupService、JWT、ResetCode、AuthController、AccessControl（15个测试类）

### 前端单元测试（`app/h5/test/`）
已覆盖：`access.ts`（loginWithAccount、fetchRoles、saveRole、deleteRole、defaultTestAccounts，18条用例）

### API 集成测试（`test/integration/api.test.ts`）
已覆盖：M0健康检查、M1认证5条、M1员工4条、M2组织/项目/操作日志5条、V5补贴/薪资开关4条、Phase-B冒烟4条（共约25条）

### E2E 测试（`test/e2e/specs/`）
8个spec文件，但：
- 无任何完整跨角色审批流
- E2E-03全部使用错误账号（employee替代dept_manager）
- 全部8个套件均有缺失步骤（详见 [e2e/TEST_DESIGN.md](e2e/TEST_DESIGN.md) 状态列）

### 手工测试（`test/manual-test-2026-04-17/`）
已执行：7角色页面可访问性、基础安全（SQL注入/XSS/越权）、表单必填校验、部分边界值  
发现：**25个缺陷**（P0×3、P1×4、P2×8、P3×10）

---

## 二、缺口清单（按优先级）

### 2.1 P0 — 核心业务阻断（须在任何测试前修复）

| 缺口 | 来源 | 影响 |
|------|------|------|
| HR 无法读取员工/岗位 API（BUG-01）| 后端 @PreAuthorize 漏写角色 | HR 所有员工相关操作失效 |
| PM 无法读取团队成员 API（BUG-02）| 后端 @PreAuthorize 漏写角色 | PM 团队管理失效 |
| 报销类型 API 500（BUG-03）| expense_type_def 无种子数据 | 全员报销申请无法使用 |

### 2.2 P1 — 接口缺失 / 权限泄露

| 缺口 | 来源 | 影响 |
|------|------|------|
| 系统配置 API 全部 404（BUG-04）| SystemConfigController 未实现 3 对端点 | CEO 无法配置企业名/薪资周期/保留期 |
| 请假类型 API 404（BUG-05/06）| 后端服务未重启 + 无种子数据 | 全员请假/假期配额失效 |
| Employee 可访问 /data-export（BUG-E02）| auth.global.ts 路由守卫漏配 | 数据出口权限泄露 |

### 2.3 P1 — API 集成测试完全未覆盖的模块

当前 `api.test.ts` 未覆盖以下接口（这些接口在 A10 修复后须补测试）：

- 假期类型 CRUD（GET/POST/DELETE /config/leave-types）
- 考勤/请假提交与审批（POST/GET /attendance/leave, POST /attendance/{id}/approve）
- 报销申请与审批（GET/POST /expense, POST /expense/{id}/approve）
- 工伤申报与理赔（POST/GET /injury, PUT /injury/{id}/compensation）
- 系统配置（GET/PUT /config/company-name|payroll-cycle|retention-period）
- 密码修改（POST /auth/change-password，错误/正确/短密码三场景）
- 薪资结算链（PUT /payroll/cycles/{id}/settle, POST /payroll/slips/{id}/confirm）
- 越权直调 ≥15 条（当前仅 3 条）

### 2.4 业务流程端到端（E2E）—— 无完整链路

**当前状态**：没有任何一条完整的业务流程从提交到审批通过被 E2E 验证。

核心缺口：
- 员工提交请假 → 部门经理审批通过 → 状态变 APPROVED ← 核心主链，完全未实现
- 员工提交报销（含发票上传）→ 财务审批 → 报销金额计入工资单
- 工人提交工伤申报 → 财务录入理赔 → 审批通过
- 申请被驳回 → 员工查看驳回原因 → 修改重提

### 2.5 状态机转换测试 —— 未覆盖

| 实体 | 状态转换 | 测试状态 |
|------|---------|---------|
| 表单审批 | PENDING → APPROVED | ❌ |
| 表单审批 | PENDING → REJECTED | ❌ |
| 表单审批 | REJECTED → PENDING（重提）| ❌ |
| 薪资周期 | OPEN → SETTLED | ⚠️（api.test.ts有，但无断言 cycle.status）|
| 薪资周期 | SETTLED → LOCKED → UNLOCKED | ❌ |
| 员工账号 | ACTIVE → DISABLED（停用后登录被拒）| ⚠️（e2e_06 有实现，但停用后登录验证缺失）|
| 工资条 | 待确认 → 已确认 | ❌ |
| 工资条 | v1 → SUPERSEDED（更正后）| ❌ |

### 2.6 CRUD 完整性 —— 只测了 Read

| 模块 | Create | Update | Delete | 约束测试 |
|------|--------|--------|--------|---------|
| 员工 | ⚠️（缺必填字段断言）| ✅（手机号）| ❌ | ❌（停用登录验证）|
| 岗位 | ❌ | ❌ | ❌ | ❌（有员工时不可删）|
| 假期类型 | ❌ | ❌ | ❌ | ❌ |
| 项目 | ❌ | ❌ | ❌ | ❌ |
| 里程碑 | ❌ | ❌ | ❌ | ❌ |
| 补贴 | ✅（V5 api.test.ts）| ✅ | ✅ | ✅（403）|
| 角色 | ❌ | ❌ | ❌ | ❌ |

### 2.7 文件上传 —— 未覆盖

- 报销申请发票附件：必填拦截 / 有效上传 / 详情可访问
- 工伤申报附件上传
- 通讯录 CSV 导入（有效/无效列名/空文件）
- 施工日志附件上传
- 工程合同附件上传

### 2.8 数字计算准确性 —— 未覆盖

- 报销明细多行汇总：3行(100/200/300) → 总额显示 600
- 请假时长自动计算：选择 2 天 → "2天"出现在时长字段
- 加班时长自动计算：开始/结束时间差
- 工资单合计公式：底薪 + 各项补贴 + 加班费 - 请假扣款 - 社保 = 实发（结算后验证）

### 2.9 日期与时间边界 —— 部分缺失

- 请假结束日期早于开始日期 → 应校验拒绝（❌ 未测）
- 请假时长跨月（跨两个薪资周期）→ 扣款计入哪个周期（❌ 未测）
- 加班申报填写过去日期（窗口期外）→ 应拒绝（❌ 未测）
- 薪资周期日期重叠 → 创建第二个周期时应检查冲突（❌ 未测）

### 2.10 前端单元测试 —— 大面积缺失

当前仅 `access.ts` 有测试，以下核心工具函数缺测：
- 请假时长计算函数（跨天/跨假期/按小时最小单位）
- 报销金额汇总计算
- 薪资条金额格式化（负数/千分位）
- 组织树循环汇报检测

### 2.11 后端单元测试 —— 新增服务无测试

`LeaveTypeService`、`ExpenseService`、`InjuryService`、`SystemConfigService`、`AttendanceService`（leave/overtime 逻辑）均无单元测试。

---

## 三、缺口修复优先级

| 优先级 | 动作 | TODO 任务 |
|-------|------|---------|
| 立即 | 修复 P0 bug（HR/PM权限、报销类型种子数据）| A10-P0 |
| 立即 | 修复 P1 bug（Config API、请假类型、路由守卫）| A10-P1 |
| 近期 | T0 API 集成测试扩展（假期/报销/工伤/配置/安全）| T0 |
| 近期 | E2E-09 跨角色请假审批完整流（最高优先级 E2E）| T1 |
| 近期 | E2E-03 角色修复（用 dept_manager 替换 employee）| — |
| 中期 | T1-T3 E2E CRUD + 状态机测试 | T1-T3 |
| 中期 | T4 文件上传专项测试 | T4 |
| 中期 | T5 表单边界回归测试（对应 P3 bug 修复验证）| T5 |
| 后期 | 前端单元测试扩充（时长计算/金额汇总）| — |
| 后期 | 后端单元测试补全（LeaveType/Expense/Injury/Config）| — |
