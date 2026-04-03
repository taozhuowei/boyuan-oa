# 博渊 OA 平台 — 后端实现细节

> **文档职责**：描述博渊后端的代码结构约定、MyBatis-Plus 使用规范、安全层实现、统一响应格式、存储抽象、引擎实现模式、定时任务机制。
>
> **目标读者**：后端开发者、全栈开发者。
>
> **不包含内容**：实体字段定义和 API 规范（见 `ARCHITECTURE.md`）；业务审批流、薪资规则（见 `presets/construction/WORKFLOW_CONFIG.md`）。

---

## 1. 代码结构

```
src/main/java/com/oa/backend/
├── config/
│   └── SecurityConfig.java         # Spring Security + CORS 配置
├── controller/                     # REST 接口层，只做参数校验和响应封装
├── dto/                            # 请求/响应 DTO（与实体解耦）
├── entity/                         # MyBatis-Plus 实体（对应数据库表）
├── mapper/                         # MyBatis-Plus Mapper 接口
├── service/                        # 业务逻辑层接口
│   └── impl/                       # Service 实现类
├── engine/                         # 引擎层（审批/薪资/权限/通知）
│   ├── ApprovalEngine.java
│   ├── PayrollEngine.java
│   ├── PermissionEngine.java
│   └── NotificationEngine.java
├── security/
│   ├── JwtTokenService.java        # JWT 生成与验证
│   ├── JwtAuthenticationFilter.java # 每次请求 Token 解析
│   └── SecurityUtils.java          # 当前登录用户获取工具
├── storage/
│   ├── StorageService.java         # 文件存储接口（抽象）
│   └── LocalStorageService.java    # 本地 FS 实现（当前唯一实现）
├── scheduler/
│   ├── PayrollWindowScheduler.java # 窗口期自动关闭
│   ├── RetentionReminderScheduler.java # 数据到期前 30 天提醒
│   └── CleanupScheduler.java       # 到期数据清理
└── exception/
    ├── GlobalExceptionHandler.java # @RestControllerAdvice 全局异常
    └── BizException.java           # 业务异常基类
```

```
src/main/resources/
├── db/
│   ├── schema.sql                  # 全量 DDL（30 张表，含 CREATE TABLE IF NOT EXISTS）
│   └── data.sql                    # 种子数据（5 个测试账号，角色，部门，岗位）
└── application.yml                 # 应用配置
```

---

## 2. 包命名与表命名约定

### 2.1 表前缀规则

| 前缀 | 含义 | 示例 |
|------|------|------|
| `sys_` | 系统级表（用户、角色、配置、日志） | `sys_employee`, `sys_role`, `sys_config` |
| `biz_` | 业务流程表（表单、审批、通知） | `biz_form_record`, `biz_approval_record` |
| `pay_` | 薪资域表 | `pay_cycle`, `pay_slip`, `pay_confirmation` |
| `prj_` | 项目管理域表 | `prj_construction_log`, `prj_milestone` |

### 2.2 实体注解规范

```java
@Data
@TableName("biz_form_record")   // 显式指定表名，不依赖类名推断
public class FormRecord {

    @TableId(type = IdType.AUTO)   // 自增主键（PostgreSQL 用 BIGSERIAL）
    private Long id;

    @TableField(fill = FieldFill.INSERT)            // 创建时自动填充
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)     // 创建和更新时自动填充
    private LocalDateTime updateTime;

    @TableLogic                                     // 逻辑删除，值：0=正常，1=已删除
    private Integer deleted;
}
```

> `operation_log`（审计日志）**不加 `@TableLogic`**，永久物理保留，不可逻辑删除。

### 2.3 自动填充配置

在 `config/` 下创建 `MyBatisPlusConfig.java`，注册 `MetaObjectHandler`：

```java
@Component
public class AutoFillHandler implements MetaObjectHandler {
    @Override
    public void insertFill(MetaObject meta) {
        this.strictInsertFill(meta, "createTime", LocalDateTime.class, LocalDateTime.now());
        this.strictInsertFill(meta, "updateTime", LocalDateTime.class, LocalDateTime.now());
    }

    @Override
    public void updateFill(MetaObject meta) {
        this.strictUpdateFill(meta, "updateTime", LocalDateTime.class, LocalDateTime.now());
    }
}
```

---

## 3. JWT 认证机制

