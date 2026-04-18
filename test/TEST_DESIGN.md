# 博渊 OA — 测试设计文档（主文档）

> **文档职责**：测试策略、测试范围、各层用例规格，是测试质量的唯一权威来源。  
> **更新规则**：功能变更后必须同步更新本文档，禁止事后补文档。  
> **基准文档**：[DESIGN.md](../DESIGN.md)（业务需求）、[TODO.md](../TODO.md)（开发任务状态）。  
> 最后全量审查日期：**2026-04-17**（对照代码和 DESIGN.md 逐条核实）。

---

## 1 测试策略

### 1.1 测试层架构

```
┌─────────────────────────────────────────────────────┐
│  Layer 4 — 手工验收测试（7角色浏览器走查）             │  ← 发版前执行
├─────────────────────────────────────────────────────┤
│  Layer 3 — E2E 测试（Playwright，test/e2e/）          │  ← 每日构建 / 发版前
├─────────────────────────────────────────────────────┤
│  Layer 2 — API 集成测试（Vitest，test/integration/） │  ← 每次 push
├─────────────────────────────────────────────────────┤
│  Layer 1 — 单元测试（Vitest + JUnit + Mockito）      │  ← 每次 push
└─────────────────────────────────────────────────────┘
```

### 1.2 测试运行命令

| 命令 | 覆盖范围 |
|------|---------|
| `cd server && mvn test` | 后端单元测试（15 个测试类） |
| `cd app/h5 && yarn test` | 前端单元测试（access.test.ts） |
| `yarn test:integration` | API 集成测试（Vitest，需后端运行中） |
| `yarn playwright test` | E2E 全量（需前后端均运行中） |
| `yarn playwright test --grep @smoke` | E2E 冒烟（核心主线） |

### 1.3 流水线触发策略

| 触发时机 | 执行范围 |
|---------|---------|
| 每次 push | 后端单元 + 前端单元 + API 集成测试（后端 mock 模式）|
| 每日构建 | E2E 冒烟（E2E-01 登录 + E2E-05 step 3 薪资 + E2E-06 step 2 日志）|
| 发版前 | E2E 全量 + 手工 7 角色浏览器走查 |

### 1.4 测试数据管理

- 每个 E2E spec 执行前调用 `POST /api/dev/reset` 重置业务数据
- 种子账号来自 `local/seed-data.sql`（dev profile，本地手动执行一次）
- 所有 E2E 元素定位使用 `data-testid` 属性，禁止依赖 CSS class / id
- 测试中创建的数据在 teardown 时由 reset 清理，不人工删除

---

## 2 后端单元测试覆盖矩阵

### 2.1 已覆盖（`server/src/test/java/`）

| 测试类 | 覆盖的服务 | 关键测试场景 |
|--------|-----------|------------|
| `PayrollEngineTest` | PayrollEngine | 周期创建、结算公式（底薪+补贴+绩效+社保）、窗口关闭 |
| `ApprovalFlowServiceTest` | ApprovalFlowService | 审批初始化、APPROVE/REJECT 推进、跳过节点 |
| `FormServiceTest` | FormService | 表单提交、状态查询、权限过滤 |
| `SignatureServiceTest` | SignatureService | 签名绑定、重复绑定拦截 |
| `ProjectServiceImplTest` | ProjectService | CRUD、里程碑、进度更新 |
| `PositionServiceImplTest` | PositionService | 岗位/等级 CRUD、删除有员工时拦截 |
| `EmployeeServiceImplTest` | EmployeeService | 员工创建、修改、停用、唯一性校验 |
| `AccessManagementServiceTest` | AccessManagementService | 角色权限分配、越权校验 |
| `RetentionServiceTest` | RetentionService | 保留期判断、到期触发 |
| `NotificationServiceTest` | NotificationService | 通知创建、标记已读、分类查询 |
| `SetupServiceTest` | SetupService | 向导步骤验证、初始化完成标志 |
| `JwtTokenServiceTest` | JwtTokenService | Token 生成、过期、解析 |
| `ResetCodeStoreTest` | ResetCodeStore | 重置码生命周期（存储/消费/过期）|
| `OaApiIntegrationTest` | Spring 全栈 | 主链路冒烟（H2 in-memory）|
| `AuthControllerTest` | AuthController | 登录、未授权拦截 |
| `AccessControlTest` | 安全配置 | 路由权限矩阵 |

