# OA 后端代码 Review 报告

**Review 范围**：`/home/tzw/OA/app/backend/src/main/java/com/oa/backend/`  
**Review 日期**：2026-03-31  
**Reviewer**：资深 Java 后端工程师

---

## 一、总体评价

当前后端代码处于**演示/原型阶段**，采用了 Spring Boot + Spring Security + JWT 的技术栈，并引入了 MyBatis-Plus。整体结构遵循了 MVC 分层，但存在严重的**架构漂移**问题：

1. **业务数据全部走内存**：`OaDataService` 用一个巨型类托管了员工、项目、表单、薪资、备份、清理、通知、保留策略等 8 个域的数据，使用 `ConcurrentHashMap` 存储。而 `entity`/`mapper`/`UserService` 等数据库持久化代码几乎成了“僵尸代码”，未被主业务调用。
2. **权限判断极度分散**：每个 Controller 都手写 `Authentication` 流式判断，重复代码遍地，且没有利用 Spring Security 的方法级安全注解。
3. **Controller 越权承载业务逻辑**：`WorkbenchController`、`DirectoryImportController` 里直接写死了用户资料、菜单配置、通讯录校验规则，Service 层严重缺位。
4. **测试覆盖薄弱**：仅有 2 个测试类（1 个单元切片测试 + 1 个集成测试），对核心 Service 无任何单元测试，边界场景几乎未覆盖。
5. **注释风格两极分化**：DTO/Entity 注释简洁得当，但 `AccessManagementService`、`JwtTokenService`、`SecurityConfig` 等类的 Javadoc 过于冗长，甚至对 `main()` 方法都写了大段“设计原因”。

**结论**：代码目前能跑通演示流程，但离生产可用差距较大，建议先进行架构治理（拆分 Service、统一权限、补测试），再迭代业务功能。

---

## 二、按优先级列出的问题

### P0（严重 — 架构缺陷 / 功能缺失 / 安全隐患）

#### P0-1 业务数据层完全绕过数据库，MyBatis-Plus 体系沦为僵尸代码
- **位置**：`service/OaDataService.java`（全文件）、`entity/*.java`、`mapper/*.java`、`service/UserService.java`
- **问题描述**：
  - `OaDataService` 使用内存 `Map` + `AtomicLong` 管理所有业务数据（员工、项目、表单、薪资周期、工资单、备份、清理、通知、保留策略）。
  - `entity` 包下的 `User`、`Employee`、`Role`、`Project`、`FormRecord`、`PayrollCycle`、`PayrollSlip` 以及对应的 `Mapper`、`UserService`/`UserServiceImpl` 均未被主业务 Controller 调用。
  - 这导致系统无法持久化、无法水平扩展、重启即丢数据，且引入了无意义的技术债务。
- **影响**：架构根基错误；演示环境一旦重启，所有用户操作（表单提交、审批、薪资确认）全部丢失；无法迁移到生产数据库。
- **修复建议**：
  1. 将 `OaDataService` 按领域拆分为独立的 Service（`EmployeeService`、`ProjectService`、`FormService`、`PayrollService` 等）。
  2. 这些 Service 基于现有的 MyBatis-Plus `Mapper` 和 `Entity` 实现真正的 CRUD。
  3. 若必须保留内存演示模式，可抽象出 `Repository` 接口，提供 `InMemoryRepository` 和 `MyBatisRepository` 两种实现，通过配置切换。

#### P0-2 `OaDataService` 中存在明显的字段映射 Bug
- **位置**：`service/OaDataService.java:320-321`
- **问题描述**：`toPayrollCycleResponse` 方法在构造 `PayrollCycleResponse` 时，将 `c.startDate` 传给了预结算时间和结算时间两个字段：
  ```java
  return new PayrollCycleResponse(c.id, c.cycleNo, c.cycleName, c.startDate, c.endDate, c.status,
      c.version, c.locked, c.startDate, c.settleTime != null ? c.startDate : null, c.employeeCount, c.totalAmount);
  ```
  正确应为 `c.precheckTime` 和 `c.settleTime`。
- **影响**：前端展示的工资周期预结算/结算时间永远等于周期开始日期，数据失真。
- **修复建议**：立即修正为 `c.precheckTime` 和 `c.settleTime`。

