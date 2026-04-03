# 博渊 OA 平台 — 测试设计文档

> **文档职责**：定义博渊项目的测试策略、各层级测试用例设计，覆盖平台层和建筑工程版所有业务路径。
>
> **目标读者**：QA、后端开发者、前端开发者。
>
> **关联文档**：业务规则见 `DESIGN.md`；API 规范见 `ARCHITECTURE.md`；测试账号数据见后端 `db/data.sql`（dev profile 专用）。

---

## 1. 测试策略

| 测试层级       | 目标                                   | 工具                                      | 执行时机    |
|--------------|----------------------------------------|-------------------------------------------|-----------|
| 单元测试       | 验证单个 Service/工具类的纯逻辑             | JUnit 5 + Mockito（后端）/ Vitest（前端）   | 每次提交前  |
| 集成测试       | 验证 Controller + Service + DB 接口契约   | Spring Boot Test + H2 / Testcontainers    | 每日构建   |
| 系统/E2E 测试  | 验证完整业务路径（按角色视角，含数据库状态）   | Playwright + API 脚本（`app/tests/`）      | 阶段提测前  |
| 回归测试       | 防止新改动破坏已有功能                     | 自动化测试套件全量执行                       | 每次发版前  |

**覆盖率要求**：后端 Service 层 ≥ 80%；算薪引擎 / 审批流引擎 / 签名存证核心路径 100%。

---

## 2. 单元测试

### 2.1 后端单元测试（JUnit 5 + Mockito）

覆盖目标：Service 层纯业务逻辑、工具类、引擎核心分支。

| 模块      | 测试类                          | 关键断言                                                                       |
|----------|--------------------------------|-------------------------------------------------------------------------------|
| 认证      | `JwtTokenServiceTest`          | Token 生成/解析/过期校验（dev 24h / prod 2h）；payload 含 userId/roleCode/employeeType |
| 权限      | `PermissionServiceTest`        | OFFICE 角色过滤施工日志/工伤菜单；LABOR 角色可见施工日志/工伤                    |
| 审批流    | `ApprovalFlowServiceTest`      | 提交后状态 PENDING；PM 初审通过后状态 APPROVING；CEO 终审后状态 APPROVED          |
| 审批路由  | `ApprovalFlowEngineTest`       | 工伤补偿：提交人是 project_manager 时 skipCondition 触发，初审节点标记 SKIPPED    |
| 薪资计算  | `PayrollServiceTest`           | 基本工资 + 加班费 + 自定义费目合计；社保 COMPANY_PAID 模式正确扣款；description 字段写入 PayrollSlipItem |
| 窗口期    | `PayrollWindowTest`            | 窗口期到期前 `closeWindow()` 方法不存在；`PayrollWindowScheduler` 到期自动锁定     |
| 预结算    | `PayrollSettleValidationTest`  | 有 PENDING_REVIEW 的异议单 → 检查失败；有 CALCULATING 任务 → 检查失败；两项均通过才可结算 |
| 签名存证  | `SignatureServiceTest`         | PIN 码 bcrypt 哈希存储；工资单内容 SHA-256 哈希；PDF 生成含时间戳水印              |
| 数据保留  | `RetentionServiceTest`         | 到期前 30 天生成 RetentionReminder；retentionYears 无 -1 值（无永久类型）          |
| 清理任务  | `CleanupServiceTest`           | 先删物理文件再删 DB；失败进重试队列；FAILED 状态写入 cleanup_task                  |
| 重置密码  | `AuthServiceTest`              | resetToken TTL 10 min；过期后 reset-password 返回 401；成功后旧密码不可用          |
| 修改手机号 | `EmployeePhoneServiceTest`    | identityToken TTL 5 min；新手机号已存在时返回 409；成功后 sys_user.phone 更新       |