### 2.2 覆盖缺口（需补充）

| 缺失服务 | 原因 / 优先级 |
|---------|-------------|
| `LeaveTypeService` | 假期类型 CRUD 新增，无测试 — P1 |
| `ExpenseService` | 报销提交/审批逻辑无单元测试 — P1 |
| `InjuryService` | 工伤申报/理赔无测试 — P1 |
| `SystemConfigService` | company-name/payroll-cycle/retention 端点新增 — P1 |
| `AttendanceService` (leave/overtime) | 请假时长计算、扣款公式无测试 — P2 |
| `DataExportService` | .obk 文件生成逻辑无测试 — P2 |

---

## 3 前端单元测试覆盖矩阵

### 3.1 已覆盖（`app/h5/test/`）

| 测试文件 | 覆盖范围 | 用例数 |
|---------|---------|-------|
| `access.test.ts` | loginWithAccount（参数校验/API成功/降级）、fetchRoles（失败返回[]）、saveRole（PUT/POST路由、trim/filter）、deleteRole、defaultTestAccounts完整性 | 18 条 |

### 3.2 覆盖缺口（需补充）

| 缺失模块 | 关键场景 | 优先级 |
|---------|---------|-------|
| 请假时长自动计算工具函数 | 开始/结束日期 × 最小单位 → 时长（跨月、跨假期） | P1 |
| 报销金额汇总计算 | 多行明细相加 → 总金额 | P1 |
| 薪资条展示格式化 | 金额格式化、负数扣款标记 | P2 |
| 组织树拖拽校验逻辑 | 循环汇报检测、CEO 节点固定 | P2 |

---

## 4 API 集成测试规格

> 详细测试用例规格见 [test/integration/TEST_DESIGN.md](integration/TEST_DESIGN.md)。
> 执行文件：`test/integration/api.test.ts`
> 前置：后端服务在 `localhost:8080` 运行（不可达时自动跳过）

### 4.1 当前已覆盖（摘要）

M0 健康检查、M1 认证、M1 员工、M2 组织/项目/操作日志、V5 补贴/薪资开关、Phase-B 冒烟 4 条（共约 25 条用例）

### 4.2 待新增（C-INT-01~09）

假期类型、考勤/请假、报销、工伤、系统配置、越权直调（≥15 条）、密码变更、薪资主链，共 8 个测试任务。

---

## 5 E2E 测试规格

> 执行文件：`test/e2e/specs/`
> 详细测试用例见 [test/e2e/TEST_DESIGN.md](e2e/TEST_DESIGN.md)（E2E 专项文档）
> 下方为总体矩阵，以说明覆盖范围和当前状态。

### 5.1 E2E 测试矩阵（当前状态）

| 套件 | 角色 | 设计步骤数 | 已实现步骤 | 关键缺口 |
|------|------|----------|----------|---------|
| E2E-01 | employee | 7 | 3（步骤1/2/4）| 步骤3(薪资)、6(忘记密码)、7(换手机) 未实现 |
| E2E-02 | worker | 5 | 3（步骤1/3/4）| 步骤2(施工日志需FOREMAN)、5(薪资) 未实现 |
| E2E-03 | dept_manager | 4 | 3 **但全用错角色** | 三个测试用 employee 账号替代 dept_manager |
| E2E-04 | pm | 6 | 3（步骤4/5/6）| 步骤1(待办)、2(审批施工日志)、3(驳回) 未实现 |
| E2E-05 | finance | 6 | 3（步骤1/3/4）| 步骤2(预检查)、5(更正申请) 、6(重算) 未完整 |
| E2E-06 | ceo | 9 | 3（步骤2/8/9）| 步骤1/3/4/5/6/7 未实现 |
| E2E-07 | hr | 6 | 3（步骤1/3/5）| 步骤2(岗位CRUD)、4(拖拽org)、6(假期配置) 未实现 |
| E2E-08 | setup wizard | 7 | 4（步骤1/2/4/7）| 步骤3(HR创建)、5(完成向导)、6(CEO首登) 未实现 |
| **E2E-09** | **跨角色审批流** | **— 设计中** | **0（完全未实现）**| 核心缺口：无完整提交→审批→状态验证链路 |

### 5.2 优先补全顺序

