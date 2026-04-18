# 博渊 OA 平台 — 开发路线图 v2

> **唯一进度管理入口。** 完成一项立即打勾并提交。禁止跨状态跳跃。
>
> 状态：`[ ]` 待开发 / `[~]` 开发中 / `[>]` 待测试 / `[?]` 待验收 / `[x]` 已完成
>
> 状态流转规则：
> - `[ ]` → `[~]`：**开始编码前**立即改
> - `[~]` → `[>]`：代码写完，curl 或 HTTP 工具验证 API 返回预期响应
> - `[>]` → `[?]`：自动化测试全通过
> - `[?]` → `[x]`：人工在浏览器完成完整操作验收
>
> **完成定义**："代码存在"≠"功能可用"。每个状态流转必须满足对应证据要求，禁止以"基本可用"结项。

---

## 阶段总览

- **Phase A — 架构治理 + 清理**：安全加固、DB 索引、代码分层、命名规范、临时文件清除。A 阶段决定后续是否返工。
- **Phase B — 功能补全 + Bug 修复**：基于 A 阶段干净架构，补全所有功能缺口和已知缺陷。
- **Phase C — 测试覆盖**：编写并执行全部自动化测试，Claude 自执行黑盒测试。
- **Phase D — 人工验收**：用户在真实浏览器完成完整业务链路验收，Claude 跟进修复。
- **Phase E — 生产部署 + 工程规范**：首版上线 + 建立 git/PR/分支/代码审查/issue/SemVer/CHANGELOG/RUNBOOK 全套规范。规范越早建立越好。
- **Phase F — 微信小程序**：补齐小程序完整能力，含测试。
- **Phase G — 运维维护**：日常运维操作，引用 Phase E 建立的规范文档。

---

## Phase A — 架构治理 + 清理

> **目标**：消除上线前安全漏洞、性能隐患、架构腐化、命名不规范、遗留临时文件。
> **优先级**：A-SEC（安全）> A-DB（性能）> A-CODE（架构）> A-CLEAN（清理）> A-OPS（运维配置）。
> **完成标准**：所有子任务 `[x]`，`git ls-files` 无临时脚本，`app/h5/pages/` 无 kebab-case 目录，`app/` 下无 `*.test.ts`，后端每个 Controller 方法均有权限注解或 Service 层隔离。
>
> **Phase A 验收方案（代替人工 code review）**
> 用户不做 code review，改用三层自动化验收，全部通过后任务方可推进到 `[x]`：
> 1. **Agent Code Review** — 每批改动由独立 Code Reviewer agent 审查，PASS 才继续
> 2. **黑盒 API 测试** — 启动后端服务，Claude 亲自 curl 关键接口（含权限越权场景），验证实际响应
> 3. **自动化测试** — `mvn test`（392 个后端单测）+ `yarn workspace oa-h5 test`（21 个前端单测）全通过
> Phase C 的完整 e2e 覆盖留在 Phase C 统一完成，不作为 Phase A `[x]` 的前置条件。

---

### A-SEC — 安全漏洞修复

#### A-SEC-01 AttachmentController 无权限注解
- **目标**：附件接口对任意已认证用户全开，须添加权限隔离
- **范围**：`server/src/main/java/com/oa/backend/controller/AttachmentController.java`
- **步骤**
  1. 上传接口加 `@PreAuthorize("isAuthenticated()")`
  2. 下载接口加附件归属校验：仅上传者或业务关联角色（审批人/经理）可访问
  3. curl 测试：employee A token 访问 employee B 上传的附件 `GET /api/attachments/{id}` 返回 403
- **验收点**：无 token 访问附件返回 401；跨用户访问返回 403
- **验收流程**：curl 两个场景（无 token、跨用户 token），均返回预期状态码
- **状态**：`[x]`

#### A-SEC-02 WorkbenchController 无权限注解
- **目标**：工作台接口未认证可访问，须强制认证
- **范围**：`server/src/main/java/com/oa/backend/controller/WorkbenchController.java`
- **步骤**
  1. 在类级别或每个方法加 `@PreAuthorize("isAuthenticated()")`
  2. 覆盖：`/me/profile`、`/workbench/config`、`/workbench/summary`
  3. curl 测试：无 token 访问 `GET /api/workbench/summary` 返回 401
- **验收点**：无 token 访问 workbench 接口返回 401
- **验收流程**：`curl /api/workbench/summary`（不带 Authorization）→ 401
- **状态**：`[x]`

#### A-SEC-03 前端路由守卫覆盖不全
- **目标**：`PAGE_ACCESS` 当前仅覆盖 11 条路由（/config, /org, /role, /employees, /positions, /retention, /operation-logs, /payroll, /projects, /construction-log, /injury），其余业务页面对所有已登录用户全开
- **范围**：`app/h5/middleware/auth.global.ts`
- **步骤**
  1. 对照 DESIGN.md §5（各角色权限章节）确认每条路由应有的角色清单；清单与设计文档冲突时以 DESIGN.md 为准
  2. 补全以下未覆盖路由的角色限制（参考清单，以 DESIGN.md §5 为最终依据）：
     - `/attendance`：ceo, hr, finance, project_manager, department_manager, employee, worker
     - `/expense/apply`：所有角色（全员可发起报销）
     - `/expense/records`：ceo, finance, employee, worker, project_manager, department_manager, hr
     - `/forms`：所有角色
     - `/team`：ceo, hr, project_manager, department_manager
     - `/data-export`：ceo（路径 key 待 A-CLEAN-02 改为 `/data_export`）
     - `/data-viewer`：ceo（路径 key 待 A-CLEAN-02 改为 `/data_viewer`）
     - `/leave-types`：hr（路径 key 待 A-CLEAN-02 改为 `/leave_types`）
     - `/notifications`：所有角色
     - `/me`、`/me/password`：所有角色
     - `/workbench`：所有角色
     - `/todo`：ceo, finance, project_manager, department_manager, hr
     - `/allowances`：ceo
     - `/directory`：ceo, hr, finance
     - `/setup`：保持公共路由（仅未初始化时可达）
  3. 复核 11 条已有路由的角色清单是否与 DESIGN.md §5 一致，有偏差同步修正
  4. 逐条 curl 或浏览器验证：worker 访问 `/payroll` 放行（worker 可看本人工资条）、employee 访问 `/operation-logs` 被重定向、employee 访问 `/data-export` 被重定向
  - 注：步骤2中的 kebab-case 路由 key 使用当前实际路由名。A-CLEAN-02 完成目录重命名后会在其"全局替换引用"步骤中统一改为 snake_case，此处无需重复修改。
  - **实施策略**：对"全员可访问"的路由（`/workbench`、`/notifications`、`/me`、`/me/password`、`/forms`、`/expense/apply`、`/expense/records`、`/todo`、`/`）不加入 PAGE_ACCESS 白名单，沿用守卫默认语义"未列入 = 所有已登录用户放行"。仅对需要角色限制的路由显式加入白名单。ops 角色除 `/operation-logs`、`/data-export`、`/data-viewer`、`/notifications` 外的访问拦截，交由 Phase B B-FEAT-19 完成。
- **验收点**：`PAGE_ACCESS` 条目覆盖全部业务页面；越权访问统一重定向
- **验收流程**：employee.demo 登录 → 直接输入 `/data-export` URL → 重定向到首页；worker.demo → `/payroll` → 重定向
- **状态**：`[x]`

---

### A-DB — 数据库性能

#### A-DB-01 核心高频查询表缺索引（V14 迁移）
- **目标**：V1 建表无任何索引，数据量增长后查询性能将显著下降
- **范围**：`server/src/main/resources/db/migration/`（当前最新 V13，新建 V14）
- **步骤**
  1. 新建 `V14__add_indexes.sql`
  2. 为以下列添加索引：
     - `form_record(submitter_id)`、`form_record(project_id)`、`form_record(status)`
     - `approval_record(form_id)`、`approval_record(approver_id)`
     - `notification(recipient_id)`、`notification(is_read)`
     - `payroll_slip(employee_id)`、`payroll_slip(cycle_id)`
     - `payroll_slip_item(slip_id)`
     - `employee(department_id)`、`employee(role_code)`
  3. 在 H2（dev）和 PostgreSQL（prod）各执行一次，确认无报错
  4. `EXPLAIN` 关键查询（如 `SELECT * FROM form_record WHERE submitter_id = ?`）确认命中索引
- **验收点**：V14 迁移在两种数据库均成功；`EXPLAIN` 显示 Index Scan（PG）或 INDEX 关键字（H2）
- **验收流程**：启动后端，查看 Flyway 日志确认 V14 applied；执行 `EXPLAIN` 语句
- **实施补记**：本任务附带修复了一个 Phase A 前就存在的预存 bug — `db/schema.sql`（dev 用）未同步 V11/V12/V13 的 ALTER TABLE（project.contract_no/client_name/..、leave_type_def.quota_days/deduction_basis、employee.gender/id_card_no/birth_date），导致 dev 启动后 `/auth/login` 触发 BadSqlGrammarException（Column "gender" not found）返回 500。现将 V11/V12/V13 的列和 V14 的索引都补入 `schema.sql`，让 dev（schema.sql）与 prod（Flyway）等价。后续更彻底的方案（dev 也走 Flyway 单一 source）在 B-INFRA-01 跟进。
- **状态**：`[x]`（dev H2 端启动无错 + curl 登录/业务接口返回 200 / 401 符合预期；prod PostgreSQL 的 Flyway V14 应用待 Phase E 生产部署时验证）

---

### A-CODE — 代码架构修复

#### A-CODE-01 AuthController ConcurrentHashMap 无 TTL（内存泄漏）
- **目标**：手机变更流程的三个内存 Map 无过期清理，长期运行存在内存泄漏
- **范围**：`server/src/main/java/com/oa/backend/controller/AuthController.java:60-62`
- **步骤**
  1. 引入 Caffeine（项目是否已有依赖？若无则添加 `com.github.ben-manes.caffeine:caffeine`）
  2. 将三个 ConcurrentHashMap 替换为 Caffeine Cache，配置 TTL 30 分钟后过期
  3. 或：添加 `@Scheduled(fixedDelay = 1800000)` 定时清理超过 30 分钟的条目
  4. 单元测试：发起但不完成流程，验证 30 分钟（测试中缩短为 60 秒）后条目消失
- **验收点**：发起手机变更不完成，超过 TTL 后 Map 中无该条目；`jmap -histo` 显示 Map size 不随时间无限增长
- **验收流程**：单元测试通过；代码 review 确认无裸 ConcurrentHashMap
- **实施**：方案 B（@Scheduled 定时清理，零新依赖）。每 10 分钟执行 `cleanupExpiredPhoneChangeEntries()` 遍历 3 个 Map 移除过期条目。@EnableScheduling 已在 `OaBackendApplication.java:23` 开启。
- **状态**：`[x]`

#### A-CODE-02 WorkbenchController 直持 Mapper（业务逻辑渗入 Controller）
- **目标**：WorkbenchController 跨 4 个 Mapper 直接查询，绕过 Service 层
- **范围**：`server/src/main/java/com/oa/backend/controller/WorkbenchController.java`
- **步骤**
  1. 新建 `WorkbenchService.java`，将 Controller 中的多 Mapper 查询逻辑迁移至 Service
  2. Controller 仅保留 `@Autowired WorkbenchService`，调用 Service 方法返回结果
  3. 其余 Controller（AuthController/OrgController/AttachmentController）标记为技术债，在 Phase B 迭代中逐步整理（不在本任务范围）
- **验收点**：WorkbenchController 中无直接 Mapper 字段注入；代码 grep 确认
- **验收流程**：`grep -r "Mapper" WorkbenchController.java` 输出为空（无 Mapper 直接注入）；API 功能不回退（curl `/api/workbench/summary` 返回 200）
- **范围限定声明（2026-04-17 架构审查后修订）**：本任务**仅覆盖 WorkbenchController 一个文件**。审查发现全仓还有 **32 个 Controller 直持 Mapper**（AllowanceController、PayrollController、ProjectController、LeaveTypeController、AfterSaleController 等，其中 13 处直接在 Controller 体内 return Mapper.selectList）。这部分在 Phase A 内由 `A-AUDIT-DEBT-07` 批量处理（原计划归 Phase B，用户要求不留技术债已搬回 Phase A）。
- **状态**：`[x]`