**示例：工伤动态路由（skipCondition）**
```java
@Test
void injuryApproval_projectManagerSubmitter_shouldSkipFirstReview() {
    // 配置工伤审批流：节点1 skipCondition = { type:SUBMITTER_ROLE_MATCH, roleCode:project_manager }
    var flow = buildInjuryFlowWithSkipCondition("project_manager");
    var record = approvalFlowEngine.submit("INJURY", pmEmployee, data, flow);
    var firstNode = record.getNodes().get(0);
    assertEquals(NodeStatus.SKIPPED, firstNode.getStatus());
    // 直接推进到节点2（CEO终审）
    assertEquals(NodeStatus.PENDING, record.getNodes().get(1).getStatus());
}

@Test
void injuryApproval_regularWorkerSubmitter_shouldFollowNormalFlow() {
    var flow = buildInjuryFlowWithSkipCondition("project_manager");
    var record = approvalFlowEngine.submit("INJURY", workerEmployee, data, flow);
    // 普通劳工提交，不触发跳过
    assertEquals(NodeStatus.PENDING, record.getNodes().get(0).getStatus());
}
```

**示例：预结算2项强制检查**
```java
@Test
void settle_withPendingDispute_shouldFail() {
    payrollSlipRepo.save(buildSlip(PENDING_REVIEW));
    var result = payrollEngine.checkPrerequisites(cycleId);
    assertFalse(result.canSettle());
    assertTrue(result.getFailReasons().contains("PENDING_REVIEW_EXISTS"));
}

@Test
void settle_withCalculatingCycle_shouldFail() {
    payrollCycleRepo.save(buildCycle(CALCULATING));
    var result = payrollEngine.checkPrerequisites(cycleId);
    assertFalse(result.canSettle());
    assertTrue(result.getFailReasons().contains("CALCULATING_EXISTS"));
}
```

### 2.2 前端单元测试（Vitest + Vue Test Utils）

覆盖目标：组件渲染、权限过滤、HTTP 层行为、表单校验。

| 组件/模块        | 测试文件                         | 关键断言                                                              |
|----------------|----------------------------------|----------------------------------------------------------------------|
| 登录页           | `LoginPage.spec.ts`              | 成功后 userStore 写入 employeeType/positionId；忘记密码链接可点击       |
| HTTP 层          | `http.spec.ts`                   | 401 自动跳转登录；同 URL 并发请求被防重提交拦截；自动携带 X-Client-Type   |
| 权限过滤          | `permissionUtils.spec.ts`        | OFFICE 角色过滤施工日志/工伤菜单；LABOR 角色可见并不可见 payroll 入口    |
| 忘记密码页        | `ForgotPassword.spec.ts`         | 4步 Step 正确推进；resetToken 写入临时 store；成功后跳转登录页           |
| 签名画板          | `SignatureCanvas.spec.ts`        | getBase64() 返回非空字符串；clear() 清空画布；H5/MP 双端渲染             |
| usePageConfig   | `usePageConfig.spec.ts`          | 同 routeCode 第二次不重复请求（session 缓存）；不同角色返回不同字段配置    |

**示例：HTTP 防重复提交**
```typescript
test('concurrent requests to same URL are deduplicated', async () => {
  const mockApi = vi.fn(() => Promise.resolve({ data: {} }))
  const p1 = request('/api/test', { method: 'POST' })
  const p2 = request('/api/test', { method: 'POST' })
  await Promise.all([p1, p2])
  expect(mockApi).toHaveBeenCalledTimes(1)
})
```

---

## 3. 集成测试

### 3.1 API 集成测试（Spring Boot Test + @AutoConfigureMockMvc）

覆盖目标：HTTP 接口的认证、参数校验、权限控制、数据库状态变更。

#### 认证与账号

