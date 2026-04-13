# 博渊 OA 平台 — 测试设计文档

> **文档职责**：定义博渊项目的测试策略、各层级测试用例设计，覆盖平台层和建筑工程版所有业务路径。
>
> **目标读者**：QA、后端开发者、前端开发者。
>
> **关联文档**：业务规则见 `design.md`；API 规范见 `architecture.md`；测试账号数据见后端 `db/data.sql`（dev profile 专用）。

---

## 1. 测试策略

| 测试层级 | 目标 | 工具 | 执行时机 |
| --- | --- | --- | --- |
| 单元测试 | 验证单个 Service/工具类的纯逻辑 | JUnit 5 + Mockito（后端）/ Vitest（前端） | 每次提交前 |
| 集成测试 | 验证 Controller + Service + DB 接口契约 | Spring Boot Test + H2 / Testcontainers | 每日构建 |
| 系统/E2E 测试 | 验证完整业务路径（按角色视角，含数据库状态） | AutoTest 可视化工具（`tools/autotest/`） | 阶段提测前 |
| 回归测试 | 防止新改动破坏已有功能 | AutoTest P0 冒烟套件全量执行 | 每次发版前 |

**覆盖率要求**：后端 Service 层 ≥ 80%；算薪引擎 / 审批流引擎 / 签名存证核心路径 100%。

> **E2E 用例详细设计**：系统/E2E 测试用例（196 条，覆盖全部角色×业务流程×正常/异常/并发场景）
> 单独维护于 **[`autotest/AUTOTEST_DESIGN.md`](./autotest/AUTOTEST_DESIGN.md)**，由 AutoTest 工具直接加载。
> 工具使用说明见 [`tools/autotest/README.md`](../tools/autotest/README.md)。

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

### 2.3 M0–M2 已完成模块单元测试

> M0（基础设施）、M1（身份认证）、M2（组织管理）均已完成，以下为当前需落地的后端单元测试。
> 测试文件放置在 `app/backend/src/test/java/com/oa/backend/`，与被测类同包结构。

#### M1 身份认证

| 测试类 | 被测方法 | 关键场景 | 期望断言 |
|--------|---------|---------|---------|
| `JwtTokenServiceTest` | `generateToken` / `parseToken` | 正常生成 → 解析 payload | userId / roleCode / employeeType 一致 |
| `JwtTokenServiceTest` | `parseToken` | token 超期 | 抛出 `ExpiredJwtException` |
| `JwtTokenServiceTest` | `parseToken` | 签名篡改 | 抛出 `JwtException` |
| `EmployeeServiceImplTest` | `authenticate` | 正确密码 | 返回 `Optional.of(employee)` |
| `EmployeeServiceImplTest` | `authenticate` | 错误密码 | 返回 `Optional.empty()` |
| `EmployeeServiceImplTest` | `authenticate` | 账号不存在 | 返回 `Optional.empty()` |
| `EmployeeServiceImplTest` | `authenticate` | 账号 disabled | 返回 `Optional.empty()` |
| `EmployeeServiceImplTest` | `generateEmployeeNo` | 正常生成 | 格式匹配 `EMP\d{6}\d{4}` |
| `ResetCodeStoreTest` | `store` / `verify` | 正确验证码 10 min 内 | verify 返回 true |
| `ResetCodeStoreTest` | `verify` | 过期验证码 | verify 返回 false |
| `ResetCodeStoreTest` | `verify` | 错误验证码 | verify 返回 false |
| `ResetCodeStoreTest` | `getCodeForTest` | 已存码 | 返回 code 字符串；prod 环境下此方法应被 profile 守门 |

**JwtTokenServiceTest 示例**
```java
@Test
void generateAndParse_shouldReturnCorrectClaims() {
    String token = jwtTokenService.generateToken("emp.001", 42L, "finance", "OFFICE", "李静");
    Claims claims = jwtTokenService.parseToken(token);
    assertEquals("emp.001", claims.getSubject());
    assertEquals(42L, claims.get("userId", Long.class));
    assertEquals("finance", claims.get("roleCode", String.class));
}

@Test
void parseToken_expired_shouldThrow() {
    String expiredToken = jwtTokenService.generateTokenWithExpiry("emp.001", Duration.ofMillis(1));
    Thread.sleep(10);
    assertThrows(ExpiredJwtException.class, () -> jwtTokenService.parseToken(expiredToken));
}
```

#### M2 组织管理