#### P0-3 `UserController` 没有任何权限校验，存在越权风险
- **位置**：`controller/UserController.java`（全文件）
- **问题描述**：`UserController` 的 `list`、`getById`、`save`、`update`、`delete` 五个接口均未使用 `Authentication` 参数，也未加任何方法级安全注解。任何持有有效 JWT 的用户（包括最普通的 employee/demo）都可以增删改查用户数据。
- **影响**：普通员工可删除管理员账号，严重的垂直越权漏洞。
- **修复建议**：
  1. 短期：在 `UserController` 中注入 `Authentication`，至少限制为 `ROLE_CEO` 或 `ROLE_FINANCE` 可访问。
  2. 长期：启用 `@EnableMethodSecurity`，使用 `@PreAuthorize("hasRole('CEO')")` 统一管控。

#### P0-4 通知系统未做用户隔离，所有人共享同一份通知
- **位置**：`service/OaDataService.java:546-557`、`controller/NotificationController.java:28-34`
- **问题描述**：`listNotifications()` 返回的是全局 `notifications` Map 中的所有数据；`getUnreadNotificationCount()` 也是全局计数，未按当前登录用户过滤。
- **影响**：员工 A 可以看到员工 B 的待审批提醒和工资条确认提醒，存在信息泄露。
- **修复建议**：在 `NotificationData` 中增加 `targetUser` 或 `targetRole` 字段；查询时根据 `authentication.getName()` 过滤。

#### P0-5 通讯录导入的核心校验逻辑直接写在 Controller 中
- **位置**：`controller/DirectoryImportController.java:30-78`
- **问题描述**：手机号格式校验、重复性校验、计数统计、状态标记全部在 Controller 里完成，没有对应的 Service/Domain 层。
- **影响**：业务逻辑无法复用、无法单元测试；Controller 臃肿。
- **修复建议**：抽取 `DirectoryImportService`，将校验逻辑下沉；Controller 只负责接收请求和返回 DTO。

#### P0-6 薪资更正接口是完全的 Stub（空实现）
- **位置**：`controller/PayrollController.java:182-192`
- **问题描述**：`POST /payroll/cycles/{id}/corrections` 仅返回字符串 `"更正申请已提交，等待CEO审批"`，未调用任何 Service，也未持久化数据。
- **影响**：功能缺失，前端点击后无实际业务效果。
- **修复建议**：在 `OaDataService`（或拆分后的 `PayrollService`）中实现更正申请的数据结构（状态、原因、申请人、审批人），并补充审批流程。

---

### P1（高 — 重复代码 / 权限分散 / 设计缺陷）

#### P1-1 大量重复代码：用户名映射、权限判断方法在多个 Controller 中复制粘贴
- **位置**：
  - `FormController.java:216-225` 与 `PayrollController.java:230-239`：`getDisplayNameFromUsername` 完全一致。
  - `BackupController.java:71-75`、`CleanupController.java:66-70`、`RetentionController.java:63-67`：`isCEO()` 完全一致。
  - `PayrollController.java:218-228` 与 `DirectoryImportController.java:94-98`：`isFinance()` / `isFinanceOnly()` 完全一致。
  - `EmployeeController.java:54-59` 与 `ProjectController.java:35-37`：允许访问的角色列表完全一致。
- **影响**：修改演示账号或调整角色时，需要改 N 个文件，极易遗漏；代码可维护性差。
- **修复建议**：
  1. 将 `getDisplayNameFromUsername`、`getDepartmentFromUsername` 等用户元数据获取逻辑统一放到 `AccessManagementService` 或 `UserProfileService`。
  2. 将权限判断逻辑统一抽取为 `SecurityUtils` 或启用 Spring Security 表达式（`@PreAuthorize`）。

#### P1-2 权限判断逻辑过度分散，未使用 Spring Security 方法级安全
- **位置**：几乎所有 Controller（`FormController`、`PayrollController`、`EmployeeController`、`ProjectController`、`BackupController`、`CleanupController`、`RetentionController`、`DirectoryImportController`）
- **问题描述**：每个接口都手写 `if (!isXXX(authentication)) return 403;`，权限规则散落在 10+ 个 Controller 的 30+ 个方法中。`SecurityConfig` 只做了“是否登录”的判断，未做 URL 级或方法级授权。
- **影响**：权限策略难以统一审计；新增角色或调整权限时需要逐行修改 Controller；容易遗漏。
- **修复建议**：
  1. 在 `SecurityConfig` 上添加 `@EnableMethodSecurity`。
  2. 用 `@PreAuthorize("hasAnyRole('FINANCE','CEO')")`、`@PreAuthorize("hasRole('WORKER')")` 等注解替换手写判断。
  3. 对于复杂的动态权限（如“只能看自己的工资单”），抽取到 Service 层做数据范围过滤。