#### A-CODE-03 缺全局异常处理器
- **目标**：各 Controller 错误响应格式不统一，BUG-E03 Toast 暴露 HTTP 字符串的根本原因
- **范围**：`server/src/main/java/com/oa/backend/exception/`（新建目录）
- **步骤**
  1. 新建 `GlobalExceptionHandler.java`，添加 `@ControllerAdvice`
  2. 统一处理：`BusinessException`、`AccessDeniedException`、`MethodArgumentNotValidException`、兜底 `Exception`
  3. 所有响应统一返回 `{"code": 4xx, "message": "业务语言描述"}` 结构，不暴露 Stack Trace
  4. 同步修复 `pages/me/password.vue` catch 块（`message.error(error.data?.message || '密码修改失败，请检查当前密码是否正确')`）
- **验收点**：所有 4xx 错误均返回统一 JSON 结构；`/me/password` Toast 显示业务语言
- **验收流程**：curl 一个必填校验失败场景，响应体为 `{"code": 400, "message": "..."}`；前端密码错误时 Toast 无 HTTP 格式字符串
- **状态**：`[x]`

---

### A-CLEAN — 目录与文件清理

#### A-CLEAN-01 测试文件散落源码目录
- **目标**：`app/*/test/` 下的测试文件违反"所有测试在 `test/` 目录"规则
- **范围**：
  - `app/h5/test/access.test.ts`、`setup.ts`（2 个文件）
  - `app/mp/test/access.test.ts`、`appshell.test.ts`、`org.test.ts`、`stores.user.test.ts`、`setup.ts`（5 个文件）
  - `app/shared/test/formLabels.test.ts`、`forms.test.ts`（2 个文件）
- **步骤**
  1. 将文件迁移至：`test/unit/h5/`、`test/unit/mp/`、`test/unit/shared/`
  2. 同步更新各 `vitest.config.ts` 中的 `include` 路径
  3. 删除 `app/h5/test/`、`app/mp/test/`、`app/shared/test/` 空目录
  4. 运行 `yarn workspace oa-h5 test && yarn workspace oa-mp test` 确认所有单元测试仍通过
- **验收点**：`app/` 目录下无任何 `*.test.ts` 文件；两个 workspace 测试均通过
- **验收流程**：`git ls-files app/ | grep ".test.ts"` 输出为空；`yarn workspace oa-h5 test` 通过
- **实施补记**：迁移后发现 stores.user.test.ts 因跨目录 import 导致 pinia 双实例问题（测试文件在 test/unit/mp，stores 在 app/mp/src，两条不同 import path 解析出两个 pinia 副本）。解决：app/mp/vitest.config.ts 增加 `resolve.alias.pinia` 强制解析到同一物理文件；同时加 `server.fs.allow: ['../..']` 允许 vitest 访问仓库根。H5 21/21 通过，MP 69/69 通过。
- **状态**：`[x]`

#### A-CLEAN-02 前端页面目录 kebab-case 命名违规
- **目标**：Nuxt 3 基于文件路由，目录名即 URL，kebab-case 违反 snake_case 命名规范
- **范围**：
  - `app/h5/pages/construction-log/` → `construction_log/`
  - `app/h5/pages/data-export/` → `data_export/`
  - `app/h5/pages/data-viewer/` → `data_viewer/`
  - `app/h5/pages/leave-types/` → `leave_types/`
  - `app/h5/pages/operation-logs/` → `operation_logs/`
  - `app/h5/pages/payroll/signature-bind.vue` → `signature_bind.vue`
- **步骤**
  1. git mv 每个目录（保留 git 历史）
  2. 全局替换所有引用：`auth.global.ts` 路由 key、`default.vue` ROLE_MENUS 路径、所有 `navigateTo`/`router.push` 字符串
  3. 启动前端，逐一访问重命名路由，确认 200 无死链
- **验收点**：`app/h5/pages/` 无连字符目录；所有路由可正常访问
- **验收流程**：`ls app/h5/pages/ | grep "-"` 输出为空；浏览器访问 `/construction_log`、`/data_export`、`/data_viewer`、`/leave_types`、`/operation_logs` 均正常加载
- **实施范围**：前端页面目录/文件重命名 + 所有前端路由引用（auth.global.ts、default.vue、navigateTo）同步更新 + WorkbenchService 返回的菜单 path 字段同步。**保留不改**：后端 API URL（`/config/leave-types`、`/logs/construction-logs`、`/operation-logs`，属于后端路径，非本次范围）、CSS 类名（`.construction-log-page` 等，行业惯例）、data-catch 测试标记、WorkbenchService MenuItem.code 字段（内部标识）。
- **状态**：`[x]`

#### A-CLEAN-03 临时测试脚本与产物已提交到 git
- **目标**：一次性测试脚本、运行产物、截图无 CI 入口，不是持久测试资产，应从 git 清除
- **范围**：`test/manual-test-2026-04-17/` 下所有非 Markdown 文件
  - 脚本：`run_tests.js`、`run_edge_tests.js`、`run_network_trace.js`
  - 运行产物：`edge_results.json`、`issues.json`、`network_failures.json`
  - 截图目录：`screenshots/`
  - 保留：`TEST_REPORT.md` 及同目录其他 `*.md`
- **步骤**
  1. `git rm` 上述 3 个 js + 3 个 json + `screenshots/` 整个目录
  2. 确认无其他散落的一次性脚本（全局 grep 无关脚本引用）
- **验收点**：`git ls-files test/manual-test-2026-04-17/` 仅含 `*.md` 文件
- **验收流程**：命令输出仅为 markdown 文件路径
- **状态**：`[x]`

#### A-CLEAN-04 server/README.md 超出快速启动范围
- **目标**：`server/README.md`（322 行）深入架构描述，与 `BACKEND_IMPL.md`（131 行）职责重叠
- **范围**：`server/README.md`、`server/BACKEND_IMPL.md`
- **步骤**
  1. 审查 `server/README.md` 内容，识别纯架构实现章节
  2. 将独有内容合并到 `server/BACKEND_IMPL.md`（避免丢失）
  3. 裁剪 `server/README.md` 为纯快速启动：环境要求、启动命令、常用命令、链接到 `BACKEND_IMPL.md`
  4. 目标：`server/README.md` ≤ 50 行
- **验收点**：`wc -l server/README.md` ≤ 50；无架构实现细节；链接到 BACKEND_IMPL.md
- **验收流程**：行数命令输出 ≤ 50；目视确认无重复内容
- **实施**：README 裁剪至 42 行，保留技术栈/开发命令/API 规范/文档链接。原 260+ 行测试设计内容与 `test/TEST_DESIGN.md` 重复，直接删除不合并。表格改列表（遵循"禁止 Markdown 表格"约定）。
- **状态**：`[x]`

#### A-CLEAN-05 空目录与死文件审查
- **目标**：清除无内容的空目录和无引用的死文件，避免遗留旧架构痕迹
- **范围**：全项目 `app/`、`server/src/`、`test/`
- **步骤**
  1. 执行 `find app server/src test -type d -empty` 列出所有空目录
  2. 逐一确认是否有业务需要：有则补充 `.gitkeep`，无则删除
  3. 执行 `grep -r "TODO:" app/h5/pages/ app/h5/components/ --include="*.vue"` 列出遗留 TODO 注释
  4. 逐一解决或将 TODO 内容转为本文档对应任务项
- **验收点**：`find app server/src test -type d -empty` 输出为空（或仅有 .gitkeep 的占位目录）；源码无遗留 TODO 注释
- **验收流程**：命令输出为空；代码 review 无 TODO 注释残留
- **实施**：删除 13 条 data-catch TODO 注释（forms/projects/construction_log/injury/payroll/Permission.vue）+ 1 条 EmployeeServiceImpl TODO。空目录无。所有 TODO/FIXME/XXX 搜索结果为 0。功能缺口线索已分别归入 Phase B B-FEAT-10/11/12（工伤/项目/施工日志）；forms 过滤器与 mp Permission 细粒度权限在 Phase B 验收或 Phase F 实施时处理。
- **状态**：`[x]`

#### A-CLEAN-06 vitest 配置文件整理
- **目标**：当前存在 5 个 vitest 配置文件，其中 1 个是冗余死文件，1 个从未被任何 script 或 CI 接入，A-CLEAN-01（测试文件迁移）完成后所有 include 路径将失效，须一并修正
- **范围**：`vitest.integration.config.ts`（根目录）、`app/mp/vitest.integration.config.ts`、`app/h5/vitest.config.ts`、`app/mp/vitest.config.ts`、`app/shared/vitest.config.ts`
- **现状分析**
  - `vitest.integration.config.ts`（根目录）：指向 `test/integration/**`，无 script，无 CI，**冗余，删除**
  - `app/mp/vitest.integration.config.ts`：真正工作的集成测试配置，放在 `app/` 下是为了 Yarn workspace node_modules 解析，无 script，无 CI，**保留但须接入**
  - `app/h5/vitest.config.ts`：H5 单元测试，已接入 CI，**保留**；A-CLEAN-01 后 include 路径须从 `test/**` 改为 `../../test/unit/h5/**`
  - `app/mp/vitest.config.ts`：MP 单元测试，已接入 CI（A-OPS-02 跳过中），**保留**；A-CLEAN-01 后 include 路径须同步修正
  - `app/shared/vitest.config.ts`：shared 单元测试，**无 script，无 CI，从未被执行**，须接入；A-CLEAN-01 后 include 路径须修正
  - 注：单元测试配置必须保留在各 workspace 目录，因为使用 `resolve(__dirname, ...)` 解析 `@shared` 别名，移走会断
- **步骤**（须在 A-CLEAN-01 测试文件迁移完成后执行）
  1. 删除根目录 `vitest.integration.config.ts`
  2. 更新 `app/h5/vitest.config.ts` 的 `include`：`test/**` → `../../test/unit/h5/**`；`setupFiles` 路径同步更新
  3. 更新 `app/mp/vitest.config.ts` 的 `include`：`test/**` → `../../test/unit/mp/**`，`../shared/test/**` → `../../test/unit/shared/**`；`setupFiles` 路径同步更新
  4. 更新 `app/shared/vitest.config.ts` 的 `include`：`test/**` → `../../test/unit/shared/**`
  5. 验证各配置路径生效：`yarn workspace oa-h5 test`、`yarn workspace oa-mp test` 均有测试输出且通过
- **验收点**：根目录无 `vitest.integration.config.ts`；各 workspace test 命令执行后有测试输出；`app/shared/vitest.config.ts` 的测试被包含在 `yarn workspace oa-mp test` 中（mp config 已含 shared 路径）
- **验收流程**：`ls vitest.integration.config.ts` 报 not found；`yarn workspace oa-h5 test` 通过
- **实施补记**：A-CLEAN-01 时已把 include/setupFiles 路径更新到 `../../test/unit/**`。本任务只剩删除根目录冗余 `vitest.integration.config.ts` 一步。MP config 已含 shared 测试路径；H5/MP/Shared 三个 config 的 include 路径全部有效。
- **状态**：`[x]`（A-CLEAN-01 已完成，配置路径已验证通过）

#### A-CLEAN-07 过大文件与单一职责违规审查
- **目标**：识别并拆分超过合理规模的文件，确保单一职责
- **范围**：`app/h5/pages/`、`server/src/main/java/com/oa/backend/controller/`
- **步骤**
  1. 执行 `wc -l app/h5/pages/**/*.vue | sort -n | tail -20`，列出最大的 Vue 文件
  2. 超过 400 行的 Vue 文件审查：是否将多个业务逻辑混入同一文件（如 `/attendance` 的多 Tab）
  3. 执行 `wc -l server/src/main/java/com/oa/backend/controller/*.java | sort -n | tail -10`
  4. 超过 200 行的 Controller 审查：多职责是否应拆分
  5. 对必须拆分的文件制定拆分计划，若本阶段无法完成则记录为 Phase B 技术债