| 接口                              | 场景                  | 期望                                         |
|----------------------------------|----------------------|---------------------------------------------|
| `POST /auth/login`               | 正确账号密码           | 200 + JWT；payload 含 userId/roleCode/employeeType |
| `POST /auth/login`               | 错误密码              | 401                                          |
| `POST /auth/login`               | 账号不存在            | 401（不区分"账号错误"/"密码错误"）              |
| `POST /auth/send-reset-code`     | 手机号存在            | 200；验证码发送（NoOpSmsService 打印日志）      |
| `POST /auth/send-reset-code`     | 手机号不存在          | 404                                          |
| `POST /auth/verify-reset-code`   | 验证码正确            | 200 + resetToken（TTL 10 min）               |
| `POST /auth/verify-reset-code`   | 验证码错误            | 400                                          |
| `POST /auth/reset-password`      | resetToken 有效      | 200；旧密码不可登录；新密码可登录              |
| `POST /auth/reset-password`      | resetToken 过期      | 401                                          |
| `POST /employees/me/phone/...`   | 完整修改手机号流程     | 最终 PUT 后 sys_user.phone 已更新；旧号码不可发验证码 |

#### 权限隔离

| 接口                              | 角色          | 期望    |
|----------------------------------|--------------|--------|
| `POST /payroll/cycles/{id}/settle` | finance    | 200    |
| `POST /payroll/cycles/{id}/settle` | ceo        | 403    |
| `GET /payroll/slips`              | employee    | 仅返回本人 |
| `GET /payroll/slips`              | finance     | 返回全部  |
| `POST /forms/injury`             | worker      | 201    |
| `POST /forms/injury`             | employee    | 403    |
| `GET /feedback`                  | sysadmin    | 200    |
| `GET /feedback`                  | ceo         | 403    |

#### 数据库状态断言

| 操作                      | 断言                                                                     |
|--------------------------|-------------------------------------------------------------------------|
| 审批通过                  | `form_record.status = APPROVED`；生成一条 `approval_record`              |
| 正式结算                  | `payroll_cycle.locked = true`；生成对应员工的 `payroll_slip`              |
| 工资条确认                | `payroll_confirmation` 新增记录（含 IP/时间/设备）；存证 PDF 文件落盘        |
| 工伤提交（PM提交）          | 第一个审批节点 `status = SKIPPED`；第二个节点 `status = PENDING`           |
| 清理任务失败              | `cleanup_task.status = FAILED`；`notification` 表生成 sysadmin 通知       |
| 到期前30天               | `retention_reminder` 表新增记录；CEO 收到 notification                     |
| operation_log 到期       | 物理删除（无 `deleted` 软删除字段）；相同 id 查询返回 null                   |

**示例：签名存证断言**
```java
@Test
void confirmPayroll_shouldGenerateEvidenceChain() throws Exception {
    // 提交签名确认
    mockMvc.perform(post("/payroll/slips/1/confirm")
        .content("{\"pin\":\"123456\",\"signatureData\":\"base64...\"}"))
        .andExpect(status().isOk());

    // 验证 PDF 文件落盘
    var pdf = storageService.get("payroll/1/confirmation.pdf");
    assertTrue(pdf.exists());

    // 验证证据链完整
    var confirmation = payrollConfirmationRepo.findBySlipId(1L);
    assertNotNull(confirmation.getSignatureHash());
    assertNotNull(confirmation.getContentHash());
    assertNotNull(confirmation.getConfirmedAt());
}
```

### 3.2 Sysadmin 初始化向导集成测试

| 步骤 key         | done=true 的含义                 | 测试断言                                                |
|----------------|----------------------------------|---------------------------------------------------------|
| `company_info`  | 公司名称 / Logo 已写入 sys_config | `sys_config.company.name` 不为空                        |
| `init_accounts` | 至少一个 CEO 账号已创建           | `sys_user` 含 roleCode=ceo 的记录；可登录               |
| `payroll_config`| 结算周期配置已写入               | `sys_config.payroll.*` 写入；payroll_cycle 可创建        |
| `preset_loaded` | preset-construction.sql 已执行   | `sys_role` / `approval_flow_def` / `retention_policy` 有预置数据 |
| `wizard_done`   | 向导完成，不可重入               | 再次 GET /setup/wizard 返回 303 跳转到工作台              |

---

## 4. 系统/E2E 测试（按角色全流程）