1. **E2E-03 角色修复**（将三个测试改用 dept_manager 账号）— 当前测试无效
2. **E2E-09 新增**（跨角色完整审批流）— 当前无任何端到端链路测试
3. **E2E-01 步骤 3**（薪资确认）— 薪资主链 E2E 关键缺失
4. **E2E-07 步骤 6**（假期类型配置）— 对应 A1 任务验收
5. **T4 文件上传**（报销发票必填 E2E 场景）— 对应 A4 验收

### 5.3 E2E 新增：E2E-09 跨角色完整请假审批流

**目的**：验证从提交到审批通过的完整状态转换，是当前最高优先级的缺失测试。

| 步骤 | 操作角色 | 操作 | 断言 | data-testid |
|------|---------|------|------|------------|
| 1 | employee | 提交请假申请（年假 2 天，填原因） | form_record.status = PENDING | `attendance-leave-submit-btn` |
| 2 | employee | 查看"我的记录" | 新记录出现，显示"审批中" | `attendance-record-status` |
| 3 | dept_manager | 登录，进入待办中心 | 该请假申请出现在待办列表 | `todo-item` |
| 4 | dept_manager | 打开申请，填审批意见，点通过 | 弹窗关闭，列表条目消失 | `approval-approve-btn` |
| 5 | employee | 刷新"我的记录" | 该记录状态变为"已通过" | `attendance-record-status` |
| 6 | API 断言 | GET /attendance/records（employee token）| record.status = 'APPROVED' | — |

**驳回后重提流程（同一 spec 内继续）：**

| 步骤 | 操作角色 | 操作 | 断言 |
|------|---------|------|------|
| 7 | employee | 再提一条请假申请 | PENDING |
| 8 | dept_manager | 驳回，填驳回原因"时间冲突" | record.status = REJECTED |
| 9 | employee | 查看记录，驳回原因可读 | DOM 含"时间冲突"文本 |
| 10 | employee | 点"重新发起"，修改日期后提交 | 新 formId（与步骤7不同），status=PENDING |

---

## 6 手工验收测试规格

> 手工测试不可被 E2E 完全替代：文件预览、PDF 渲染、签名画布、UI 响应式布局需人眼验证。

### 6.1 发版前 7 角色浏览器走查清单

每角色按以下顺序操作，全部通过后记录结论：

#### CEO 走查
- [ ] 登录后工作台待办角标有值（非 0）
- [ ] 侧边栏可见：首页/人员管理/组织架构/审批设置/薪资设置/操作日志/数据导出/数据文件查看
- [ ] `/config` 三个配置区域（企业名/薪资周期/数据保留期）均可加载并保存
- [ ] `/positions` 可新增岗位和等级
- [ ] `/role` 显示 ≥7 个内置角色（含 hr/department_manager）
- [ ] `/operation-logs` 分页数据正常
- [ ] `/data-export` 可选时间范围并触发下载
- [ ] `/data-viewer` 提示上传".obk"格式（非".zip"）

#### HR 走查
- [ ] 侧边栏可见：首页/人员管理/组织架构管理/岗位与等级管理/假期配额管理/通知中心
- [ ] `/employees` 可看到员工列表，可新增员工（性别/部门/岗位/等级/角色字段齐全）
- [ ] `/leave-types` 可新增假期类型，可设置配额/扣款比例

#### Finance 走查
- [ ] 侧边栏可见：薪资管理/岗位薪资配置/社保配置/项目成本/营收管理/报销审批/工伤理赔
- [ ] `/payroll` 可走完"创建周期→结算→发放"全流程
- [ ] `/injury` 可看到工伤申报列表，可录入理赔金额

#### PM 走查
- [ ] `/projects/[id]` 六个 Tab（里程碑/成本/营收/施工日志审批/第二角色/售后）均可打开
- [ ] 施工日志审批 Tab 可审批通过/驳回

#### Employee 走查
- [ ] `/attendance` 请假时长自动计算；附件可上传；假种有选项
- [ ] `/expense/apply` 发票上传为必填（不上传无法提交）
- [ ] `/payroll` 可看到工资条并确认签收

#### Worker 走查
- [ ] 侧边栏可见考勤入口
- [ ] `/attendance` 可提交请假申请，假种有选项
- [ ] `/injury` 三个独立字段（受伤时间/医生诊断/事故经过）均可填写

#### DeptManager 走查
- [ ] 工作台顶部待办角标显示真实数值（非 0）
- [ ] 待办中心可看到本部门员工的 PENDING 单据
- [ ] 审批通过后单据从待办消失，员工记录状态更新