- **验收点**：无单文件同时承担 3 个以上独立业务职责；拆分计划或技术债记录存在
- **验收流程**：审查报告写入本任务注释；代码 review 确认职责边界清晰
- **审查结果（2026-04-17）**：
  - Vue 文件超过 400 行的共 12 个。**职责最严重越界**（3+ 独立业务）：
    - `pages/projects/[id].vue`（1431 行）— 6 个 Tab：进度 / 成本 / 营收 / 施工日志 / 人员 / 售后。**必须拆**，建议按 Tab 拆 6 个 `pages/projects/tabs/*.vue` 子组件。
    - `pages/payroll/index.vue`（1246 行）— 薪资周期管理 / 结算操作 / 工资条查看。建议拆为 `pages/payroll/cycles.vue`、`pages/payroll/settle.vue`、`pages/payroll/slips.vue`（已有 `slips.vue`，复用）。
    - `pages/attendance/index.vue`（914 行）— 请假 / 加班 / 我的记录 / 发起加班通知。建议拆 4 个 Tab 组件。
    - `pages/config/index.vue`（567 行）— 企业信息 / 发薪日 / 数据保留 / 审批流 / 假期配置。建议拆为独立子页面或抽屉组件。
  - **Java Controller 超过 200 行的共 8 个**。**需拆**：
    - `AuthController.java`（530 行）— 登录 / 重置密码 / 手机号变更 三大流程。建议拆 `PasswordResetController`、`PhoneChangeController`，AuthController 仅保留 login/logout。
    - `ProjectController.java`（458 行）— 项目 CRUD / 成员 / 里程碑 / 成本 / 营收 混合。建议按业务域拆分。
  - **职责单一但行数偏大**（可保留或轻度重构）：`positions`（639）、`setup`（471，5 步向导，可拆子组件但不紧急）、`allowances`、`org`、`retention`、`notifications`、`signature_bind`。
- **处置方式**：上述拆分**不在 Phase A 范围**。将拆分任务归入 Phase B 新增 **B-DEBT（技术债）** 子节（详见下方 Phase B 末尾）统一执行。
- **状态**：`[x]`

---

### A-OPS — 运维配置修复

#### A-OPS-01 生产配置 DB_PASSWORD 有 fallback 弱密码
- **目标**：`application-prod.yml` 遗漏环境变量注入时数据库使用 "changeme" 弱密码
- **范围**：`server/src/main/resources/application-prod.yml`
- **步骤**
  1. 将 `password: ${DB_PASSWORD:changeme}` 改为 `password: ${DB_PASSWORD}`（无 fallback）
  2. 同步更新 `server/BACKEND_IMPL.md` 中生产部署环境变量说明
  3. 确认 JWT_SECRET 是否有类似问题，若有则同步修复
- **验收点**：`application-prod.yml` 中 `DB_PASSWORD` 无冒号后 fallback 值
- **验收流程**：`grep "DB_PASSWORD" server/src/main/resources/application-prod.yml` 输出无 "changeme"
- **状态**：`[x]`

#### A-OPS-02 CI frontend-mp-test job 必定失败
- **目标**：`app/mp/` 为 Phase F 尚未开发，CI 每次 push 必定失败
- **范围**：`.github/workflows/ci.yml`
- **步骤**
  1. 将 `frontend-mp-test` job 用条件跳过：`if: false`（或注释该 job）
  2. 添加注释说明：Phase F 启动时恢复
  3. 推送一次测试，确认 CI 三个 job 为：backend-test（绿）、frontend-h5-test（绿）、frontend-mp-test（跳过/无）
- **验收点**：push main 后 CI 全绿；无 `frontend-mp-test` 失败记录
- **验收流程**：GitHub Actions 页面确认 workflow 状态
- **状态**：`[x]`

---

### A-AUDIT — 架构审查后修复（2026-04-17 三方审查汇总）

> **来源**：Software Architect / Security Engineer / Evidence Collector 三位 agent 独立审查 Phase A 完成态，共发现 5 P0 + 12 P1 + 9 P2。下列任务将其分解为可执行单元。
> **执行规则**：开发与审核 agent 分离；每个任务单元完成后由不同 agent 多维度验收；不通过必修。
> **完成标准**：23 个子任务全部 `[x]`，不回退。

#### A-AUDIT-SEC — 安全类

- `[x]` **A-AUDIT-SEC-01** 短信验证码明文日志降级 — `AuthController.java:221,303,369` 三处 `log.info(".. code: {} ..")` 降级为 `log.debug`，且仅记脱敏手机号（如 `138****0000`），不落 code 本身
- `[x]` **A-AUDIT-SEC-02** TestController Profile 收窄 — `TestController.java` 类级 `@Profile("!prod")` → `@Profile("dev")`，与 DevController 一致
- `[x]` **A-AUDIT-SEC-03** EmployeeResponse 敏感字段脱敏 — `EmployeeResponse.java` 删除 `isDefaultPassword` 字段；`idCardNo` 仅 CEO/HR 可见（通过 service 层过滤），其余角色返回 `"****"` 或省略
- `[x]` **A-AUDIT-SEC-04** CORS 按 profile 区分 — `SecurityConfig.java:81-86` localhost allow 只在 dev 生效；prod 从 `app.cors.origins` 环境变量读取
- `[x]` **A-AUDIT-SEC-05** AllowanceController GET 权限收窄 — `AllowanceController.java:44` `@PreAuthorize("isAuthenticated()")` → `hasAnyRole('CEO','HR','FINANCE')`

#### A-AUDIT-CODE — 代码架构类

- `[x]` **A-AUDIT-CODE-01** 角色码 `gm` → `general_manager` 统一 — `SetupService.java:317,325` 两处字符串改为 `"general_manager"`，消除与 V7/V10/data.sql/前端守卫的命名冲突
- `[x]` **A-AUDIT-CODE-02** WorkbenchService demo 硬编码移除 — `WorkbenchService.java:62-88` 的 `buildUserProfile` switch 删除；改为通过 `EmployeeMapper` 查 `employee + department` 返回真实数据
- `[x]` **A-AUDIT-CODE-03** 20+ Controller `e.getMessage()` 清理 — 目标文件：PayrollController（7 处）、SignatureController（2）、SetupController（4）、ProjectRevenueController（2）、PayrollBonusController（2）、TemporaryDelegationController（2）、RoleController（1）。删除 Controller 层 `try/catch` + `ResponseEntity.status(.).body(Map.of("message", e.getMessage()))` 模式，改为抛 `BusinessException` 或让异常传播到 `GlobalExceptionHandler`
- `[x]` **A-AUDIT-CODE-04** GlobalExceptionHandler 补全 6 种异常 — 添加 `DataIntegrityViolationException(409)` / `MethodArgumentTypeMismatchException(400)` / `HttpMessageNotReadableException(400)` / `MaxUploadSizeExceededException(413)` / `AuthenticationException(401)` / `NoHandlerFoundException(404)` 的 `@ExceptionHandler`
- `[x]` **A-AUDIT-CODE-05** @Scheduled 迁出 Controller — `AuthController.cleanupExpiredPhoneChangeEntries` 迁出到 `server/.../scheduler/PhoneChangeCleanupScheduler.java`；三个 Map 也一并转移，Controller 通过 Service 访问
- `[x]` **A-AUDIT-CODE-06** 前后端菜单双源统一 — 以 `default.vue:ROLE_MENUS` 为单一来源，`WorkbenchService.buildMenus` 返回值**完全对齐**；修正 3 处已知漂移：ceo 菜单补 `/leave_types`、worker 菜单前后端 `/attendance` 统一、`employee` 显式 case（不再走 default）；所有 Unicode 转义（`"\u5de5\u4f5c\u53f0"` 等）改为中文字面量
- `[x]` **A-AUDIT-CODE-07** WorkbenchSummary DTO 独立 — 新建 `dto/WorkbenchSummaryResponse.java`；删除 `WorkbenchService.WorkbenchSummary` 内部类；Controller 返回 `ResponseEntity<WorkbenchSummaryResponse>`（去 `ResponseEntity<?>`）
- `[x]` **A-AUDIT-CODE-08** A-CODE-02 验收范围回退 + 登记后续批量治理任务 — TODO.md A-CODE-02 已加"范围限定声明"（已完成）；后续批量治理原为 B-DEBT-07，用户要求不留技术债，现已搬回 Phase A 作 `A-AUDIT-DEBT-07`

#### A-AUDIT-FIX — Bug 修复

- `[x]` **A-AUDIT-FIX-01** PayrollController `unlock` 吞异常 — `PayrollController.java:160` `catch (Exception ignored) {}` → 至少 `log.error("notify finance failed on cycleId={}", id, e);`
- `[x]` **A-AUDIT-FIX-02** `/forms/leave` `/forms/overtime` 死链 — `WorkbenchService.java:94-95` quickActions path 改为 `/forms?type=leave` / `/forms?type=overtime`，且前端 `pages/forms/index.vue` 支持 query 参数初始化对应表单
- `[x]` **A-AUDIT-FIX-03** Attachment 横向越权 + 文件类型白名单 — `AttachmentController.canAccess` 加业务归属校验：根据 `businessType`+`businessId` 查找 `form_record` / `injury_claim` 等表，验证当前用户是否为对应项目/部门审批人；上传加 MIME 白名单 `{pdf,jpg,jpeg,png,gif,webp,xlsx,docx}` + magic bytes 校验

#### A-AUDIT-CLEAN — 清理类

- `[x]` **A-AUDIT-CLEAN-01** 登录页硬编码公司名 — `app/h5/pages/login.vue`（及 mp 对应页）从 `/api/setup/status` 读 `companyName`，消除硬编码"众维建筑工程有限公司"
- `[x]` **A-AUDIT-CLEAN-02** TypeScript `any` 批量清理 — 28 个 `.vue` 页面里 158 处 `any` + 41 处 `as any`。重点文件：`employees/index.vue`、`attendance/index.vue`、`payroll/index.vue`、`config/index.vue`、`projects/[id].vue`、`role/index.vue` 等。用 antd 官方类型（`TableProps`、`ButtonProps`、`FormItemProps` 等）替换；无法替换的 `as any` 必须加 `// 原因：xxx` 注释说明
- `[x]` **A-AUDIT-CLEAN-03** `slips.vue` 路径冲突清理 — `app/h5/pages/payroll/slips.vue` 当前是空转发页。删除该文件（Nuxt 不再生成 `/payroll/slips` 路由）；或若有用途，明示功能
- `[x]` **A-AUDIT-CLEAN-04** `app/shared` vitest 配置去重 — `app/mp/vitest.config.ts` 已 include `../../test/unit/shared/**`，`app/shared/vitest.config.ts` 同路径重复。确认无 CI 依赖后删除 shared 配置，或给它分配独立用途（如仅跑 node 环境的纯函数测试）

#### A-AUDIT-OPS — 运维配置类

- `[x]` **A-AUDIT-OPS-01** `server.error` 响应加固 — `application.yml` 新增：
  ```yaml
  server:
    error:
      include-message: never
      include-binding-errors: never
      include-stacktrace: never
      include-exception: false
  ```
- `[x]` **A-AUDIT-OPS-02** H2-console 移出默认配置 — 新建 `application-dev.yml` 保留 `spring.h2.console.enabled: true`；`application.yml` 删除此配置（或改为 `enabled: ${H2_CONSOLE_ENABLED:false}`）；避免 prod profile 未激活时误暴露

#### A-AUDIT-DB — 数据种子类

- `[x]` **A-AUDIT-DB-01** `ops` 角色种子数据 — `db/data.sql` 的 `sys_role` `MERGE INTO` 表补 `(id=9, role_code='ops', role_name='运维', ...)`；`schema.sql` 无需改动。Flyway 侧：如 Phase B 后需要 prod 部署，建 `V15__add_ops_role.sql` 同步

#### A-AUDIT-ERR — 错误处理后续（原 B-DEBT-ERR 搬回）