### 4.1 测试原则

- 每个角色覆盖**至少一条核心主线**，主线需验证数据库最终状态，不仅是页面反馈
- 测试账号来自 `app/backend/src/main/resources/db/data.sql`（dev profile）
- E2E 执行前通过 `POST /test/reset` 重置业务数据（保留账号/配置）

### 4.2 员工主线（employee.demo）

| 步骤 | 操作             | 期望结果                                        | DB 断言                               |
|-----|------------------|-------------------------------------------------|--------------------------------------|
| 1   | 登录 Web 端       | 进入工作台，可见请假/加班入口，无施工日志/工伤入口   | `sys_user.last_login_at` 已更新        |
| 2   | 发起请假申请       | 提交成功，列表状态"待初审"                         | `form_record.status = PENDING`        |
| 3   | 查看待确认工资条   | 仅显示本人工资单，状态"待确认"                     | `payroll_slip.employee_id = 本人 id`  |
| 4   | 完成电子签名绑定   | 绑定成功，工作台签名状态变为已绑定                  | `employee_signature` 新增记录          |
| 5   | 确认工资条         | 成功，存证 PDF 生成，状态"已确认"                  | `payroll_confirmation` 新增；PDF 落盘  |
| 6   | 忘记密码流程       | 4步完成，新密码可登录，旧密码不可用                 | `sys_user.password_hash` 已更新        |
| 7   | 修改手机号         | 3步弹窗完成，个人档案脱敏显示新号码                 | `sys_user.phone` 已更新                |

### 4.3 劳工主线（worker.demo）

| 步骤 | 操作               | 期望结果                                            | DB 断言                                    |
|-----|--------------------|-----------------------------------------------------|-------------------------------------------|
| 1   | 登录小程序          | 工作台可见施工日志/工伤入口，无薪资管理入口              | —                                         |
| 2   | 提交施工日志         | 填写项目/天气/工作内容，提交成功，列表出现新记录          | `construction_log_summary` 新增            |
| 3   | 发起工伤补偿         | 填写基本信息（无补偿金额字段），提交成功，状态"待初审"     | `injury_claim` 新增；`form_record.status = PENDING` |
| 4   | 查看待办            | 无审批权限，待办为空                                  | —                                         |
| 5   | 确认工资条           | 小程序内签名并确认，成功后状态"已确认"                  | `payroll_confirmation` 新增；PDF 落盘       |

### 4.4 项目经理主线（pm.demo）

| 步骤 | 操作                       | 期望结果                                        | DB 断言                                           |
|-----|----------------------------|------------------------------------------------|--------------------------------------------------|
| 1   | 查看待办                    | 显示员工/劳工提交的 PENDING 单据                  | —                                                |
| 2   | 初审通过请假单               | 状态变"待终审"，从待办消失                         | `form_record.status = APPROVING`                 |
| 3   | 初审驳回加班单               | 状态变"已驳回"，申请人可重新发起                    | `form_record.status = REJECTED`                  |
| 4   | 审批施工日志                 | 通过后归档                                       | `construction_log_summary.status = APPROVED`     |
| 5   | **发起工伤补偿（关键路径）** | PM 本人提交工伤，初审节点自动 SKIPPED，直接进 CEO 终审 | 第一审批节点 `status = SKIPPED`；第二节点 `status = PENDING` |

### 4.5 CEO 主线（ceo.demo）

| 步骤 | 操作               | 期望结果                                                  | DB 断言                                     |
|-----|--------------------|---------------------------------------------------------|---------------------------------------------|
| 1   | 查看待办            | 显示初审通过（APPROVING）的单据                             | —                                           |
| 2   | 终审通过请假单       | 状态"已通过"，员工可查看归档记录                             | `form_record.status = APPROVED`             |
| 3   | 配置角色权限         | 新增角色并分配权限码，重新登录即时生效                        | `sys_role` + `permission` 新增记录           |
| 4   | 查看工资确认协议     | 可上传/预览协议文件                                        | `salary_confirmation_agreement` 新增版本     |
| 5   | 查看到期提醒         | 显示 30 天内到期的数据保留提醒                               | `retention_reminder` 有记录                  |
| 6   | 选择"导出后删除"     | 异步导出任务创建，72 小时内可下载链接                        | `export_backup_task.status = PENDING→DONE`  |
| 7   | 审批薪资更正         | 解锁周期后财务可重新结算                                    | `payroll_cycle.locked = false`              |