| 测试类 | 被测方法 | 关键场景 | 期望断言 |
|--------|---------|---------|---------|
| `PositionServiceImplTest` | `createPosition` | 重复 positionCode | 抛出 `DuplicateKeyException` 或业务异常 |
| `PositionServiceImplTest` | `createPosition` | idType = AUTO | 自动生成 positionId；idType = INPUT 则使用传入值 |
| `ProjectServiceImplTest` | `createProject` | 正常创建 | 返回带 id 的 Project；projectNo 格式 `PRJ-YYYYMM-XXXX` |
| `ProjectServiceImplTest` | `addMember` | 添加 PM 成员 | ProjectMember.role = PM；不写 pmId 到 project 表 |
| `ProjectServiceImplTest` | `addMember` | 添加重复成员 | 不重复插入（幂等）或抛出明确异常 |
| `ProjectServiceImplTest` | `updateStatus` | ACTIVE → COMPLETED | status 变更成功；COMPLETED → ACTIVE 应失败 |
| `AccessManagementServiceTest` | `buildProfile` | 已知角色 ceo | 返回正确 roleName / visibleModules |
| `AccessManagementServiceTest` | `buildProfile` | 未知角色 | 返回 null 或抛出异常（文档定义哪种） |

**ProjectServiceImplTest 示例**
```java
@ExtendWith(MockitoExtension.class)
class ProjectServiceImplTest {

    @InjectMocks ProjectServiceImpl projectService;
    @Mock ProjectMapper projectMapper;
    @Mock ProjectMemberMapper projectMemberMapper;

    @Test
    void addMember_pm_shouldNotWritePmIdToProject() {
        // Project 表无 pmId 字段，此测试验证不会尝试写 pmId
        ProjectMemberRequest req = new ProjectMemberRequest(101L, "PM", null);
        projectService.addMember(1L, req);
        verify(projectMapper, never()).updateById(argThat(p -> p.getId() != null));
        verify(projectMemberMapper).insert(argThat(m -> "PM".equals(m.getRole())));
    }
}
```

#### M0 基础设施

| 测试类 | 被测内容 | 关键场景 | 期望断言 |
|--------|---------|---------|---------|
| `SchemaIntegrityTest`（集成） | schema.sql DDL | Spring Boot 启动 + H2 兼容模式 | 应用上下文加载成功；无 `BeanCreationException` |
| `HealthControllerTest` | `GET /health` | 无 token | 200；body 含 `status: UP` |
| `SetupControllerTest` | `GET /setup/status` | 无 token | 200（permitAll 端点） |

```java
// SchemaIntegrityTest — 验证所有 mapper 的 Bean 正常注入
@SpringBootTest
class SchemaIntegrityTest {
    @Autowired ApplicationContext ctx;

    @Test
    void allMappersBeansShouldLoad() {
        assertNotNull(ctx.getBean(EmployeeMapper.class));
        assertNotNull(ctx.getBean(ProjectMapper.class));
        assertNotNull(ctx.getBean(DepartmentMapper.class));
        assertNotNull(ctx.getBean(PositionMapper.class));
        assertNotNull(ctx.getBean(RoleMapper.class));
    }
}
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

---

## 9. 自动化测试系统

### 9.1 自动化测试工具选型

| 层级         | 工具                              | 理由                                                          |
|------------|-----------------------------------|---------------------------------------------------------------|
| 后端单元     | JUnit 5 + Mockito                 | Spring Boot 官方推荐；Mockito 依赖隔离完善                    |
| 后端集成     | Spring Boot Test + H2 + Testcontainers | H2 用于快速 CI；Testcontainers 用于 PostgreSQL 精确验证    |
| 前端单元     | Vitest + Vue Test Utils           | 与 Vite 同生态，速度快；Vue Test Utils 是 Vue 3 官方测试库   |
| API/E2E     | REST Assured（后端）+ Playwright（前端）| REST Assured 链式 API 适合 Java 业务流测试；Playwright 多浏览器 E2E |
| 覆盖率报告   | JaCoCo（后端）+ V8 Coverage（前端）| JaCoCo 集成 Maven；V8 覆盖率内置于 Vitest                    |

**Playwright vs Cypress 选择理由：** Playwright 支持 Chromium/Firefox/WebKit 三端，原生支持 API 请求拦截（无需额外配置），并行执行能力强，适合本项目双端（H5 + 微信开发者工具模拟）测试需求。

---

### 9.2 测试目录结构

```
app/
├── backend/
│   └── src/test/java/com/oa/backend/
│       ├── unit/                    # 单元测试（不依赖 Spring 容器）
│       │   ├── engine/              # ApprovalFlowEngineTest, PayrollEngineTest
│       │   └── service/             # SignatureServiceTest, RetentionServiceTest
│       └── integration/             # 集成测试（@SpringBootTest）
│           ├── api/                 # Controller 层 HTTP 接口测试
│           └── workflow/            # 跨 Service 业务流程测试
└── tests/                           # E2E 测试（独立于前后端）
    ├── playwright.config.ts
    ├── fixtures/                    # 测试数据和环境重置
    │   └── reset.ts                 # 调用 POST /test/reset 重置业务数据
    ├── specs/                       # 测试用例文件（按角色组织）
    │   ├── employee.spec.ts
    │   ├── worker.spec.ts
    │   ├── pm.spec.ts
    │   ├── ceo.spec.ts
    │   └── finance.spec.ts
    └── pages/                       # Page Object 对象（见 §9.4）
        ├── LoginPage.ts
        ├── AttendancePage.ts
        ├── PayrollPage.ts
        └── ...