- `[x]` **A-AUDIT-ERR-01** 剩余 Controller `catch (Exception)` 清理 — AuthController（5 处）、OrgController（6）、EmployeeController（3）、TeamController（1）、AttachmentController（1）、SecondRoleController（1）、WorkItemTemplateController（1）、WorkLogController（1）共计保留 catch+log.warn 兜底（辅助查询不中断主响应）；commit 5ecdb7e
- `[x]` **A-AUDIT-ERR-02** GlobalExceptionHandler 常见异常补齐 — 补 `ConstraintViolationException`→400、`HttpRequestMethodNotSupportedException`→405、`HttpMediaTypeNotSupportedException`→415、`HttpMediaTypeNotAcceptableException`→406；commit 5ecdb7e
- `[x]` **A-AUDIT-ERR-03** 异常处理日志级别调优 — `DataIntegrityViolationException` / `MaxUploadSizeExceededException` 日志级别从 `debug` 提升到 `warn`；commit 5ecdb7e
- `[x]` **A-AUDIT-ERR-04** 批次 1 审计的 7 条空 catch 清理 — `SecondRoleController`、`EmployeeController`、`WorkItemTemplateController`、`WorkLogController`、`JwtAuthenticationFilter`→log.warn；`ConstructionAttendanceService`→DuplicateKeyException+log.debug；`PayrollEngine`→DateTimeParseException+log.debug；commit 5ecdb7e

#### A-AUDIT-INFRA — 开发环境基础设施（原 B-INFRA 搬回）

- `[x]` **A-AUDIT-INFRA-01** 统一 dev/prod 数据库初始化路径 — 采用方案 B：CI 新增 migration-validate job，PostgreSQL 15 容器运行全部 V*.sql 迁移，每次 push 自动校验。方案 A（dev 启 Flyway）因 V2 ON CONFLICT 与 H2 2.2.224 不兼容暂不可行；commit e3e80c1

#### A-AUDIT-DEBT — 架构拆分（原 B-DEBT 搬回，7 项）

- `[x]` **A-AUDIT-DEBT-01** `projects/[id].vue` 按 Tab 拆分 — 1431 行 6 个 Tab 拆为 `pages/projects/tabs/progress.vue`、`tabs/cost.vue`、`tabs/revenue.vue`、`tabs/logs.vue`、`tabs/members.vue`、`tabs/aftersale.vue`；父页面保留 Tab 切换骨架；每子组件 ≤ 400 行
- `[x]` **A-AUDIT-DEBT-02** `payroll/index.vue` 拆分 — 1246 行拆为周期管理 / 结算操作 / 工资条查看三个独立组件；拆分后 finance 周期→结算→发放链路完整；?tab= URL 同步已补全
- `[x]` **A-AUDIT-DEBT-03** `attendance/index.vue` 按 Tab 拆分 — 914 行拆为请假 / 加班 / 我的记录 / 发起加班通知四个 Tab 组件（注意 A-AUDIT-FIX-02 已引入 ?tab= query 激活逻辑，保留）；onTabChange 补全 router.replace
- `[x]` **A-AUDIT-DEBT-04** `config/index.vue` 按配置域拆分 — 567 行拆为企业信息 / 发薪日 / 数据保留 / 审批流 / 假期配置各自独立抽屉或子页面
- `[x]` **A-AUDIT-DEBT-05** AuthController 按流程拆分 — 519→289 行，新建 PasswordResetController(3 端点) + PhoneChangeController(4 端点)；commit 3eade02
- `[x]` **A-AUDIT-DEBT-06** ProjectController 按业务域拆分 — 458→234 行，新建 ProjectMemberController(2 端点) + ProjectMilestoneController(8 端点)；cost/revenue 已存在独立 Controller；commit 3eade02
- `[x]` **A-AUDIT-DEBT-07** Controller 层批量下沉 Service — 33 个 Controller 共 69 处 Mapper 注入全部迁入 Service 层；新建 26 个 Service 类，扩展 8 个已有 Service；grep 验收通过（controller 层零 Mapper 注入）；commit b13f794 — 全仓另有 32 个 Controller 直持 Mapper（13 处直接在 Controller 体内 `return Mapper.selectList()`）。范围：AllowanceController / Payroll 系列 / Project 系列 / AuthController / RoleController / SecondRoleController / Attendance 系列 / LeaveTypeController / AfterSaleController / InjuryController / MaterialCostController / FormController / NotificationController / OperationLogController / OrgController / DepartmentController / EmployeeController / SignatureController / SystemConfigController / SetupController / DevController / TestController。原则：每个 Controller 对应一个 Service，Mapper 仅从 Service 注入；13 处 `return selectList` 封装为 `listXxx()` Service 方法。验收：`grep -rn "private final.*Mapper" server/.../controller/` 输出为空

#### A-AUDIT-FOLLOWUP — 审计中发现的非阻塞小项（收敛清理）

- `[x]` **A-AUDIT-FOLLOWUP-01** EmployeeController.listEmployees N+1 查询 — listEmployees 入口一次性解析 currentEmployeeId，新重载 toResponse(Employee,Long,Authentication) 消除 N+1；commit 5f298b3
- `[x]` **A-AUDIT-FOLLOWUP-02** PhoneChangeService record 可见性收紧 — 不可做：PhoneChangeCodeEntry/TokenEntry 被 AuthController（不同包）直接引用，必须保持 public；无代码变更
- `[x]` **A-AUDIT-FOLLOWUP-03** login.vue + app.vue 合并 `useCompanyName` composable — 抽 `composables/useCompanyName.ts`，双组件均改用 composable；commit 5f298b3
- `[x]` **A-AUDIT-FOLLOWUP-04** `/me/profile` @Cacheable 性能优化 — 新增 CacheConfig + Caffeine + UserProfileService @Cacheable(TTL 60s)，WorkbenchService 委托给缓存 bean；commit 5f298b3
- `[x]` **A-AUDIT-FOLLOWUP-05** 前端剩余 22 个 .vue 文件 `any` 清理 — 10 个文件 15 处处理完毕：3 处替换具体类型（FormRecord/AntdTreeDropInfo/Position），2 处 catch 改 unknown 并修 message 访问，10 处保留 as any 加原因注释（antd 类型限制）；commit 75f7b05 — A-AUDIT-CLEAN-02 只清了 6 个高频文件。剩余文件全量 grep `:\s*any\b\|\bas any\b`，逐一用 antd 官方类型 / `Record<string, unknown>` / 具体 interface 替换；无法替换的 `as any` 必须加 `// 原因：xxx` 注释
- `[x]` **A-AUDIT-FOLLOWUP-06** `default.vue` `normalizePath` 死代码清理 — 删除 normalizePath 函数，buildMenuItems 改用 m.path 直传；commit 5f298b3
- `[x]` **A-AUDIT-FOLLOWUP-07** projects/[id].vue `member-row-` DOM id 变更同步 — e2e_04_pm.spec.ts 第 79 行 `member-row-worker.demo` 改为 `member-row-5`（worker.demo seed ID=5）；data-catch 属性已在 members.vue 使用 employeeId 格式
- `[x]` **A-AUDIT-FOLLOWUP-08** 历史 `role_code='gm'` 数据迁移 — V16__migrate_gm_role.sql 已创建，幂等 UPDATE/DELETE；commit 5f298b3

#### A-AUDIT-TEST — 单元测试层预存技术债

- `[x]` **A-AUDIT-TEST-01** 修复 Backend 单元测试编译失败 — Phase A 前就存在的预存 bug：`ProjectServiceImplTest.java` / `EmployeeServiceImplTest.java` 使用了旧 DTO 构造签名，V11/V13 扩展 DTO 字段后 `mvn test-compile` 失败，`mvn test` 整体阻塞。更新两个测试类的构造函数调用，补齐新字段（多数可传 null）；确保 `mvn test` 全量通过（已有的 Integration Test 500 同时修或至少定位）

---

## Phase B — 功能补全 + Bug 修复

> **前置条件**：Phase A 全部 `[x]`。
> **目标**：在干净架构基础上修复全部已知缺陷，补全所有功能缺口。
> **完成标准**：所有 P0/P1 bug `[x]`，P2/P3 bug `[x]`，所有功能 `[?]`（待人工浏览器验收）。

---

### B-P0 — 核心业务阻断（3 条）

#### B-P0-01 HR 角色无法读取员工与岗位数据
- **目标**：HR 登录后员工列表报 403，无法使用基础人事功能
- **范围**：`EmployeeController.java:44`、`PositionController.java`（GET 端点）
- **步骤**
  1. `EmployeeController` `GET /employees`：`@PreAuthorize` 追加 `'HR'`
  2. `PositionController` GET 端点：同步追加 `'HR'`
  3. curl 测试：HR token 访问两个接口均返回 200
- **验收点**：HR token 访问员工列表 200；员工创建弹框部门/岗位下拉有数据
- **验收流程**：`curl -H "Authorization: Bearer {hr-token}" /api/employees` → 200
- **附注**：同步追加了 `DEPARTMENT_MANAGER`，与 auth.global.ts `/employees` 路由守卫对齐。PositionController GET 端点暂未追加 `DEPARTMENT_MANAGER`（设计意图待确认，见 B-FEAT-04）
- **状态**：`[?]`

#### B-P0-02 PM 角色无法读取团队成员数据
- **目标**：PM 访问 `/team` 报 403，无法查看项目成员
- **范围**：`TeamController.java:35`
- **步骤**
  1. `@PreAuthorize` 改为 `hasAnyRole('DEPARTMENT_MANAGER','PROJECT_MANAGER')`
  2. curl 测试：PM token 访问 `GET /team` 返回 200
- **验收点**：PM token 访问团队接口 200
- **验收流程**：curl 验证
- **状态**：`[?]`

#### B-P0-03 报销类型接口 500，报销申请全程阻断
- **目标**：`expense_type_def` 表无数据导致 500，报销功能完全不可用
- **范围**：`server/src/main/resources/db/data.sql`（H2 种子数据）
- **步骤**
  1. 确认 `expense_type_def` 表结构（列名/约束）
  2. 补充种子数据：差旅费、餐饮费、办公耗材、交通费、住宿费（至少 5 条）
  3. 若表结构缺失，先补 DDL migration（V15）
  4. 重启后端，curl 测试 `GET /expense/types` 返回非空数组
- **验收点**：`GET /api/expense/types` 返回 200 且数组非空
- **验收流程**：curl 确认
- **附注**：同步将 `expense_type_def` 的 CREATE TABLE 补入 `schema.sql`，确保 H2 dev 启动时表存在
- **状态**：`[?]`

---

### B-P1 — 接口缺失 / 权限泄露

#### B-P1-01 系统配置 API 实际可用性验证
- **目标**：Reality Checker 确认代码存在（`SystemConfigController.java:74–151`），但需验证运行时确实 200
- **范围**：`SystemConfigController.java`
- **步骤**
  1. 启动后端，用 CEO token curl 测试三个接口：
     - `GET /api/config/company-name` → 200
     - `GET /api/config/payroll-cycle` → 200
     - `GET /api/config/retention-period` → 200
  2. 若任一 404，检查是否需要重启或路由注册问题
  3. CEO `/config` 页面三个配置区域均可加载并保存
- **验收点**：三个接口均 200；CEO 配置页可正常使用
- **验收流程**：curl 三条命令全部返回 200
- **状态**：`[?]`（curl 验证：company-name/payroll-cycle/retention-period 均 200；等待浏览器验收）

#### B-P1-02 请假类型 404，考勤请假 Tab 全失效
- **目标**：`leave_type_def` 表无种子数据，请假类型下拉为空
- **范围**：`server/src/main/resources/db/data.sql`、`LeaveTypeController.java`
- **步骤**
  1. 重启后端（确保 LeaveTypeController 已注册）
  2. 种子数据补充：年假、病假、事假、婚假、产假、调休假（至少 6 条）
  3. curl `GET /api/config/leave-types` → 200 非空数组
  4. 前端 `/attendance` 假种下拉有数据；HR `/leave_types` 列表有数据
- **验收点**：接口 200；前端下拉非空
- **验收流程**：curl 验证；浏览器抽查
- **状态**：`[?]`