### 6.2 专项手工测试：文件上传验证

> 无法通过 E2E 完整验证服务端存储成功与否，需人工检查。

- [ ] 报销申请：上传 JPG（< 5MB）→ 提交 → 进入详情页 → 附件链接可点击并打开
- [ ] 报销申请：上传超大文件（> 10MB）→ 前端或后端拒绝，显示错误提示
- [ ] 工伤申报：上传 PDF 附件 → 提交 → 详情可见附件
- [ ] 通讯录导入：上传正确 CSV → 预览正确 → 导入成功

### 6.3 安全手工测试

> 对照 BUG-E02 修复状态，验证前端路由守卫覆盖完整性：

- [ ] employee 账号尝试直接访问 `/data-export` → 重定向到首页
- [ ] employee 账号尝试直接访问 `/data-viewer` → 重定向到首页
- [ ] worker 账号尝试访问 `/employees` → 重定向到首页
- [ ] worker 账号尝试访问 `/payroll` → 重定向到首页

---

## 7 已知缺陷追踪

### 7.1 手工测试发现缺陷（2026-04-17，共 25 条）

> 完整记录见 [test/manual-test-2026-04-17/TEST_REPORT.md](manual-test-2026-04-17/TEST_REPORT.md)，TODO 对应任务见 [TODO.md](../TODO.md) §A10。

| 缺陷 ID | 严重级 | 简述 | TODO 任务 | 状态 |
|--------|-------|------|---------|------|
| BUG-01 | P0 | HR 无法读取员工/岗位数据（@PreAuthorize 缺 HR 角色） | A10-P0 | 待修复 |
| BUG-02 | P0 | PM 无法读取团队成员（@PreAuthorize 缺 PM 角色） | A10-P0 | 待修复 |
| BUG-03 | P0 | 报销类型 API 500，expense_type_def 无种子数据 | A10-P0 | 待修复 |
| BUG-04 | P1 | 系统配置 API 全部 404 | A10-P1 | 待修复 |
| BUG-05/06 | P1 | 请假类型 API 404，考勤/假期配额失效 | A10-P1 | 待修复 |
| BUG-E02 | P1 | Employee 可访问 /data-export（路由守卫漏洞） | A10-P1 | 待修复 |
| BUG-07 | P2 | HR 侧边栏缺 /leave-types 入口 | A10-P2 | 待修复 |
| BUG-08 | P2 | Worker 侧边栏缺 /attendance 入口 | A10-P2 | 待修复 |
| BUG-09 | P2 | 角色管理仅显示 5 个角色 | A10-P2 | 待修复 |
| BUG-10 | P2 | CEO 侧边栏缺 3 个入口 | A10-P2 | 待修复 |
| BUG-11 | P2 | HR 访问 /payroll 被重定向 | A10-P2 | 待产品确认 |
| BUG-12 | P2 | Finance 工伤页面 403 | A10-P2 | 待修复 |
| BUG-13 | P2 | 工作台待办角标对多角色恒为 0 | A10-P2 | 待修复 |
| BUG-E03 | P2 | 密码修改错误 Toast 暴露 HTTP 状态码 | A10-P2 | 待修复 |
| BUG-14~18 | P3 | 种子数据缺失、文案错误 | A10-P3 | 待修复 |
| BUG-E01 | P3 | 初始化向导手机号无格式校验 | A10-P3 | 待修复 |
| BUG-E04 | P3 | 员工身份证号无 18 位校验 | A10-P3 | 待修复 |
| BUG-E05 | P3 | 密码策略前后端不一致 | A10-P3 | 待修复 |
| BUG-E06/07 | P3 | 报销金额接受负数和零 | A10-P3 | 待修复 |

---

## 8 测试覆盖率目标

| 层 | 当前状态 | 目标 |
|---|---------|------|
| 后端单元测试 | 约 60%（核心服务已覆盖，LeaveType/Expense/Injury/Config 未覆盖）| ≥ 80% |
| 前端单元测试 | 约 5%（仅 access.ts）| ≥ 60%（核心工具函数）|
| API 集成测试 | 约 30%（M0-M2+V5 覆盖，Expense/Injury/Config/LeaveType 未覆盖）| ≥ 80% |
| E2E 主链路 | 约 15%（无完整跨角色流）| ≥ 70%（7 角色主线均通过）|