```

---

### 9.3 自动化测试流水线

```
每次提交 (git push)
  └─► 后端单元测试（mvn test -Dtest=*Unit*）         ≈ 30s
       后端快速集成测试（H2，mvn test -Ph2）           ≈ 90s
  └─► 前端类型检查（npm run type-check）              ≈ 20s
       前端单元测试（npm run test:web）               ≈ 30s

每日构建 (nightly)
  └─► 后端全量集成测试（Testcontainers + PostgreSQL） ≈ 5min
       E2E 冒烟测试（Playwright smoke suite）         ≈ 3min

发版前 (release tag)
  └─► E2E 全量测试（Playwright full suite）          ≈ 15min
       覆盖率报告生成（JaCoCo + V8）
       人工验收（TEST_DESIGN §4 各角色主线）
```

---

### 9.4 Page Object 模式（E2E 可扩展性）

E2E 测试使用 Page Object 模式，将页面操作封装为复用方法，避免直接在 spec 文件中写选择器。新增业务流程只需扩展 Page Object，不修改已有用例。

```typescript
// pages/AttendancePage.ts
export class AttendancePage {
  constructor(private page: Page) {}

  async submitLeave(type: string, days: number, reason: string) {
    await this.page.click('[data-testid="leave-tab"]')
    await this.page.selectOption('[data-testid="leave-type"]', type)
    await this.page.fill('[data-testid="leave-days"]', String(days))
    await this.page.fill('[data-testid="leave-reason"]', reason)
    await this.page.click('[data-testid="submit-btn"]')
    await this.page.waitForSelector('[data-testid="status-pending"]')
  }

  async getLeaveStatus(leaveId: string): Promise<string> {
    // 复用于多个测试场景
    const cell = await this.page.$(`[data-record-id="${leaveId}"] [data-testid="status"]`)
    return cell?.textContent() ?? ''
  }
}

// specs/employee.spec.ts
test('员工提交请假单，状态为 PENDING', async ({ page }) => {
  const attendancePage = new AttendancePage(page)
  await attendancePage.submitLeave('年假', 3, '个人原因')
  // 同时断言 DB 状态（通过 API 验证）
  const resp = await page.request.get('/api/attendance/history')
  const records = await resp.json()
  expect(records.items[0].status).toBe('PENDING')
})
```

**扩展规则：**
- 新增业务页面 → 在 `tests/pages/` 新建对应 Page Object 类
- 新增角色测试场景 → 在 `tests/specs/` 新建对应 spec 文件
- 禁止在 spec 文件中直接使用 CSS 选择器，必须通过 `data-testid` 属性

---

### 9.5 基于日志的问题复现

当生产环境出现问题，可通过以下流程将日志转化为可复现的测试用例：

```
步骤 1：从服务器获取相关时间段的日志文件
         → oa-system.2026-04-07.log

步骤 2：使用 tools/log_analyzer 工具（见 ARCHITECTURE §13.6）
         → 输入 trace_id，定位出错的模块/类/方法/行号

步骤 3：根据工具输出的调用链，提取问题场景的输入参数
         → 如：PayrollEngine.settle(cycleId=xxx) 在特定数据条件下抛出异常

步骤 4：在对应测试类中编写回归用例
         → 复现问题的数据条件作为测试 fixture
         → 断言修复后该场景不再触发异常