#### B-P1-03 Employee 可访问 /data_export（前端权限泄露）
- **目标**：`PAGE_ACCESS` 无 `/data_export` 条目，已登录用户均可访问
- **范围**：`app/h5/middleware/auth.global.ts`（已在 A-SEC-03 统一补全，此为回归验收）
- **步骤**：A-SEC-03 完成后验证此路由已正确限制
- **验收点**：employee 直接访问 `/data_export` 被重定向到首页
- **验收流程**：employee.demo 登录后直接输入 URL，观察重定向
- **状态**：`[?]`（A-SEC-03 已补全 PAGE_ACCESS，/data_export 已限 ceo/ops，代码核查通过）

#### B-P1-04 Finance 工伤页面"加载记录失败"
- **目标**：Finance 角色无工伤记录读取权限
- **范围**：对应工伤记录 Controller（`@PreAuthorize` 缺 `'FINANCE'`）
- **步骤**
  1. 定位接口（`GET /api/logs/records` 或工伤相关 Controller）
  2. `@PreAuthorize` 追加 `'FINANCE'`
  3. curl 测试：Finance token 访问工伤列表返回 200
- **验收点**：Finance 访问 `/injury` 可看到工伤申报列表，无 Toast 报错
- **验收流程**：curl 验证；浏览器确认
- **状态**：`[?]`（InjuryClaimController GET /injury-claims 已有 hasAnyRole('FINANCE','CEO')，Finance 已包含，代码核查通过）

#### B-P1-05 工作台待办多角色 403，角标恒为 0
- **目标**：`FormController GET /forms/todo` 仅部分角色有权，致多角色角标为 0
- **范围**：`FormController.java:38`、`EmployeeController.java:44`
- **步骤**
  1. `/forms/todo`：追加 `'HR'`、`'EMPLOYEE'`、`'WORKER'`、`'DEPARTMENT_MANAGER'`
  2. `/employees`（已在 B-P0-01 修复）：确认同步
  3. curl 测试：dept_manager token 访问 `/forms/todo` 返回 200；角标数值 > 0
- **验收点**：所有角色角标显示真实数值
- **验收流程**：curl 各角色 token 验证 `/forms/todo` 均 200
- **状态**：`[?]`（HR/EMPLOYEE/WORKER/DEPARTMENT_MANAGER 已追加到 /forms/todo @PreAuthorize）

---

### B-P2 — 权限 / 路由 / 错误提示

#### B-P2-01 HR 侧边栏"假期配额管理"浏览器验收
- **目标**：代码层已修复（ROLE_MENUS.hr 含 `/leave_types`），需浏览器确认
- **范围**：`app/h5/layouts/default.vue`
- **步骤**：HR 账号登录，侧边栏可见"假期配额管理"入口并可点击进入
- **验收点**：侧边栏入口可见且可用
- **验收流程**：hr.demo 登录浏览器验收
- **状态**：`[?]`（代码核查已过；等待 Phase D 浏览器验收）

#### B-P2-02 Worker 侧边栏"考勤管理"浏览器验收
- **目标**：代码层已修复（ROLE_MENUS.worker 含 `/attendance`），需浏览器确认
- **范围**：`app/h5/layouts/default.vue`
- **步骤**：Worker 账号登录，侧边栏可见"考勤申请"入口
- **验收点**：入口可见且可用
- **验收流程**：worker.demo 登录浏览器验收
- **状态**：`[?]`（代码核查已过；等待 Phase D 浏览器验收）

#### B-P2-03 角色管理仅显示 5 个角色
- **目标**：CEO `/role` 页面应显示至少 7 个内置角色
- **范围**：`GET /api/roles` 查询逻辑；种子数据 `hr`、`department_manager` 状态值
- **步骤**
  1. 查看 `GET /api/roles` 查询条件是否过滤特定状态
  2. 检查种子数据中 hr/department_manager 的 status 字段值是否正确
  3. 修复查询条件或种子数据，确保 7 个内置角色均出现
- **验收点**：CEO `/role` 页面显示 ≥ 7 个内置角色
- **验收流程**：CEO 登录浏览器查看角色管理页
- **状态**：`[?]`（AccessManagementService.init() 扩展至 9 个角色；hr.demo/dept_manager.demo seedAccount 已恢复）

#### B-P2-04 CEO 侧边栏缺考勤管理入口
- **目标**：CEO 应可访问考勤管理，但 ROLE_MENUS.ceo 无 `/attendance`
- **范围**：`app/h5/layouts/default.vue` ROLE_MENUS.ceo
- **步骤**
  1. 添加 `/attendance` 菜单项到 ROLE_MENUS.ceo
  2. 确认 `auth.global.ts` 中 `/attendance` 已含 `ceo`
- **验收点**：CEO 侧边栏可见考勤管理入口；CEO 可访问考勤页面
- **验收流程**：ceo.demo 登录浏览器验收
- **状态**：`[?]`（ROLE_MENUS.ceo 已补 /attendance 菜单项，auth.global.ts /attendance 已含 ceo）

#### B-P2-05 HR 访问 /payroll 被重定向
- **目标**：确认 HR 是否应有薪资访问权限（需产品确认）
- **范围**：`app/h5/middleware/auth.global.ts:23`
- **步骤**
  1. 对照 DESIGN.md §5 确认 HR 角色薪资权限范围
  2. 若应有：`'/payroll': [...]` 追加 `'hr'`
  3. 若不应有：在 TODO 备注"已确认排除"，关闭此任务
- **验收点**：与 DESIGN.md 规定一致
- **验收流程**：对照设计文档确认后 curl 验证
- **状态**：`[?]`（DESIGN.md §5.3 明确 HR 不含薪资数据；auth.global.ts /payroll 未含 hr，已符合设计）

#### B-P2-06 密码修改 Toast 暴露 HTTP 错误字符串
- **目标**：密码错误时 Toast 显示 "[POST] /api/... 400 Bad Request"，应显示业务语言
- **范围**：`app/h5/pages/me/password.vue`（已在 A-CODE-03 中连带修复 GlobalExceptionHandler）
- **步骤**
  1. A-CODE-03 完成后，确认此 Toast 问题已通过 `error.data?.message || '...'` 兜底修复
  2. 测试：输入错误当前密码，Toast 显示业务语言
- **验收点**：Toast 无 HTTP 格式字符串
- **验收流程**：浏览器操作验收
- **状态**：`[?]`（password.vue catch 块已有 fetchError?.data?.message 兜底，A-CODE-03 已修复）

---

### B-P3 — 种子数据 / 表单校验轻微问题

- `[?]` **B-P3-01 岗位管理无种子数据** — `db/data.sql` 补 3–5 条 position 记录；`yarn test:integration` 中岗位相关断言通过
- `[?]` **B-P3-02 补贴配置无种子数据** — `db/data.sql` 补 allowance_def 记录（全局补贴、岗位补贴各 1 条）
- `[?]` **B-P3-03 CEO 考勤「我的记录」为空** — `db/data.sql` 为 ceo.demo 补 1–3 条考勤记录
- `[?]` **B-P3-04 数据查看器文件格式描述错误** — `pages/data_viewer/index.vue` 页面提示改为 ".obk" 格式（DESIGN.md §10.3）
- `[?]` **B-P3-05 Finance 侧边栏含「通讯录导入」入口** — 对照 DESIGN.md §5.4 确认 Finance 是否应有此入口；确认后删除或保留
- `[?]` **B-P3-06 初始化向导 CEO 手机号无格式校验** — `pages/setup/index.vue` 追加 `/^1[3-9]\d{9}$/` 正则校验，不合格则禁止提交
- `[?]` **B-P3-07 新增员工身份证号无格式校验** — `pages/employees/index.vue` 追加 18 位格式规则（前 17 位数字 + 末位数字或 X）
- `[?]` **B-P3-08 密码策略不一致（setup ≥8 位 vs change ≥6 位）** — `pages/me/password.vue` 中 `min: 6` 改为 `min: 8`
- `[?]` **B-P3-09 报销明细金额接受负数和零** — `pages/expense/apply/index.vue` 金额输入框追加 `:min="0.01"`

---

### B-FEAT — 功能补全

#### B-FEAT-01 假期配额管理页面 /leave_types（HR）
- **目标**：整页缺失，需从零实现
- **范围**：`app/h5/pages/leave_types/index.vue`（Phase A 重命名后）；后端 `LeaveTypeController`
- **步骤**
  1. 假期类型列表：名称、配额天数、是否扣款、扣款比例、扣款基准，支持 CRUD
  2. 后端接口：`GET/POST/PUT/DELETE /config/leave-types`（确认是否已存在，不存在则实现）
  3. ROLE_MENUS.hr 已有入口（B-P2-01 确认）；`auth.global.ts` 添加 `/leave_types: ['hr']`
  4. 请假申请假种下拉改为从此接口动态加载（B-P1-02 已修复种子数据）
- **验收点**：HR 可新增"调休假"并设置配额 3 天；员工请假下拉可选到"调休假"
- **验收流程**：hr.demo 登录创建假期类型 → employee.demo 提交请假时可选到新类型
- **状态**：`[?]`（审计 PASS；等待浏览器验收）

#### B-FEAT-02 数据导出页面 /data_export（CEO）
- **目标**：整页实现：选时间范围 → 触发导出 → 下载 .obk 文件（DESIGN.md §10.2）
- **范围**：`app/h5/pages/data_export/index.vue`；后端导出接口
- **步骤**
  1. 页面实现：日期范围选择器 + 导出按钮
  2. 调用后端 `POST /data/export` 接口（确认接口是否存在）
  3. 浏览器触发文件下载，格式为 `.obk`
- **验收点**：CEO 可选时间范围并下载 .obk 文件
- **验收流程**：ceo.demo 操作浏览器验收
- **状态**：`[?]`（代码验证完整；审计 PASS；等待浏览器验收）

#### B-FEAT-03 历史数据查看器 /data_viewer（CEO）
- **目标**：拖拽/选择 .obk 文件 → 只读方式展示历史数据（DESIGN.md §10.3）
- **范围**：`app/h5/pages/data_viewer/index.vue`
- **步骤**
  1. 文件选择 / 拖拽上传 .obk 文件
  2. 解析文件内容并以只读表格展示
  3. 页面提示修正为 ".obk"（B-P3-04 已记录）
- **验收点**：CEO 上传 .obk 文件后以只读视图展示历史记录
- **验收流程**：ceo.demo 操作浏览器验收
- **状态**：`[?]`（代码验证完整；审计 PASS；等待浏览器验收）

#### B-FEAT-04 员工表单字段补全
- **目标**：员工创建/编辑缺少多个必要字段
- **范围**：`app/h5/pages/employees/index.vue`；`EmployeeController`
- **步骤**
  1. 新增**性别**必填单选（男/女）
  2. 新增**部门/岗位/等级**三级联动下拉（部门列表 → 该部门岗位 → 该岗位等级）
  3. 新增**直系领导**可搜索下拉（按部门经理/项目经理过滤，可手动覆盖）
  4. 新增**身份证号**、**出生日期**（选填）
  5. 主角色改为从 `/roles` 动态加载的下拉菜单
- **验收点**：HR 新建员工时可选部门并联动岗位/等级；性别必填；保存后详情显示所有字段
- **验收流程**：hr.demo 完整创建员工，检查所有字段
- **状态**：`[?]`（三级联动、直系领导搜索、出生日期选择器、角色动态加载已补全；审计 PASS；等待浏览器验收）

#### B-FEAT-05 组织架构拖拽汇报关系配置
- **目标**：当前仅为部门 CRUD 树，设计要求双面板拖拽汇报关系树（DESIGN.md §3.5）
- **范围**：`app/h5/pages/org/index.vue`；`OrgController`
- **步骤**
  1. 实现左侧备选节点区 + 右侧汇报关系树
  2. 支持拖拽配置上下级关系
  3. 后端接口：`GET/PUT /org/tree`
  4. CEO 固定顶层不可移动；后端校验循环汇报