### 3.1 Token 结构

```
Header.Payload.Signature
Payload claims:
  sub         → employeeNo（登录用户名）
  role        → roleCode（小写，如 ceo / project_manager / finance）
  displayName → 员工姓名（用于前端展示，避免二次查库）
  iat         → 签发时间
  exp         → 过期时间（默认 24 小时，生产环境应缩短至 2 小时）
  iss         → "oa-backend"
```

### 3.2 业务用户与 Sysadmin 共用同一 Token 格式

- 业务用户：`role` 为角色 code（`ceo`、`finance` 等）
- Sysadmin：`role` 固定为 `"sysadmin"`，`sub` 固定为 `"sysadmin"`
- 后端 `@PreAuthorize("hasRole('sysadmin')")` 直接用 Token 中的 `role` 判断

### 3.3 过滤器链位置

```
请求到达 → JwtAuthenticationFilter（解析 Token，注入 SecurityContext）
         → Spring Security 权限校验（@PreAuthorize / .anyRequest().authenticated()）
         → Controller
```

`JwtAuthenticationFilter` 放在 `UsernamePasswordAuthenticationFilter` 之前。Token 无效时不抛异常，直接放行，后续由 Security 拦截返回 401。

### 3.4 当前用户获取

任何 Service 内部通过 `SecurityUtils.currentEmployeeNo()` 获取当前登录的 `employeeNo`：

```java
// SecurityUtils.java
public static String currentEmployeeNo() {
    return SecurityContextHolder.getContext()
        .getAuthentication().getName();  // 即 JWT sub 字段
}

public static String currentRole() {
    return SecurityContextHolder.getContext()
        .getAuthentication().getAuthorities()
        .stream().findFirst()
        .map(GrantedAuthority::getAuthority).orElse("");
}
```

---

## 4. 统一响应格式

所有接口返回 `ApiResponse<T>`，禁止 Controller 直接返回裸数据：

```java
// 成功
{ "code": 200, "message": "ok", "data": { ... } }

// 业务错误
{ "code": 40001, "message": "员工编号已存在", "data": null }

// 参数校验失败
{ "code": 40000, "message": "name: 不能为空", "data": null }

// 未授权
{ "code": 401, "message": "Token 无效或已过期", "data": null }

// 服务器错误
{ "code": 500, "message": "内部错误，请联系管理员", "data": null }
```

### 4.1 业务错误码规范

| 范围 | 含义 |
|------|------|
| `200` | 成功 |
| `40000–40099` | 参数校验失败 |
| `40100–40199` | 认证/授权错误 |
| `40400–40499` | 资源不存在 |
| `40900–40999` | 业务冲突（如重复提交、状态不允许） |
| `500xx` | 服务器内部错误 |

### 4.2 全局异常处理

`GlobalExceptionHandler` 使用 `@RestControllerAdvice` 统一捕获：

```java
// 业务异常 → 返回对应 code 和 message
@ExceptionHandler(BizException.class)

// Bean Validation 失败 → 40000 + 字段错误信息
@ExceptionHandler(MethodArgumentNotValidException.class)

// 未捕获异常 → 500，日志记录完整堆栈，响应体不暴露内部错误
@ExceptionHandler(Exception.class)
```

---

## 5. 权限校验实现

权限三条线各自的代码实现方式：

### 5.1 线 ①：操作权限（role.permissionCodes）

用 Spring Security 方法注解：

```java
// Controller 层
@PreAuthorize("hasAuthority('employee:create')")
public ApiResponse<Void> createEmployee(...) { ... }

// 权限码在 JwtAuthenticationFilter 中从 employee 的 role.permissionCodes 加载到 GrantedAuthority
```

### 5.2 线 ②：模块可见性（position.featureFlags）

由前端根据 `GET /page-config/{routeCode}` 返回的菜单配置决定是否渲染入口。后端在返回配置时根据当前用户的 `positionCode` 过滤菜单树，无需在每个接口上加额外注解。

### 5.3 线 ③：数据范围（dataScope）

在 Service 层动态构建查询条件：