#### P1-3 `WorkbenchController` 硬编码所有用户资料和菜单配置
- **位置**：`controller/WorkbenchController.java:35-83`、`106-157`
- **问题描述**：`buildUserProfile` 用 `switch (username.toLowerCase())` 硬编码了 5 个演示账号的姓名、部门、角色、可见模块；`buildWorkbenchConfig` 用 `switch (role)` 硬编码了菜单树。
- **影响**：新增演示账号或调整菜单必须改代码；与 `AccessManagementService` 中预置的账号数据重复且可能不一致。
- **修复建议**：
  1. 用户资料应从 `AccessManagementService` 或数据库查询，不要写死在 Controller。
  2. 菜单配置可抽取到 `application.yml` 或数据库配置表，按角色码动态加载。

#### P1-4 `JwtAuthenticationFilter` 只解析单一角色，无法支持多权限
- **位置**：`security/JwtAuthenticationFilter.java:66-78`
- **问题描述**：从 JWT 中只读取 `role` 这一个 claim，并包装成单个 `SimpleGrantedAuthority("ROLE_" + role)`。如果未来一个用户需要同时拥有 `PROJECT_MANAGER` 和 `FINANCE` 权限，则无法表达。
- **影响**：权限模型被设计为单角色，扩展性差。
- **修复建议**：JWT 中存储 `roles` 数组（List<String>），过滤器中循环构建多个 `SimpleGrantedAuthority`。

#### P1-5 金额计算使用 `Double`，存在精度风险
- **位置**：`service/OaDataService.java:348-349`、`352`、`354`、`356-357`、`620`、`622-634`
- **问题描述**：工资单中的 `grossAmount`、`netAmount`、`items.amount` 均使用 `Double` 类型，并进行乘除运算（`gross * 0.85`）。
- **影响**：金融场景下 `Double` 精度丢失会导致薪资计算错误（如 0.1 + 0.2 != 0.3）。
- **修复建议**：全部替换为 `java.math.BigDecimal`，运算使用 `BigDecimal` 的 `multiply`、`subtract` 方法。

#### P1-6 缺少全局异常处理，Controller 手动拼装错误响应
- **位置**：所有 Controller
- **问题描述**：没有 `@ControllerAdvice` / `@RestControllerAdvice`。每个 Controller 都手动写 `return ResponseEntity.status(401).build()`、`return ResponseEntity.badRequest().body("...")` 等。
- **影响**：异常响应格式不统一；业务代码被错误处理逻辑污染；无法集中记录日志。
- **修复建议**：新增 `GlobalExceptionHandler`，统一处理 `AuthenticationException`、`AccessDeniedException`、`IllegalArgumentException`、`MethodArgumentNotValidException` 等，返回标准错误体（如 `{ "code": 403, "message": "..." }`）。

#### P1-7 `UserController` 直接返回 Entity 和原始 Boolean
- **位置**：`controller/UserController.java`
- **问题描述**：
  - `GET /users/{id}` 直接返回 `User` 实体（包含密码字段 `password`）。
  - `POST /users`、`PUT /users/{id}`、`DELETE /users/{id}` 返回 `Boolean`，不符合 RESTful 规范。
  - `getById` 未处理 `null`（若 ID 不存在会返回空体 200，而非 404）。
- **影响**：密码泄露风险；API 契约不统一；客户端难以判断操作是否真正成功。
- **修复建议**：
  1. 引入 `UserResponse` DTO，屏蔽敏感字段。
  2. 创建返回 201 + Location Header；更新返回 200 + DTO；删除返回 204 No Content。
  3. `getById` 不存在时返回 404。

---

### P2（中 — 注释质量 / 测试覆盖 / 代码细节）