- **验收点**：HR 可将员工节点拖入汇报树，保存后员工直系领导自动更新
- **验收流程**：hr.demo 操作拖拽，切换 employee 账号确认汇报关系变更
- **状态**：`[?]`（代码验证完整；循环检测/CEO固定/双面板均已实现；审计 PASS；等待浏览器验收）

#### B-FEAT-06 请假申请表单字段补全
- **目标**：请假表单缺少时长展示、附件上传、追溯申请复选框
- **范围**：`app/h5/pages/attendance/index.vue`（leave Tab）
- **步骤**
  1. 请假时长只读展示（按开始/结束日期自动计算，§7.2）
  2. 附件文件上传（选填，病假单证明材料）
  3. 追溯申请复选框（§7.2，住院等紧急情况补录）
- **验收点**：选择日期后时长自动计算；可上传附件；追溯申请勾选后可提交
- **验收流程**：employee.demo 操作浏览器验收
- **状态**：`[?]`（代码验证完整；审计 PASS；等待浏览器验收）

#### B-FEAT-07 加班申报表单字段补全
- **目标**：加班表单缺少时长展示和附件上传
- **范围**：`app/h5/pages/attendance/index.vue`（overtime Tab）
- **步骤**
  1. 加班时长只读展示（自动计算，§7.3）
  2. 附件文件上传（选填）
- **验收点**：选择开始/结束时间后加班时长自动显示
- **验收流程**：employee.demo 操作浏览器验收
- **状态**：`[?]`（代码验证完整；审计 PASS；等待浏览器验收）

#### B-FEAT-08 考勤页 isPmOrCeo 逻辑修复
- **目标**：`department_manager` 应可录入团队加班通知，当前被排除
- **范围**：`app/h5/pages/attendance/index.vue:407`
- **步骤**
  1. `isPmOrCeo` 条件追加 `role === 'department_manager'`
  2. 同步修复 Tab 显示条件和发起通知接口调用权限
- **验收点**：dept_manager 登录可见"发起通知"和"已发起"Tab
- **验收流程**：dept_manager.demo 操作浏览器验收
- **状态**：`[?]`（代码验证已正确，等待浏览器验收）

#### B-FEAT-09 报销申请表单字段补全
- **目标**：报销表单缺少发票上传（必填）和关联项目下拉
- **范围**：`app/h5/pages/expense/apply/index.vue`
- **步骤**
  1. 发票文件上传（DESIGN.md §9.2 明确为**必填**），不上传无法提交
  2. 关联项目下拉（从本人参与项目列表选择）
  3. 单条明细行添加附件上传组件
- **验收点**：不上传发票无法提交；可选关联项目；提交后项目成本视图出现此报销记录
- **验收流程**：employee.demo 操作浏览器验收
- **状态**：`[?]`（明细行附件上传已补全；审计 PASS；等待浏览器验收）

#### B-FEAT-10 工伤申报表单字段补全
- **目标**：工伤表单缺少三个独立字段，财务理赔需从下拉选单
- **范围**：`app/h5/pages/injury/index.vue`
- **步骤**
  1. 新增**受伤时间**时间选择器（§7.4 必填）
  2. 新增**医生诊断结果**独立多行文本字段（§7.4 必填）
  3. 新增**事故经过**独立多行文本字段（§7.4 必填，与"伤情描述"分开）
  4. 财务录入理赔：formRecordId 和 employeeId 改为从已通过申报单列表下拉选择
- **验收点**：三个独立字段均可填写；财务录入理赔可从下拉选择已通过的申报单
- **验收流程**：worker.demo 提交工伤申报 → finance.demo 录入理赔浏览器验收
- **状态**：`[?]`（代码验证完整；审计 PASS；等待浏览器验收）

#### B-FEAT-11 项目基本信息字段补全
- **目标**：项目详情缺少合同编号、合同附件、客户名称、项目说明等字段
- **范围**：`app/h5/pages/projects/[id].vue`（info Tab）
- **步骤**
  1. 添加合同编号、合同附件（上传）、客户名称、项目说明的展示与编辑
  2. 成员添加改为员工搜索下拉（按姓名/工号），不再用数字 ID 输入框
- **验收点**：PM 创建项目时可填客户名称和合同编号；项目详情可查看所有字段
- **验收流程**：pm.demo 操作浏览器验收
- **状态**：`[?]`（合同附件上传、成员搜索下拉已补全；审计 PASS；等待浏览器验收）

#### B-FEAT-12 施工日志 PM 审批流程
- **目标**：`/construction_log/index.vue` 审批按钮缺失（line 28-30 有 TODO 注释）
- **范围**：`app/h5/pages/construction_log/index.vue`；`app/h5/pages/projects/[id].vue`（logs Tab）
- **步骤**
  1. 确认 `/projects/[id].vue` "施工日志审批"Tab 中 approve/reject 功能是否完整
  2. 若缺失：工长日志列表 + 通过/驳回按钮 + 驳回原因填写弹窗
- **验收点**：PM 在项目详情"施工日志审批"Tab 中可看到待审核日志并完成通过/驳回操作
- **验收流程**：pm.demo 操作浏览器验收
- **状态**：`[?]`（代码验证完整；审计 PASS；等待浏览器验收）

#### B-FEAT-13 /config 企业名称编辑
- **目标**：系统配置页补全企业名称编辑 Card
- **范围**：`app/h5/pages/config/index.vue`；`SystemConfigController`（key=company_name）
- **步骤**
  1. 新增 Card "企业信息"：企业名称文本输入 + 保存按钮
  2. 保存后 `app.vue` 动态标题同步更新
- **验收点**：CEO 修改企业名后，浏览器标签页标题变为"{新企业名}OA管理系统"
- **验收流程**：ceo.demo 修改企业名，观察标题变化
- **状态**：`[?]`（代码验证已正确，等待浏览器验收）

#### B-FEAT-14 /config 薪资周期配置
- **目标**：补全发薪日和结算截止日配置（DESIGN.md §5.0.5）
- **范围**：`app/h5/pages/config/index.vue`；`GET/PUT /config/payroll-cycle`
- **步骤**
  1. 新增配置项：发薪日（默认 15 日，遇节假日提前/顺延选项）
  2. 结算截止日（发薪日前 N 天）
- **验收点**：CEO 修改发薪日为 20 日并保存，薪资周期创建时默认使用新发薪日
- **验收流程**：ceo.demo 操作浏览器验收
- **状态**：`[?]`（代码验证已正确，等待浏览器验收）

#### B-FEAT-15 /config 数据保留期配置
- **目标**：补全全局数据保留期下拉配置
- **范围**：`app/h5/pages/config/index.vue`；`GET/PUT /config/retention-period`
- **步骤**：新增配置项：全局数据保留期（1年/2年/3年/5年，默认3年）
- **验收点**：CEO 修改保留期后，retention 页展示新值
- **验收流程**：ceo.demo 操作浏览器验收
- **状态**：`[?]`（代码验证已正确，等待浏览器验收）

#### B-FEAT-16 /config 审批流 EXPENSE 类型
- **目标**：审批流配置缺少报销申请类型
- **范围**：`app/h5/pages/config/index.vue:207`（BUSINESS_TYPE_LABELS）；`approval_flow` 表种子数据
- **步骤**
  1. `BUSINESS_TYPE_LABELS` 追加 `EXPENSE: '报销申请'`
  2. 确认 `approval_flow` 表有 EXPENSE 类型记录，无则补充种子数据
- **验收点**：CEO 在审批流配置中可看到"报销申请"审批流并可编辑节点
- **验收流程**：ceo.demo 操作浏览器验收
- **状态**：`[?]`（data.sql 追加 EXPENSE 审批流；BUSINESS_TYPE_LABELS 已有；审计 PASS；等待浏览器验收）

#### B-FEAT-17 Layout 待办数量统计修复
- **目标**：todo 角标仅对部分角色生效，应对所有角色生效
- **范围**：`app/h5/layouts/default.vue:244`
- **步骤**
  1. 所有角色均调用 `/forms/todo` 获取自身待办数
  2. todo 角标对 finance/hr/dept_manager/employee/worker 均生效
- **验收点**：dept_manager 账号顶部待办角标显示待审批考勤数；finance 显示待审批报销数
- **验收流程**：各角色浏览器验收
- **状态**：`[?]`（代码验证已正确，onMounted 无角色过滤；等待浏览器验收）

#### B-FEAT-18 财务菜单路由补全
- **目标**：Finance 角色菜单入口需覆盖 DESIGN.md §5.4 所有功能
- **范围**：`app/h5/layouts/default.vue` ROLE_MENUS.finance；`app/h5/middleware/auth.global.ts`
- **步骤**
  1. 确认 finance 菜单含：薪资管理、岗位薪资配置、社保配置、项目成本、营收管理、报销审批
  2. 若部分为 `/payroll` 子 Tab，添加锚点路径入口
  3. **注意（B-P0 审计发现）**：`default.vue` finance 菜单包含 `/positions`，但 `auth.global.ts` 第 18 行 `/positions: ['ceo', 'hr']` 不包含 `finance`，导致 finance 侧边栏有死链入口。本任务实施时须同步修复：要么将 `/positions` 路由守卫追加 `finance`（推荐），要么从 finance 菜单移除该入口
- **验收点**：finance 账号侧边栏可进入岗位薪资配置并修改等级薪资；`/positions` 入口无死链
- **验收流程**：finance.demo 操作浏览器验收
- **状态**：`[?]`（auth.global.ts `/positions` 追加 finance；后端移除 PROJECT_MANAGER；审计 PASS；等待浏览器验收）

#### B-FEAT-19 运维角色基础支持
- **目标**：ops 角色登录后不显示空白工作台（DESIGN.md §5.9）
- **范围**：`app/h5/layouts/default.vue` ROLE_MENUS；`app/h5/middleware/auth.global.ts`
- **步骤**
  1. ROLE_MENUS 添加 `ops` 角色菜单（工作台 + 操作日志）
  2. 对应路由添加 `ops` 权限
- **验收点**：ops.demo 账号登录后工作台不报错，可进入操作日志页
- **验收流程**：ops.demo 登录浏览器验收
- **状态**：`[?]`（代码验证已正确：ROLE_MENUS.ops 存在，/operation_logs 含 ops；等待浏览器验收）

#### B-FEAT-20 侧边栏 Logo 动态读取企业名
- **目标**：Logo 当前硬编码"众维OA工作台"，应动态读取 company_name
- **范围**：`app/h5/layouts/default.vue:8`
- **步骤**：与 `app.vue` 动态标题使用同一 company_name 数据源
- **验收点**：初始化时企业名"博渊"，侧边栏 Logo 显示"博渊OA"
- **验收流程**：任意账号登录浏览器验收
- **状态**：`[?]`（代码验证已正确：第8行使用 companyName 动态渲染；等待浏览器验收）

---

### B-INFRA — 开发基础设施

#### B-INFRA-01 dev 环境改用 Flyway 单一初始化路径
- **目标**：当前 dev 用 `schema.sql + data.sql` 初始化，prod 用 Flyway，两路径长期维护成本高且存在漂移风险（A-DB-01 已发生 V11/V12/V13 漏同步）
- **范围**：`server/src/main/resources/`（`schema.sql`、`data.sql`、`application.yml`、Flyway V*.sql）；`.github/workflows/ci.yml`
- **前置条件**：V2__init_data.sql 中的 `MERGE INTO` 语法与 H2 2.2.224 不兼容（H2 不支持 `MERGE INTO ... WHEN NOT MATCHED`），须先将 V2 的幂等写法改为 H2 兼容语法，或改用 `INSERT INTO ... ON CONFLICT DO NOTHING`（H2 支持）
- **步骤**
  1. 将 V2__init_data.sql 的 `MERGE INTO` 改为 H2 兼容写法（`INSERT INTO ... WHERE NOT EXISTS`）
  2. `application.yml` 中 `spring.sql.init` 配置改为仅在 prod profile 启用（或整体删除），dev 通过 Flyway 初始化
  3. `application-dev.yml` 追加 Flyway 配置（`spring.flyway.enabled: true`，H2 方言兼容）
  4. 删除 `schema.sql` 和 `data.sql`（或保留为参考副本，gitignore 防止 CI 加载）
  5. 本地启动后端，确认 H2 控制台可查到 Flyway 建的所有表和种子数据
  6. `mvn test` 全量通过（392 tests）
