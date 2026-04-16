# 博渊 OA 后端

Spring Boot REST API 服务。

## 技术栈

| 技术 | 版本 |
|------|------|
| Java | 17 |
| Spring Boot | 3.2.4 |
| MyBatis-Plus | 3.5.6 |
| PostgreSQL | 15 |

## 开发命令

```bash
# 编译
mvn clean compile

# 运行测试
mvn test

# 启动开发服务器
mvn spring-boot:run

# 打包
mvn clean package

# 生产环境运行
mvn spring-boot:run -Dspring.profiles.active=prod
```

## 数据库初始化

```bash
psql -U postgres -f src/main/resources/db/schema.sql
```

## API 规范

- 基础路径：`/api`
- 认证方式：JWT Bearer Token

## 依赖文档

- [后端实现细节](../docs/BACKEND_IMPL.md)

## 测试设计

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

### 执行命令

```bash
# 后端单元 + 集成测试（覆盖率报告）
cd app/backend && mvn test jacoco:report
```