```java
// PermissionEngine.java
public <T> LambdaQueryWrapper<T> applyDataScope(
        LambdaQueryWrapper<T> wrapper,
        SFunction<T, Long> deptField,
        SFunction<T, Long> projectField,
        SFunction<T, Long> ownerField) {

    DataScope scope = resolveDataScope(SecurityUtils.currentRole());
    return switch (scope) {
        case GLOBAL     -> wrapper;                          // 不加条件
        case DEPARTMENT -> wrapper.eq(deptField, currentDeptId());
        case PROJECT    -> wrapper.eq(projectField, currentProjectId());
        case SELF       -> wrapper.eq(ownerField, currentEmployeeId());
    };
}
```

---

## 6. 文件存储抽象

```java
// StorageService.java（接口）
public interface StorageService {
    String store(InputStream data, String businessType, String ext); // 返回相对路径
    InputStream load(String relativePath);
    void delete(String relativePath);
}

// LocalStorageService.java（当前实现）
// 存储路径：{upload.root}/{businessType}/{yyyy-MM}/{UUID}.{ext}
// 配置项：upload.root（默认 /uploads，生产环境挂载到持久化目录）
```

切换 MinIO / 阿里云 OSS 时只需新增实现类并修改配置，Controller 和 Service 层零改动。

---

## 6.1 短信通知抽象（SmsService）

**P3 功能**，当前提供 no-op 默认实现，接口预留供后续接入短信服务商：

```java
// SmsService.java（接口）
public interface SmsService {
    void send(String phone, String templateCode, Map<String, String> params);
}

// NoOpSmsService.java（当前唯一实现，P3 前始终使用此实现）
// 所有调用均静默忽略，不抛异常，不记录日志
@Primary
@Component
public class NoOpSmsService implements SmsService {
    @Override
    public void send(String phone, String templateCode, Map<String, String> params) {
        // no-op: SMS not yet configured
    }
}
```

**触发时机（P3 实现时生效）**：`CleanupScheduler` 检测到 `cleanup_task.status = FAILED` 且连续超过配置天数未处理时，调用 `SmsService.send()` 通知管理员。触发阈值通过 `sys_config` 表配置。

---

## 7. 审批引擎实现

`ApprovalEngine` 是审批流推进的唯一入口，任何 Service 需要触发审批动作时注入此 Engine，禁止直接操作 `approval_record` 表：

```
ApprovalEngine.submit(formId)      → 创建 FormRecord，推进到第一个节点
ApprovalEngine.approve(formId, comment) → 当前节点通过，推进到下一节点或结束
ApprovalEngine.reject(formId, comment)  → 驳回，状态回到 REJECTED
```

### 7.0 多 PM 场景：提交时指定审批人

多 PM 项目中，**由提交人在提交时从项目的 PM 列表中选择一位**，审批引擎将节点直接指派给该 PM（`ApprovalRecord.approverId`），走标准单审批人路径，无并发冲突。

提交接口 body 中的可选字段：

```json
{ "assignedReviewerId": 123 }  // 当审批流有 PM 节点时必填
```

PM 列表查询：`GET /projects/{id}/members?role=PM`，返回该项目所有 PM 角色成员（`ProjectMember.role = PM`）。

> `ApprovalFlowNode.approvalMode` 仅有 `SEQUENTIAL` 一种值，`ANY_OF` 模式已取消。

### 7.1 skipCondition 处理

节点推进时检查 `ApprovalFlowNode.skipCondition`：

```java
if (node.getSkipCondition() != null) {
    SkipCondition cond = parseJson(node.getSkipCondition());
    if ("SUBMITTER_ROLE_MATCH".equals(cond.getType())) {
        if (cond.getRoleCode().equals(submitterRole)) {
            // 标记本节点为 SKIPPED，继续推进到下一节点
            recordSkip(formId, node);
            return advance(formId);
        }
    }
}
```

当前仅实现 `SUBMITTER_ROLE_MATCH` 一种条件类型，后续可扩展。

---

## 8. 薪资引擎实现

`PayrollEngine` 负责薪资计算和窗口期管理，是薪资域唯一的计算入口：

### 8.1 窗口期状态机

窗口期字段直接存储于 `PayrollCycle` 中（无独立 `PayrollWindowPeriod` 表）：

```
PayrollCycle.windowStatus:
  OPEN（可提交异议）→ 到期自动关闭 → CLOSED（锁定）
```

**窗口期不可提前关闭**，只能通过 `PayrollWindowScheduler` 到期自动关闭。到期时触发未响应项的自动处理规则（具体规则见 `WORKFLOW_CONFIG §2.2.2`）。