- **验收点**：`schema.sql` 不再参与 dev 初始化；H2 dev 环境通过 Flyway 完成全量迁移；`mvn test` 通过
- **验收流程**：启动后端查看 Flyway 日志确认 V1~Vxx 全部 applied；curl `/api/auth/login` 返回 200
- **注意**：若 V2 语法改造工作量过大，可接受方案 B：保留 `data.sql` 仅做种子数据，`schema.sql` 替换为空文件（让 Flyway 建表），dev 也走 Flyway；C-INT-09 的 CI migration-validate job 已作为短期安全网
- **状态**：`[ ]`

---

### B-VAL — 待浏览器验收（代码已有，无已知 gap）

以下页面代码已存在，目前未发现实现缺口，B 阶段统一走查。

- `[?]` 个人信息页 `/me` — 展示姓名/角色/手机号/部门
- `[?]` 修改密码页 `/me/password` — 旧密码验证 + 新密码确认
- `[?]` 表单中心 `/forms` — 我的提交记录 + 审批历史
- `[?]` 通讯录导入 `/directory` — CSV 预览 → 导入
- `[?]` 岗位管理 `/positions` — 岗位 + 等级 CRUD
- `[?]` 角色管理 `/role` — 内置角色 + 自定义角色 + 权限矩阵
- `[?]` 操作日志 `/operation_logs` — 分页查看 + 时间范围筛选
- `[?]` 补贴配置 `/allowances` — 三级补贴定义与配置
- `[?]` 工作台首次登录密码提醒 — isDefaultPassword 横幅
- `[?]` 工作台活跃项目卡片可点击跳转
- `[?]` 考勤驳回后重新发起 — REJECTED 记录显示驳回原因 + 重新发起按钮
- `[?]` 施工日志模板 `/construction_log/templates` — 工作项模板 CRUD
- `[?]` 通知中心 `/notifications` — 分类 Tab + 标记已读
- `[?]` 数据保留 `/retention` — 保留期配置与清理预览

---

## Phase C — 测试覆盖

> **前置条件**：Phase B 全部 `[x]`（P0/P1 全通过，P2/P3 全通过，所有 FEAT `[x]`）。
> **目标**：编写并执行全部自动化测试；Claude 自执行黑盒测试；测试文档修复。
> **完成标准**：`yarn test:integration` 全通过；`yarn playwright test` 全通过；MB-01~MB-10 黑盒用例全部 Pass。

---

### C-DOC — 测试文档修复（先于测试编写执行）

- `[ ]` **C-DOC-01 测试主文档单一职责修复**
  - `test/TEST_DESIGN.md` §4 内联 35+ 条 API 集成测试规格，与"策略层文档"定位矛盾
  - 新建 `test/integration/TEST_DESIGN.md`，将 §4 全部用例迁移；主文档 §4 保留摘要和链接
  - 验收：`test/TEST_DESIGN.md §4` 无内联用例表；链接可跳转到完整规格文件

- `[ ]` **C-DOC-02 文档交叉引用改为 Markdown 超链接**
  - 受影响：`test/TEST_DESIGN.md`、`test/e2e/TEST_DESIGN.md`、`test/TEST_COVERAGE_GAPS.md`
  - 所有反引号路径引用替换为 `[文件名](相对路径)` 可点击链接
  - 验收：GitHub 预览中所有交叉引用均可点击跳转

---

### C-INT — API 集成测试

- `[ ]` **C-INT-01 假期类型 API**（`test/integration/api.test.ts` 扩展）
  - `GET /config/leave-types` → 200，数组非空
  - `POST /config/leave-types`（HR token）→ 201；（worker token）→ 403
  - `DELETE /config/leave-types/{id}`（HR token）→ 200
  - 验收：三条用例全通过，权限控制正确

- `[ ]` **C-INT-02 考勤/请假 API**
  - `POST /attendance/leave`（employee token，有效数据）→ 200，返回 formId
  - `POST /attendance/leave`（缺必填字段 leaveType）→ 400
  - `GET /attendance/records`（employee token）→ 200，仅含本人记录
  - `GET /attendance/records`（CEO token）→ 200，含全员记录
  - 验收：数据隔离验证

- `[ ]` **C-INT-03 报销 API**
  - `GET /expense/types` → 200 非空
  - `POST /expense`（employee token）→ 201
  - `GET /expense/records`（employee）→ 200 仅本人；（finance）→ 200 全员
  - `POST /expense/{id}/approve`（finance）→ 200；（employee）→ 403
  - 验收：审批权限双层验证

- `[ ]` **C-INT-04 工伤 API**
  - `POST /injury`（worker token，含必填字段）→ 200
  - `GET /injury`（finance token）→ 200
  - `PUT /injury/{id}/compensation`（finance）→ 200；（worker）→ 403
  - 验收：理赔仅财务可录入

- `[ ]` **C-INT-05 系统配置 API**（CEO 专属）
  - `GET/PUT /config/company-name`（CEO）→ 200；（HR）→ 403
  - `GET/PUT /config/payroll-cycle`（CEO）→ 200
  - `GET /config/retention-period`（CEO）→ 200
  - 验收：6 条用例全通过，配置读写权限隔离

- `[ ]` **C-INT-06 权限越权直调（≥15 条）**
  - employee → `GET /employees` → 403
  - worker → `GET /payroll/cycles` → 403
  - employee → `GET /operation-logs` → 403
  - employee → `DELETE /employees/1` → 403
  - worker → `POST /payroll/cycles` → 403
  - hr → `PUT /config/payroll-cycle` → 403
  - finance → `GET /config/company-name` → 403
  - worker → `GET /expense/records` → 403
  - worker → `POST /injury/{id}/compensation` → 403
  - （补足至 ≥15 条，覆盖所有高敏感接口）
  - 验收：每个接口独立验证后端权限，不依赖前端路由守卫

- `[ ]` **C-INT-07 密码变更 API**
  - 正确旧密码，新密码≥8位 → 200
  - 错误旧密码 → 400
  - 新密码5位 → 400
  - 验收：BUG-B-P3-08 修复回归测试

- `[ ]` **C-INT-08 薪资结算链路 API**
  - `POST /payroll/cycles`（finance）→ 201，status=OPEN
  - `PUT /payroll/cycles/{id}/settle`（finance）→ 200，status=SETTLED
  - `GET /payroll/slips?cycleId={id}`（employee 本人）→ 200，仅本人工资条
  - `POST /payroll/slips/{id}/confirm`（employee）→ 200
  - 验收：薪资发放主链 API 层验证

- `[ ]` **C-INT-09 测试运行基础设施补全**
  - 前置条件：A-CLEAN-06 完成（vitest 配置整理）
  - 步骤1 — 根 `package.json` 补充 scripts：
    - `"test:unit:h5": "yarn workspace oa-h5 test"`
    - `"test:unit:mp": "yarn workspace oa-mp test"`
    - `"test:integration": "cd app && npx vitest run --config mp/vitest.integration.config.ts"`
  - 步骤2 — 本地验证：`yarn test:integration` 可执行且有测试输出
  - 步骤3 — CI `.github/workflows/ci.yml` 补充 `integration-test` job：
    - 启动后端服务（`mvn spring-boot:run`，dev profile）
    - 等待后端就绪（`wait-on http://localhost:8080/api/health`）
    - 执行 `yarn test:integration`
  - 步骤4 — CI 补充 shared 单元测试：确认 `frontend-mp-test`（Phase F 恢复后）已包含 shared 测试（mp vitest config 包含 shared 路径，无需独立 job）
  - 步骤5 — 确认 `frontend-h5-test` job 上传 coverage 报告到 Artifacts
  - 验收：`yarn test:integration` 本地可执行；CI `integration-test` job 绿

---

### C-E2E — E2E 自动化测试

- `[ ]` **C-E2E-01 请假审批完整流程**（`test/e2e/leave_flow.js`）
  - employee 提交请假 → dept_manager 审批通过 → employee 确认状态
  - 三断言：提交后"审批中"、dept_manager 待办列表出现、审批后"已通过"
  - 验收：Claude 检查断言质量（不接受空洞断言）

- `[ ]` **C-E2E-02 报销审批完整流程**（`test/e2e/expense_flow.js`）
  - employee 提交报销（含发票上传 + 关联项目）→ finance 审批通过
  - 三断言：不上传发票拦截、finance 可见记录、审批后状态更新

- `[ ]` **C-E2E-03 加班申报审批流程**（`test/e2e/overtime_flow.js`）
  - employee 提交加班（时长字段自动计算）→ dept_manager 审批通过
  - 二断言：时长自动计算非空、审批后状态"已通过"

- `[ ]` **C-E2E-04 申请驳回后重新提交**（`test/e2e/rejection_resubmit.js`）
  - employee 提交请假 → dept_manager 驳回（原因"时间冲突"）→ employee 重新发起
  - 二断言：驳回原因文本可读、重新发起后新记录（ID 不同）

- `[ ]` **C-E2E-05 施工日志提交和 PM 审批**（`test/e2e/construction_log_flow.js`）
  - worker 提交施工日志 → pm 在项目详情审批通过
  - 三断言：worker 日志状态"待审核"、pm 可见该日志、审批后状态更新

- `[ ]` **C-E2E-06 薪资周期完整流程**（`test/e2e/payroll_cycle_flow.js`）
  - finance 创建周期 → 结算 → employee 查看工资单并确认签收
  - 含工资单金额 > 0 断言

- `[ ]` **C-E2E-07 员工管理 CRUD**（`test/e2e/employee_crud.js`）
  - 创建（含所有必填字段）→ 修改部门 → 停用
  - 停用后真实登录尝试被拒绝（不接受仅检查状态标签文字）

- `[ ]` **C-E2E-08 岗位与薪级 CRUD**（`test/e2e/position_crud.js`）
  - 创建岗位 + 等级 → 删除有在职员工的岗位 → 拦截提示
  - 约束删除场景断言验证提示文本

- `[ ]` **C-E2E-09 假期类型 CRUD**（`test/e2e/leave_type_crud.js`）
  - HR 创建"调休假" → employee 请假下拉可选到"调休假"
  - 验证前后端联动

- `[ ]` **C-E2E-10 项目与里程碑 CRUD**（`test/e2e/project_crud.js`）
  - 创建项目（含客户名称/合同编号/合同附件）→ 添加里程碑 → 修改进度
  - 合同附件验证服务端存储成功（详情页可访问）

- `[ ]` **C-E2E-11 报销发票上传边界**（`test/e2e/expense_upload.js`）
  - 场景A：不上传直接提交 → Toast 含"请上传"
  - 场景B：有效 JPG 上传 → 提交后详情页附件可访问（非仅前端预览）
  - 场景C：上传超量（若有限制）→ 拦截提示

- `[ ]` **C-E2E-12 表单日期边界**（`test/e2e/date_boundaries.js`）
  - 结束日早于开始日 → 校验提示
  - Toast 不暴露 HTTP 错误字符串

- `[ ]` **C-E2E-13 数字计算与零值校验**（`test/e2e/calculation_accuracy.js`）
  - 三行明细 100+200+300 → 总金额 600
  - 零金额/负数 → 拦截提示

- `[ ]` **C-E2E-14 密码修改错误提示回归**（`test/e2e/password_error_toast.js`）
  - 错误当前密码 → Toast 为业务语言，不含 HTTP 格式字符串

---

### C-BLK — 黑盒测试用例设计