### 4.6 财务主线（finance.demo）

| 步骤 | 操作                | 期望结果                                              | DB 断言                                          |
|-----|---------------------|-----------------------------------------------------|--------------------------------------------------|
| 1   | 查看窗口期状态       | 显示当前周期窗口期剩余时间，各员工数据完整状态              | `payroll_cycle.window_status = OPEN`             |
| 2   | 预结算检查           | 2 项强制检查全通过，"发起结算"激活；无"例外申请"按钮        | —                                                |
| 3   | 执行正式结算         | 周期锁定，员工端工资条"待确认"                           | `payroll_cycle.locked = true`；工资条生成         |
| 4   | 录入工伤理赔金额     | 对已归档工伤记录录入金额，可关联到当前薪资周期             | `injury_claim.compensation_amount` 已更新         |
| 5   | 发起薪资更正         | 申请 CEO 审批解锁                                     | 审批记录 `status = PENDING`（等待 CEO）           |
| 6   | 重新结算             | CEO 审批后版本递增（v1→v2），历史版本保留               | `payroll_slip.version = 2`；旧版本 `status = SUPERSEDED` |

### 4.7 Sysadmin 主线（初始化 + Admin 控制台）

| 步骤 | 操作                     | 期望结果                                                  | DB 断言                                    |
|-----|--------------------------|----------------------------------------------------------|--------------------------------------------|
| 1   | 初次登录，进入初始化向导   | 5步向导全部展示，无法跳过                                   | —                                          |
| 2   | Step 1：填写公司信息       | 公司名称/Logo 上传成功，`company_info done=true`            | `sys_config.company.name` 写入              |
| 3   | Step 2：创建初始账号       | 系统自动生成员工号，初始密码 123456，`init_accounts done=true` | `sys_user` + `employee` 新增；可用密码登录  |
| 4   | Step 5：确认数据保留策略   | 展示所有类型默认1年（只读），`wizard_done done=true`         | `sys_retention_policy` 有全部类型记录       |
| 5   | 进入 Admin 控制台         | 4个 Tab 可见：系统状态/集成配置/用户反馈/系统日志            | —                                          |
| 6   | 查看用户反馈              | 显示所有角色提交的 feedback，可标记已解决                   | `feedback.status = RESOLVED` 更新          |
| 7   | 再次访问向导              | 重定向到 Admin 控制台（向导不可重入）                        | —                                          |

---

## 5. 关键边界与异常路径

### 5.1 认证安全

| 场景                        | 输入                            | 期望                              |
|----------------------------|---------------------------------|----------------------------------|
| JWT 过期                    | 过期 Token 请求任意接口           | 401；前端自动跳转登录页            |
| resetToken 过期             | 超过 10 分钟调用 reset-password  | 401                               |
| 重复发送验证码               | 60 秒内再次发送                  | 429 Too Many Requests            |
| 新手机号已被其他账号绑定      | PUT /employees/me/phone          | 409 Conflict                     |
| identityToken 使用后再次使用 | 复用已消费的 identityToken       | 401                               |

### 5.2 薪资边界

| 场景                        | 输入                            | 期望                              |
|----------------------------|---------------------------------|----------------------------------|
| 有 PENDING_REVIEW 异议单    | 发起结算                         | 400；返回未解决异议单数量           |
| 窗口期提前关闭               | 调用 closeWindow()              | 编译期不存在此方法（无此接口）       |
| PayrollItemDef description  | 自定义费目含说明字段              | 工资条明细行展示 description 文本   |
| 工资条旧版本                 | 1年后到期                        | 物理删除；`payroll_slip.version=1` 记录消失 |