步骤 5：合并回归用例到 fix PR，确保以后不复现
```

**约定：** P0/P1 缺陷修复后必须补充回归用例（见 §8.2），并在 PR 描述中注明对应 trace_id。

---

### 9.6 测试数据隔离增强

**模块化测试数据：** 各模块测试数据独立初始化，避免跨模块干扰：

```java
// 考勤模块集成测试基类
@SpringBootTest
@ActiveProfiles("test")
public abstract class AttendanceIntegrationBase {
    @BeforeEach
    void setupAttendanceData() {
        // 只插入考勤测试所需的最小数据集
        testDataBuilder.createEmployee("test-emp-001", "employee")
                       .withPosition("office_worker")
                       .withSupervisor("test-pm-001");
    }

    @AfterEach
    void cleanupAttendanceData() {
        // 回滚，不影响其他模块测试
    }
}
```

**E2E 数据隔离：** 每个测试文件执行前调用 `POST /test/reset`，保留账号/配置/预置数据，清理业务数据：

```typescript
// fixtures/reset.ts
export const resetFixture = base.extend<{ reset: void }>({
  reset: [async ({ request }, use) => {
    await request.post('/api/test/reset')
    await use()
  }, { auto: true }]  // 自动在每个测试前执行
})
```

---

---

## §10 Dev 快捷工具设计

> **目标读者**：开发者在本地测试时使用，尤其是初始化向导、各角色业务流程的快速验证。
>
> **生产安全保证**：所有 Dev 工具均通过两道独立机制防止泄漏到生产环境——前端 `import.meta.env.DEV` 守门（production build 时 Rollup dead-code-elimination 剔除）；后端 `@Profile("dev")` 守门（生产 Spring 不加载，路由物理不存在）。两道机制互相独立，任一均可单独保证安全。

---

### 10.1 测试账号

所有账号密码统一 `123456`，数据写入 `db/data.sql`（dev profile 专用）。

| 账号 | 姓名 | 角色 | 员工类型 | 典型测试场景 |
|------|------|------|----------|-------------|
| `employee.demo` | 张晓宁 | employee（员工） | OFFICE | 提交请假/加班申请，查看工资条 |
| `finance.demo` | 李静 | finance（财务） | OFFICE | 薪资结算、人员档案、导入通讯录 |
| `pm.demo` | 王建国 | project_manager（项目经理） | OFFICE | 审批请假/施工日志，管理项目成员 |
| `ceo.demo` | 陈明远 | ceo（CEO） | OFFICE | 终审审批、系统配置、全局数据总览 |
| `worker.demo` | 赵铁柱 | worker（劳工） | LABOR | 提交施工日志、发起工伤补偿申请 |

---

### 10.2 组件清单

| 组件 | 位置 | 平台 | 用途 |
|------|------|------|------|
| `DevToolbar.vue` | `components/customized/DevToolbar.vue` | H5 + 小程序 | 悬浮按钮，点击展开操作面板（重置向导/跳过向导/快捷登录） |
| `DevLoginPanel.vue` | `components/customized/DevLoginPanel.vue` | H5 | 已存在；登录页内嵌，5个账号一键登录按钮 |
| `DevController.java` | `controller/DevController.java` | 后端 | `@Profile("dev")` 接口，提供 reset-setup 操作 |

---

### 10.3 DevToolbar 详细设计

#### 激活条件

```typescript
// 组件顶层，无需平台判断
const is_dev = import.meta.env.DEV  // production build 时恒为 false，整块被 tree-shake
```

`v-if="is_dev"` 包裹整个组件根元素。`yarn build`（Vite production mode）输出时，Rollup 识别 `import.meta.env.DEV === false` 为死代码并完整删除，不需要 `#ifdef` 条件编译。

#### 平台差异

H5 和小程序均呈现为**右下角固定悬浮按钮**，点击展开操作面板，样式一致，体验对齐。

| 平台 | 悬浮按钮 | 展开面板 | 实现方式 |
|------|---------|---------|---------|
| H5 | 右下角圆形按钮「DEV」 | 向上弹出操作卡片 | `position: fixed; bottom: 24px; right: 24px` |
| 小程序 | 右下角圆形按钮「DEV」 | 向上弹出操作列表 | `position: fixed`（小程序支持）+ `v-show` 切换 |

两端均默认**收起**，点击展开/收起切换，避免遮挡正文内容。

#### 三个功能入口

**① 一键重置初始化向导**

```
点击 → 确认弹窗（"确认重置？系统将回到未初始化状态"）
     → 确认 → POST /dev/reset-setup
             → 成功：清空 userStore session → 跳转 /pages/setup/index
             → 失败：Toast 展示错误信息
```

**② 一键跳过初始化向导**