- `[ ]` **C-BLK-01 新建 `test/manual/TEST_CASES.md`**
  - MB-01 请假申请完整审批流（employee + dept_manager）
  - MB-02 报销审批（含发票上传必填拦截）（employee + finance）
  - MB-03 工伤申报及财务理赔录入（worker + finance）
  - MB-04 薪资周期全流程（创建→结算→员工签收）（finance + employee）
  - MB-05 HR 新增员工 → 员工首次登录改密（hr + 新员工）
  - MB-06 PM 项目管理与施工日志审批（pm + worker）
  - MB-07 CEO 修改企业名 → 标题与侧边栏同步（ceo）
  - MB-08 CEO 数据导出 → 数据查看器上传查看（ceo）
  - MB-09 初始化向导完整 5 步（全新系统状态）
  - MB-10 申请驳回 → 查看驳回原因 → 重新提交（employee + dept_manager）
  - 格式：每条含用例 ID、前置条件、测试账号、分步操作（每步含具体操作和期望 UI 响应）、通过/失败记录栏
  - 验收：Claude review 确认每条用例步骤完整、断言可操作、覆盖 DESIGN.md 对应章节

---

### C-AUTO — Claude 自执行黑盒自动化验证

- `[ ]` **C-AUTO-01 Claude 操控浏览器执行 MB-01~MB-10**
  - 前置：后端和前端服务均运行中；Phase B 全部 `[x]`；C-BLK-01 设计文档已完成
  - 按 `test/manual/TEST_CASES.md` 逐条执行，截图关键步骤
  - 发现新缺陷立即追加至 Phase B 对应优先级
  - 全部通过后将结果写入 `test/manual/TEST_CASES.md` 实际结果栏
  - 验收：10 条用例实际结果栏全部为"通过"，无遗留"失败"或"阻塞"

---

## Phase D — 人工验收

> **前置条件**：Phase C 全部 `[x]`（所有自动化测试通过，Claude 黑盒测试通过）。
> **目标**：用户在真实浏览器完成完整业务链路验收，Claude 跟进修复问题。

---

- `[ ]` **D-RUN — 7 角色完整浏览器走查**
  - 按以下每角色清单逐一验收，截图关键步骤
  - **CEO**：全菜单无死链；/config 可编辑企业名/发薪日/假期配额；/positions /role /operation_logs 正常使用；工作台待办角标显示真实数值
  - **HR**：/employees 可创建含部门/岗位/等级/直系领导的员工；/org 可配置汇报关系；/leave_types 可管理假期类型
  - **Finance**：岗位薪资配置和社保配置可访问；/payroll 可走"创建周期→结算→发放"全流程；/expense 报销审批可操作
  - **PM**：/projects/[id] 六个 Tab 均可打开并操作；待办中心考勤审批可通过/驳回
  - **Employee**：/attendance 请假附件可上传，时长自动计算；/payroll 可查看并确认工资条；/expense 可提交含发票的报销
  - **Worker**：/attendance 可提交请假申请；/injury 三字段表单可提交；/construction_log 可填施工日志
  - **DeptManager**：顶部待办角标显示待审批数；/attendance 可发起加班通知；待办中心可操作

- `[ ]` **D-FIX — 验收问题修复循环**
  - 发现问题立即记录到 Phase B 对应优先级（P0/P1/P2/P3）并修复
  - 修复后 Claude 重新执行对应场景的自动化验证

- `[ ]` **D-SIGN — 人工验收签收**
  - 用户确认所有核心业务链路可用，签收 Phase D

---

## Phase E — 生产部署 + 工程规范

> **前置条件**：Phase D 全部 `[x]`。
> **目标**：首版上线 + 建立全套工程规范。规范从这里起建立，后续所有维护遵循这套规范。

---

### E-STD — 工程规范建立

#### E-STD-01 Git 提交规范与分支策略
- **目标**：团队所有成员统一 git 工作流
- **步骤**
  1. 在 `.github/CONTRIBUTING.md` 中定义：
     - Commit 格式：`type(scope): description`（Conventional Commits）
     - type 枚举：feat/fix/refactor/perf/test/docs/style/chore/cleanup
     - 分支策略：`main`（生产）、`develop`（集成）、`feature/*`（功能）、`hotfix/*`（紧急修复）
     - 版本发布：只在 `main` 打 tag，格式 `vMAJOR.MINOR.PATCH`
  2. 配置 `.commitlintrc.json` 或 `commitlint.config.js`，CI 强制校验 commit message 格式
- **验收点**：不符合格式的 commit message 在 CI 中失败
- **验收流程**：尝试 push 一个格式错误的 commit，CI 报错
- **状态**：`[ ]`

#### E-STD-02 PR 模板 + 代码审查 Checklist
- **目标**：标准化 PR 提交和审查流程
- **步骤**
  1. 新建 `.github/pull_request_template.md`，包含：
     - 变更类型（feat/fix/refactor/...）
     - 变更概述
     - 测试情况（自动化测试命令 + 是否通过）
     - 审查 Checklist（权限、路由守卫、菜单入口、种子数据、字段完整性）
     - 截图（UI 变更必须附截图）
  2. 新建 `.github/CODE_REVIEW_CHECKLIST.md`：5 个横切验证维度（后端权限/路由守卫/菜单入口/运行时数据/字段完整性）+ 安全规范要点
- **验收点**：PR 提交时自动填充模板；审查 Checklist 可操作
- **验收流程**：新建一个测试 PR，确认模板自动出现
- **状态**：`[ ]`

#### E-STD-03 Issue 模板
- **目标**：Bug 报告和功能请求有统一格式
- **步骤**
  1. 新建 `.github/ISSUE_TEMPLATE/bug_report.md`：复现步骤、期望行为、实际行为、环境信息、截图
  2. 新建 `.github/ISSUE_TEMPLATE/feature_request.md`：功能描述、用户场景、设计稿链接、验收标准
- **验收点**：新建 Issue 时出现类型选择界面
- **验收流程**：GitHub 新建 Issue 验证
- **状态**：`[ ]`

#### E-STD-04 SemVer + CHANGELOG
- **目标**：版本号管理与发布记录规范化
- **步骤**
  1. 在 `package.json`（前端）和 `pom.xml`（后端）中定义初始版本 `1.0.0`
  2. 新建 `CHANGELOG.md`（根目录），记录 v1.0.0 包含的所有功能模块
  3. 后续每次发布遵循：MAJOR（破坏性变更）/ MINOR（新功能）/ PATCH（Bug 修复）
  4. CI：push tag `v*` 时自动触发发布 workflow（构建 + 上传 artifacts）
- **验收点**：`CHANGELOG.md` 存在且 v1.0.0 条目完整；tag `v1.0.0` 触发 CI 发布流程
- **验收流程**：打 tag 后查看 CI Actions
- **状态**：`[ ]`

#### E-STD-05 RUNBOOK（操作手册）
- **目标**：生产环境操作步骤文档化，任何人可独立执行
- **步骤**
  1. 新建 `docs/RUNBOOK.md`，包含：
     - 部署流程（步骤 + 命令）
     - 回滚流程（前端/后端各自回滚步骤）
     - 常见故障排查（服务不启动、数据库连接失败、JWT 失效）
     - 数据库备份与恢复操作
     - 日志查看命令
     - 监控/健康检查接口（`/actuator/health`）
  2. RUNBOOK 中的所有命令必须在本地验证可执行
- **验收点**：`docs/RUNBOOK.md` 存在；新人按 RUNBOOK 可独立完成部署
- **验收流程**：Claude 按 RUNBOOK 步骤执行一次完整部署流程
- **状态**：`[ ]`

---

### E-CICD — CI/CD 完善

- `[ ]` **E-CICD-01 CI commitlint 检查**
  - `.github/workflows/ci.yml` 添加 `commitlint` job
  - PR 提交时自动校验 commit message 格式

- `[ ]` **E-CICD-02 CI 发布 workflow**
  - `.github/workflows/release.yml`：tag `v*` 触发
  - 步骤：build backend JAR → build frontend static → create GitHub Release → upload artifacts

---

### E-DEPLOY — 生产部署

- `[ ]` **E-DEPLOY-01 服务器环境准备**
  - 选定云主机方案（Ubuntu 22.04 推荐）
  - 配置域名 + HTTPS 证书（Let's Encrypt）
  - 配置生产环境变量：DB_URL / DB_USERNAME / DB_PASSWORD / JWT_SECRET / APP_SIGNATURE_AES_KEY

- `[ ]` **E-DEPLOY-02 数据库迁移验证**
  - PostgreSQL 启动，`-Dspring.profiles.active=prod` 下 Flyway V1–V14 迁移无报错
  - 种子账号（ceo.demo/123456）可登录

- `[ ]` **E-DEPLOY-03 Docker 构建与部署**
  - `docker build -t boyuan-oa .` 成功
  - `/actuator/health` 返回 `{"status":"UP"}`
  - H5 前端静态文件通过 Nginx 托管，`/api/` 代理到后端

- `[ ]` **E-DEPLOY-04 版本号注入验证**
  - git tag → JAR manifest + 前端 `VITE_APP_VERSION` 正确注入

- `[ ]` **E-DEPLOY-05 生产环境 7 角色全菜单走查**
  - 在真实服务器重跑 Phase D 验收清单
  - 全部通过后 v1.0.0 正式上线

---

## Phase F — 微信小程序

> **前置条件**：Phase E 全部 `[x]`（v1.0.0 已在生产环境运行稳定）。

---

### F-PREP — 前置清理

- `[ ]` **F-PREP-01** 清理 `app/mp/src/pages.json`：仅保留 6 个入口（登录、工作台、待办、考勤、项目、忘记密码）
- `[ ]` **F-PREP-02** 恢复 CI `frontend-mp-test` job（A-OPS-02 中已跳过，Phase F 启动时恢复）

---

### F-CORE — 核心页面实现

- `[ ]` **F-CORE-01 登录页**：手机号/密码登录，token 写入 uni storage
- `[ ]` **F-CORE-02 工作台**：动态菜单卡片（按角色），未读待办徽章
- `[ ]` **F-CORE-03 待办页**：待审批列表，支持通过/驳回操作
- `[ ]` **F-CORE-04 考勤页**：请假/加班申请入口，本月记录展示
- `[ ]` **F-CORE-05 项目页**：项目列表，PM 查成员，劳工填施工日志
- `[ ]` **F-CORE-06 忘记密码**：完整 4 步流程

---

### F-TEST — 小程序测试

- `[ ]` **F-TEST-01 TC-MP-01**：各角色登录后菜单与权限一致
- `[ ]` **F-TEST-02 TC-MP-02**：提交请假后审批人待办出现，操作后状态同步
- `[ ]` **F-TEST-03 TC-MP-03**：施工日志（worker）可提交

---

## Phase G — 运维维护

> **前置条件**：Phase E 完成，生产环境运行中。
> **说明**：运维操作规范已在 Phase E（E-STD-05 RUNBOOK）建立，本阶段为日常维护执行层。

---

- `[ ]` **G-ONCALL-01 建立 on-call 值班制度**
  - 参照 `docs/RUNBOOK.md` 中故障排查章节
  - 定义值班轮换表、响应 SLA（P0：15 分钟内，P1：2 小时内，P2：次日）
  - 配置监控告警（服务宕机、响应时间 > 3s、数据库连接异常）

- `[ ]` **G-ONCALL-02 定期维护执行**
  - 每月执行：`npm audit`（前端依赖安全检查）、`./mvnw dependency:check`（后端依赖）
  - 每季度：数据备份演练（按 RUNBOOK §备份恢复章节执行）
  - 每半年：非功能性性能压测（`ab` 或 `k6`），确认关键接口 P95 < 500ms

---

## 完成历史（已完成模块）

M0 基础设施 / M1 身份认证 / M2 组织管理 / M3 审批流引擎 / M4 考勤模块 / M5 薪资模块（含签名/PDF/社保分叉） / V5 薪资构成扩展 / V6 薪资更正流程 / V7–V10 第二角色/售后/物资/营收/保险/施工考勤/审计/部门经理 / M6 项目管理 / M8 施工&工伤 / M9 通知&工作台 / M10 数据生命周期 / M11 CI/CD+部署脚本+Dockerfile / M12 初始化向导 / 动态页面标题 / Dev tools 鉴权修复

**已完成后端接口**：`POST /auth/change-password`、`GET /auth/me`（含isDefaultPassword）、`GET /operation-logs`（分页，CEO专属）、`@OperationLogRecord` 注解接入关键业务方法。
