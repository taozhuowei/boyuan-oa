# 后端实现细节

> 描述博渊 OA 后端实际代码结构、安全机制、数据库迁移与 API 约定。

---

## 1. 包结构

```
src/main/java/com/oa/backend/
├── OaBackendApplication.java
├── annotation/
│   └── OperationLogRecord.java          # AOP 标记注解
├── aspect/
│   └── OperationLogAspect.java          # 拦截并写入 operation_log 表
├── config/
│   ├── SecurityConfig.java              # Spring Security + CORS
│   ├── MybatisPlusConfig.java           # MyBatis-Plus 分页与自动填充
│   └── SecurityUtilsInitializer.java    # SecurityUtils 初始化
├── controller/                          # REST 层，仅做参数校验（41 个）
│   ├── AuthController.java
│   ├── EmployeeController.java
│   ├── PayrollController.java / PayrollBonusController.java / PayrollItemDefController.java
│   ├── ProjectController.java / ProjectConstructionLogController.java / ProjectRevenueController.java
│   ├── AttendanceController.java
│   ├── ApprovalFlowController.java
│   ├── SetupController.java
│   ├── WorkbenchController.java
│   ├── ExpenseController.java / FormController.java / OrgController.java
│   ├── RoleController.java / SecondRoleController.java
│   ├── OperationLogController.java / NotificationController.java
│   ├── DevController.java               # @Profile("dev") 专用
│   └── ...
├── dto/                                 # 请求/响应 DTO，与实体解耦
├── entity/                              # MyBatis-Plus 实体，映射数据库表
├── filter/
│   └── TraceIdFilter.java               # 为每个请求生成 UUID trace_id，写入 MDC 并返回 X-Trace-Id 响应头
├── mapper/                              # MyBatis-Plus Mapper 接口
├── security/
│   ├── JwtTokenService.java             # JWT 生成与校验
│   ├── JwtAuthenticationFilter.java     # 每次请求解析 Token
│   ├── SecurityUtils.java               # 获取当前登录用户
│   └── ResetCodeStore.java              # 密码重置验证码内存存储
├── service/                             # 业务接口
│   ├── PayrollEngine.java               # 薪资计算引擎（位于 service 根目录）
│   ├── ApprovalFlowService.java
│   ├── EmployeeService.java
│   ├── ProjectService.java
│   ├── PayrollBonusService.java
│   └── impl/                            # 业务实现类
├── event/
│   ├── ApprovalNodeChangedEvent.java
│   ├── PayrollSlipPublishedEvent.java
│   ├── RetentionExpiredEvent.java
│   └── NotificationEventListener.java
└── ...
```

---

## 2. 数据库迁移（Flyway）

生产环境通过 Flyway 管理 schema 演进，文件位于 `src/main/resources/db/migration/`：

| 文件 | 说明 |
|------|------|
| `V1__init_schema.sql` | 初始化 35+ 张表 |
| `V2__init_data.sql` | 种子数据（角色、审批流模板等） |
| `V3__expense_module.sql` | 费用报销模块 |
| `V4__fix_expense_flow.sql` | 修复报销审批流 |
| `V5__payroll_composition.sql` | 薪资构成与工资条 |
| `V6__payroll_correction.sql` | 薪资更正 |
| `V7__second_role_aftersale_material_delegation_hr_fields.sql` | 二线角色、售后、材料、委托、HR 字段 |
| `V8__revenue_insurance_cost.sql` | 项目营收与保险成本 |
| `V9__construction_attendance_and_audit.sql` | 施工考勤与审计 |

---

## 3. 安全机制

- **JWT**：登录成功后返回 Token，前端通过 `Authorization: Bearer <token>` 携带；`JwtAuthenticationFilter` 每次请求解析并注入 `SecurityContext`。
- **当前用户获取**：任何位置通过 `SecurityUtils.getCurrentUser()` / `SecurityUtils.currentEmployeeNo()` 获取登录信息。
- **权限控制**：Controller 方法使用 `@PreAuthorize` 注解，基于 Token 中的角色与权限码校验。

---

## 4. AOP 操作日志

Controller 方法标注 `@OperationLogRecord(module = "...", operation = "...")` 后，`OperationLogAspect` 自动拦截并将日志写入 `operation_log` 表，包含操作人、模块、动作、请求参数与执行时间。

---

## 5. API 约定

- **基础路径**：`/api`（由 `server.servlet.context-path` 统一配置）
- **统一响应格式**：所有接口返回 `ApiResponse<T>`
  - 成功：`{ "code": 200, "message": "ok", "data": ... }`
  - 参数错误：`{ "code": 40000, "message": "...", "data": null }`
  - 未授权：`{ "code": 401, "message": "Token 无效或已过期", "data": null }`
- **开发专用接口**：`DevController` 带有 `@Profile("dev")`，仅在 dev 环境暴露。

---

## 6. 配置文件与环境

```
src/main/resources/
├── application.yml         # 默认配置（开发环境，H2 内存库）
└── application-prod.yml    # 生产环境（PostgreSQL，环境变量驱动）
```

**默认（dev）**：
- H2 内存数据库
- 自动加载 `db/schema.sql` + `db/data.sql`
- JWT 24 小时有效期

**生产（prod）**：
- PostgreSQL（通过 `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` 环境变量配置）
- **`DB_PASSWORD` 无 fallback，未设置将启动失败**（避免弱密码默认值）
- Flyway 启用，`spring.sql.init.mode = never`
- 附件上传目录通过 `OA_UPLOAD_DIR` 配置
- `JWT_SECRET` 与 `SIGNATURE_AES_KEY` 均强制从环境变量读取，无 fallback

启动方式：

```bash
# 开发
java -jar app.jar

# 生产
java -jar app.jar --spring.profiles.active=prod
```