`PayrollWindowScheduler` 每天 00:30 扫描 `pay_cycle` 表中 `windowStatus = OPEN` 且 `windowEndDate <= NOW()` 的记录，执行锁定并触发兜底规则。

### 8.2 多版本管理

工资条每次更正生成新版本（`version` 字段自增），旧版本状态置为 `SUPERSEDED`，永不物理删除。查询时默认取最新版本（`ORDER BY version DESC LIMIT 1`）。

### 8.3 两项强制前置检查

结算前 `PayrollEngine.settle()` 必须通过，且**不可豁免**：

```java
// 1. 无未处理的异议单（status = PENDING_REVIEW 的 pay_slip）
// 2. 无未完成的薪资计算任务（status = CALCULATING 的 pay_cycle）
// 两项以外的状态不阻塞结算（工伤跨月、施工日志未归档、加班审批跨月均不阻塞）
```

### 8.4 可配置费目（PayrollItemDef）

工资条中除固定算法项（加班、请假、社保等）外，支持财务/CEO 通过 `PayrollItemDef` 表配置额外费目：

| 类型 | 说明 | 示例 |
|------|------|------|
| `ALLOWANCE` | 补贴/奖金，加入应发 | 餐补、驻场补贴 |
| `DEDUCTION` | 扣减项，减少实发 | 公司罚款、设备损坏赔偿 |

财务在结算时按需将自定义金额挂载到当期 `PayrollSlip`（生成 `PayrollSlipItem` 行），平台引擎汇总计算实发工资。

---

## 9. 定时任务

所有定时任务使用 Spring `@Scheduled`，禁止引入额外的任务调度框架。

| 类 | Cron | 职责 |
|----|------|------|
| `PayrollWindowScheduler` | `0 30 0 * * *`（每天 00:30） | 扫描过期窗口期，自动关闭并触发兜底规则 |
| `RetentionReminderScheduler` | `0 0 9 * * *`（每天 9:00） | 扫描距到期 ≤30 天的数据，生成提醒通知 |
| `CleanupScheduler` | `0 0 2 * * *`（每天 02:00） | 执行已确认到期的数据清理任务（物理删除 FS 文件 + DB 记录） |

### 9.1 清理安全约束

```
物理文件删除失败 → 不标记清理完成，进入重试队列（最多 3 次）
重试全部失败    → 写入 cleanup_task（status=FAILED）等待人工干预
禁止只删 DB 记录不删文件，或只删文件不删 DB
```

---

## 10. Sysadmin 初始化机制

### 10.1 初始化状态检查

`SetupController.getStatus()` 返回以下结构：

```json
{
  "initialized": false,
  "nextStep": "company",
  "steps": {
    "company":       { "done": false },
    "ceo":           { "done": false },
    "roles":         { "done": false },
    "workflows":     { "done": false },
    "retention":     { "done": false }
  }
}
```

前端据此渲染向导步骤，所有步骤完成后 `initialized` 变为 `true`，向导入口隐藏。

### 10.2 单次调用约束

`POST /setup/init-ceo` 在 Service 层检查 `sys_employee` 表中是否已存在 `roleCode = 'ceo'` 的记录。存在则返回 `40900 CEO 账号已存在`，不允许重复创建。

---

## 11. 技术约束汇总

| 约束 | 规范 |
|------|------|
| 密码存储 | bcrypt（`BCryptPasswordEncoder`），禁止明文或 MD5 |
| 敏感字段（签名图片） | AES-256 加密后入库，密钥从环境变量读取，禁止硬编码 |
| 分页 | 统一使用 MyBatis-Plus `IPage<T>`，禁止自写 LIMIT/OFFSET |
| 事务边界 | `@Transactional` 加在 Service 实现层，禁止加在 Controller 层 |
| JSON 字段 | 实体中 JSON 类型字段使用 `String` 存储，Service 层负责序列化/反序列化 |
| context-path | 全部接口前缀 `/api`（配置在 `application.yml`），Controller 只写业务路径 |
| H2 兼容性 | `schema.sql` 使用 `CREATE TABLE IF NOT EXISTS`，类型使用 H2+PostgreSQL 兼容语法（如 `BIGINT` 非 `BIGSERIAL`，自增用 `IDENTITY(1,1)`） |