#### P2-1 部分 Service/Config 类注释过于冗长，喧宾夺主
- **位置**：
  - `service/AccessManagementService.java`：几乎每个私有方法都写了大段 Javadoc，如 `normalizePermissions` 的注释长达 8 行，描述的是“去空值、去空格”这种一眼可见的逻辑。
  - `security/JwtTokenService.java`：构造函数注释超过 20 行，详细解释“为什么用 `@Value`”、“为什么用 HMAC256”。
  - `config/SecurityConfig.java`：类注释和每个 Bean 的注释都极长，甚至对 `BCryptPasswordEncoder` 的工作因子做了科普。
  - `OaBackendApplication.java`：`main()` 方法的 Javadoc 写了 5 行“设计原因”。
- **影响**：代码可读性反而下降；维护时修改代码容易忘记改注释，导致注释与代码脱节。
- **修复建议**：
  1. 删除对标准 Spring Boot 行为的解释性注释（如“为什么用 `SpringApplication.run`”）。
  2. 私有方法保留 1-2 行简洁注释即可；公共 API 保留 `@param`、`@return`，但避免大段设计论文。
  3. 复杂业务规则才需要详细注释，工具方法不必过度文档化。

#### P2-2 测试覆盖率严重不足
- **位置**：`src/test/java/com/oa/backend/`
- **问题描述**：
  - 仅 2 个测试类：`AuthControllerTest`（4 个用例）和 `OaApiIntegrationTest`（约 20 个用例）。
  - 对 `OaDataService`、`AccessManagementService`、`JwtTokenService` 等核心 Service 没有任何单元测试。
  - 没有边界测试：如表单审批时传入不存在的 ID、重复确认工资单、并发提交表单等。
  - `UserServiceImpl` 的 `findByUsername`、`findByWxUserId` 无测试。
- **影响**：重构风险极高；Bug 难以在开发阶段发现。
- **修复建议**：
  1. 为 `AccessManagementService` 写单元测试（认证成功/失败、角色 CRUD、权限边界）。
  2. 为拆分后的领域 Service（如 `FormService`、`PayrollService`）写单元测试，覆盖正常流和异常流。
  3. 对 `JwtTokenService` 测试 token 生成、过期验证、篡改检测。
  4. 集成测试补充负向用例：如 CEO 不能执行预结算、普通员工访问 `/payroll/cycles` 返回 403 等（部分已有，可继续完善）。

#### P2-3 表单审批权限在 Controller 和 Service 中重复校验
- **位置**：`controller/FormController.java:149-150`、`163-164` 与 `service/OaDataService.java:213-222`
- **问题描述**：Controller 已经检查了 `canApprove()`（PROJECT_MANAGER / CEO），Service 内部 `approveForm` 又根据 `currentNode` 二次检查 `approverRole`。
- **影响**：虽然增加了安全性，但职责边界模糊；如果前端角色与 Service 硬编码角色不一致，会出现“Controller 放行但 Service 拒绝”的调试困难。
- **修复建议**：权限校验应只保留一层。推荐做法：Controller 用 `@PreAuthorize` 做粗粒度拦截，Service 只做业务规则校验（如“该节点是否已审批过”），不再重复做角色判断。

#### P2-4 `PayrollController` 中存在完全相同的冗余方法
- **位置**：`controller/PayrollController.java:218-228`
- **问题描述**：`isFinance()` 和 `isFinanceOnly()` 方法体完全一致。
- **影响**：代码冗余，阅读时产生困惑。
- **修复建议**：删除其中一个，统一命名（如保留 `isFinanceOnly`）。

#### P2-5 `FormController.getApproverRole` 在流式操作中重复创建 List
- **位置**：`controller/FormController.java:208-210`
- **问题描述**：`.filter(authority -> Arrays.asList("ROLE_PROJECT_MANAGER", "ROLE_CEO").contains(authority))` 每次流处理都会新建一个 `Arrays.asList`。
- **影响**：性能微损耗（每次请求都分配新数组），且不够优雅。
- **修复建议**：提取为静态常量 `Set<String> APPROVER_ROLES = Set.of("ROLE_PROJECT_MANAGER", "ROLE_CEO")`，使用 `Set.contains()`。

#### P2-6 `RoleViewResponse` 在 record 上使用 `@param` Javadoc 标签
- **位置**：`dto/RoleViewResponse.java:5-15`
- **问题描述**：Java `record` 的组件自带名称和类型，使用 `@param` 逐个解释显得冗余，且非 Java record 的常规注释风格。
- **影响**：无功能影响，但风格怪异，IDE 自动生成时通常不会这样写。
- **修复建议**：删除 `@param` 标签，保留类级 1-2 行描述即可。