### 5.3 数据保留

| 场景                        | 期望                              |
|----------------------------|---------------------------------|
| 任意数据类型 retentionYears = -1 | 数据库约束/应用层校验拒绝（无永久类型） |
| operation_log 到期          | 物理删除（无逻辑删除字段）           |
| 清理任务失败 N 天后（N≥3）    | SmsService 触发短信提醒（P3，NoOp 阶段打日志） |

### 5.4 表单输入校验

| 场景              | 输入           | 期望                       |
|-----------------|---------------|---------------------------|
| 请假天数为 0      | days = 0      | 400；提示天数必须大于 0      |
| 加班时长超过 24h   | hours = 25    | 400                        |
| 工伤金额字段      | 提交时含 amount | 忽略（Finance 事后录入）     |
| 空附件（必填）    | 未选文件提交    | 400                        |

---

## 6. 测试数据管理

### 6.1 固定测试账号（dev profile）

账号数据来自 `app/backend/src/main/resources/db/data.sql`（仅 H2 dev profile 加载，不进生产）：

| 账号           | 角色          | 员工类型 | 用途              |
|--------------|---------------|---------|------------------|
| employee.demo | employee      | OFFICE  | 普通员工主线测试   |
| worker.demo   | worker        | LABOR   | 劳工主线测试       |
| pm.demo       | project_manager | OFFICE | 审批/PM主线测试   |
| ceo.demo      | ceo           | OFFICE  | CEO 管理/终审测试  |
| finance.demo  | finance       | OFFICE  | 薪资结算测试       |

> dev 环境默认密码 `123456`（bcrypt 哈希存储）。

### 6.2 隔离策略

- **单元测试**：Mockito 完全 Mock 依赖，无 DB 访问
- **集成测试**：`@Transactional` 每个用例后回滚；或使用 `@DirtiesContext` + H2 重置
- **E2E 测试**：每次执行前调用 `POST /test/reset`，清理业务数据（保留账号/配置/预置数据）

---

## 7. 测试执行命令

```bash
# 后端单元 + 集成测试（覆盖率报告）
cd app/backend && mvn test jacoco:report

# 前端单元测试
cd app/frontend && npm run test:web

# 前端类型检查
cd app/frontend && npm run type-check

# E2E 核心链路（需先启动 dev 服务）
cd app/tests && node run-e2e.js --suite smoke
```

---

## 8. 缺陷管理

### 8.1 缺陷分级

| 级别          | 定义                       | 示例                              |
|-------------|---------------------------|----------------------------------|
| P0-Critical  | 阻塞主流程，系统不可用        | 登录失败、结算导致数据错误            |
| P1-High      | 核心功能异常，有 workaround  | 审批通过后未归档、工资条数据错误       |
| P2-Medium    | 一般功能异常                | 筛选条件失效、通知未触发              |
| P3-Low       | 轻微问题                   | 文案错误、日志警告                   |

### 8.2 P0/P1 必须补充自动化用例

修复 P0/P1 缺陷后，**必须**在对应测试类增加回归用例，防止复现。用例合并到当次 fix PR 一并提交。

### 8.3 缺陷记录格式

```markdown
| 测试项 | 期望结果 | 实际结果 | 修复状态 |
|---|---|---|---|
```

---

## 变更记录

| 日期        | 内容                                                                                         |
|-----------|----------------------------------------------------------------------------------------------|
| 2026-04-03 | 全量重写：修正 OaDataService 旧引用；新增忘记密码/修改手机号/工伤 skipCondition/签名存证/数据保留/通知/Feedback/Sysadmin 向导完整测试路径；E2E 增加 DB 断言维度；补充认证安全边界用例；修正测试数据来源（data.sql 非 docs/test-accounts.md） |
| 2026-03-31 | 初始版本：基础5角色 E2E 框架、单元测试占位用例 |