```
点击 → POST /dev/reset-setup（重置为未初始化）
     → POST /setup/init（填入预设测试数据，见下方 payload）
     → 成功：Toast "初始化完成" → 跳转登录页
```

预设 init payload：

```json
{
  "companyName": "众维建筑工程有限公司",
  "ceoEmployeeNo": "ceo.demo",
  "ceoPassword": "123456",
  "departments": ["综合管理部", "财务管理部", "项目一部", "运营管理部", "施工一部"],
  "approvalFlows": "DEFAULT"
}
```

**③ 快捷登录（5个测试账号）**

| 按钮标签 | 账号 | 角色 |
|---------|------|------|
| 员工登录 | `employee.demo` | employee |
| 财务登录 | `finance.demo` | finance |
| PM 登录 | `pm.demo` | project_manager |
| CEO 登录 | `ceo.demo` | ceo |
| 劳工登录 | `worker.demo` | worker |

密码统一 `123456`。点击后复用 `loginWithAccount()`，登录成功后跳转工作台，失败后显示错误提示。

H5 端此功能由 `DevLoginPanel.vue` 实现（已存在），DevToolbar 在小程序端复制同样的按钮列表。

---

### 10.4 后端 DevController 设计

```java
@RestController
@RequestMapping("/dev")
@Profile("dev")   // 生产 Spring 环境不加载此 Bean，路由物理不存在
@RequiredArgsConstructor
public class DevController {

    private final SystemConfigMapper systemConfigMapper;

    /**
     * 重置系统初始化状态，用于开发测试重走初始化向导
     * 仅在 spring.profiles.active=dev 时可用
     */
    @PostMapping("/reset-setup")
    public ResponseEntity<Void> resetSetup() {
        systemConfigMapper.setInitialized(false);
        // 写 WARN 级别 SystemLog，标注"仅开发环境操作"
        return ResponseEntity.noContent().build();
    }
}
```

**生产验证方式**：以 `spring.profiles.active=prod` 启动后，`POST /dev/reset-setup` 应返回 404（Spring 未注册该路由）。

---

### 10.5 Dev 工具使用场景

| 测试场景 | 推荐操作 | 步骤 |
|---------|---------|------|
| 测试初始化向导全流程 | 一键重置 | 点击"重置向导" → 走向导5步 → 验证完成后入口锁定 |
| 快速进入业务测试 | 一键跳过 + 快捷登录 | 点击"跳过向导" → 选择目标角色登录 → 直接进入业务页面 |
| 验证某角色权限 | 快捷登录 | 点击对应角色按钮，无需手动输入账号密码 |
| 复现 bug 后验证修复 | 快捷登录 + 业务操作 | 登录对应角色 → 复现操作路径 → 确认 bug 消失 |
| 验证向导锁定机制 | 完成初始化后直接访问 `/pages/setup/index` | 应跳转登录页，且后端返回 403 |

---

### 10.6 生产构建验证清单

以下检查在每次 `npm run build` 后执行，确保 Dev 工具完全剔除：

- [ ] `dist/build/h5/` 中所有 JS 文件搜索 `reset-setup`，结果为空
- [ ] `dist/build/h5/` 中所有 JS 文件搜索 `DevToolbar`，结果为空
- [ ] `dist/build/mp-weixin/` 中所有 JS 文件搜索 `reset-setup`，结果为空
- [ ] 以 `spring.profiles.active=prod` 启动后端，`POST /dev/reset-setup` 返回 404
- [ ] H5 生产页面 DOM 中不存在 `dev-toolbar` 相关元素

---

## 变更记录

| 日期        | 内容                                                                                         |
|-----------|----------------------------------------------------------------------------------------------|
| 2026-04-07 | 新增 §10 Dev 快捷工具设计：DevToolbar 双端设计、DevController、使用场景、生产构建验证清单 |
| 2026-04-07 | 新增 §9 自动化测试系统：工具选型对比（REST Assured + Playwright）；测试目录结构；流水线设计；Page Object 扩展模式；日志驱动问题复现流程；模块化测试数据隔离 |
| 2026-04-03 | 全量重写：修正 OaDataService 旧引用；新增忘记密码/修改手机号/工伤 skipCondition/签名存证/数据保留/通知/Feedback/Sysadmin 向导完整测试路径；E2E 增加 DB 断言维度；补充认证安全边界用例；修正测试数据来源（data.sql 非 docs/test-accounts.md） |
| 2026-03-31 | 初始版本：基础5角色 E2E 框架、单元测试占位用例 |