---

### P3（低 — 风格 / REST 规范 / 可维护性）

#### P3-1 `RetentionController` 的延期接口路径设计不符合 REST 惯例
- **位置**：`controller/RetentionController.java:39-49`
- **问题描述**：`POST /retention/policies/extend` 从 Request Body 中取 `policyId`。更 RESTful 的设计应为 `POST /retention/policies/{id}/extend`。
- **影响**：接口语义不够清晰；`policyId` 放在 body 中不如放在路径中直观。
- **修复建议**：改为 `POST /retention/policies/{id}/extend`，`extendDays` 和 `reason` 放 body。

#### P3-2 `SecurityConfig` 的包声明被放在了 Javadoc 之后
- **位置**：`config/SecurityConfig.java:1-19`
- **问题描述**：类级 Javadoc 注释块写在了 `package` 声明之前，虽然 Java 编译器允许，但极不常见，容易让人误以为是文件头注释。
- **影响**：阅读时产生困惑；某些代码格式化工具可能会报错或重新排序。
- **修复建议**：将 `package com.oa.backend.config;` 移到文件最顶部，Javadoc 紧跟其后。

#### P3-3 集合创建方式不统一
- **位置**：多个 Controller 和 Service
- **问题描述**：有的地方用 `List.of()`，有的地方用 `Arrays.asList()`，还有的地方用 `new ArrayList<>()`。
- **影响**：风格不一致；`Arrays.asList()` 返回的列表长度固定，若后续误用 `add()` 会抛异常。
- **修复建议**：不可变列表统一用 `List.of()`；需要可变列表时显式用 `new ArrayList<>()`。

#### P3-4 `AccessManagementService.buildProfile` 硬编码默认部门和员工类型
- **位置**：`service/AccessManagementService.java:116-128`
- **问题描述**：`buildProfile` 方法中写死了 `"未分配部门"` 和 `"普通员工"`。
- **影响**：若调用方传入部门信息会被忽略，灵活性差。
- **修复建议**：将默认值改为方法参数的可选重载，或从调用方传入。

---

## 三、推荐修复顺序

建议按照“先止血、再架构、后细节”的顺序推进：

### 第一阶段：止血（1-2 天）
1. **修复 P0-2**：修正 `OaDataService.toPayrollCycleResponse` 的字段映射 Bug。
2. **修复 P0-3**：给 `UserController` 加上权限校验（临时在方法内判断 `ROLE_CEO`）。
3. **修复 P1-1 / P1-2**：将 `getDisplayNameFromUsername`、`isCEO`、`isFinance` 等重复方法抽取到公共类；删除 `PayrollController` 中重复的 `isFinance` / `isFinanceOnly`。

### 第二阶段：架构治理（3-5 天）
4. **修复 P0-1**：拆分 `OaDataService` 为多个领域 Service，并基于现有 MyBatis-Plus Entity/Mapper 实现持久化（或至少抽象 Repository 接口）。
5. **修复 P1-2**：启用 `@EnableMethodSecurity`，逐步用 `@PreAuthorize` 替换 Controller 中的手写权限判断。
6. **修复 P1-3**：将 `WorkbenchController` 中的硬编码用户资料和菜单配置改为从 Service/配置表读取。
7. **修复 P1-6**：引入 `@RestControllerAdvice` 统一异常处理。

### 第三阶段：功能补全与安全加固（2-3 天）
8. **修复 P0-5 / P0-6**：将 `DirectoryImportController` 的校验逻辑下沉到 Service；实现 `PayrollController.createCorrection` 的真正业务逻辑。
9. **修复 P0-4**：给通知系统增加用户隔离字段和查询过滤。
10. **修复 P1-4 / P1-5**：JWT 支持多角色数组；金额字段全部改为 `BigDecimal`。
11. **修复 P1-7**：`UserController` 返回 DTO 而非 Entity，REST 响应规范化。

### 第四阶段：质量提升（持续）
12. **修复 P2-1**：精简过度冗长的 Javadoc。
13. **修复 P2-2**：为核心 Service 和边界场景补充单元测试与集成测试，目标行覆盖率 > 70%。
14. **修复 P3-1 / P3-2 / P3-3**：REST 路径规范化、包声明位置调整、集合 API 统一。

---

*报告结束*
