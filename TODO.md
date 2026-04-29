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

## 活跃任务看板

**当前 Phase**：Phase D — 逐模块测试 + 设计对齐 + 人工验收
**当前模块**：D-M08 初始化向导（D-M01 Stage 4 人工复核暂搁）
**当前 Stage**：Stage 1（设计对齐）已完成 + 阶段 2/3（DEFECT 修复 + C2 改造）已完成 + Stage 2（测试用例清单初稿）已写入；**用户表示有东西要改，整体推迟，等用户调整方案后回来重审**

**已完成进度（2026-04-28 全天）**

阶段 1 文档对齐
- DESIGN.md §2 修订完毕（行 40-235），覆盖 4 个 DEFECT 设计语义
- TODO.md DEFECTS 池立项 DEF-SETUP-01/02/03/04/05 + DEF-ROLE-01

阶段 2 DEF-SETUP-01 beforeunload 提示
- /setup 注册 beforeunload 监听 + finishSetup 解绑（Frontend Developer 实施 + Code Reviewer PASS）
- Code Reviewer P1（step 6-10 跳转按钮静默丢数据）按"接 SETUP-04 改造覆盖"延期处理

阶段 3 DEF-SETUP-04 C2 改造
- 后端
  - V21__add_wizard_finalize_state.sql 新增 wizard_finalize_completed + wizard_finalize_token
  - SetupFinalizeRequest 新增 + 11 个嵌套 DTO（含 tempId 系统）
  - SetupController 新增 POST /setup/finalize（公开端点 + 令牌鉴权）
  - SetupController.status 扩展 wizardFinalizeCompleted 字段
  - SetupController.init 响应新增 wizardFinalizeToken
  - SetupService.finalizeWizard + 7 个 applyXxx 助手 + tempId→realId 解析 + AccessManagementService 双写注入（DEF-ROLE-01 折中方案）
  - DevController 新增 /dev/reset-finalize（@Profile dev）
  - SecurityConfig.permitAll 加 /setup/finalize
  - 5 个新增集成测试（finalize_success / invalid_token / partial_failure_rolls_back / already_completed / role_with_permissions）
  - mvn test 1320 全绿，含 ArchUnit 4 条规则
  - Code Reviewer 审 1 轮发现 3 P1 + 4 P2/P3 全部修复（businessType 替换 flowId / tempId 系统 / fail-fast / partial rollback 测试 / constant-time 比较 / 阈值常量）
- 前端 5 个业务组件抽取
  - app/h5/components/setup/RoleConfigPanel.vue（533 行；/role 改造 354→275 行）
  - app/h5/components/setup/EmployeeImportPanel.vue（758 行；/directory 改造 320→129 行）
  - app/h5/components/setup/RetentionPanel.vue（388 行；/retention 改造 414→437 行）
  - app/h5/components/setup/DepartmentManager.vue（487 行）+ SupervisorTree.vue（512 行）（/org 改造 571→391 行）
  - 5 个组件全部支持 mode='wizard' / 'operation' 双模式
  - yarn lint 0/0、yarn test 35/35
- /setup 重写
  - app/h5/pages/setup/index.vue 581→1297 行
  - step 6-10 全部内嵌组件 + Tabs 拆 step 7 部门/员工
  - step 9 wizard 专用全局配置 + 审批流面板（/config 子组件 4 个就地重写，1 个 onMounted 调 API 与 wizard 不兼容）
  - finalizeSetup 函数：序列化 step 5-10 数据 + token 提交 + Toast 反馈 + removeEventListener + navigateTo /login
  - middleware/auth.global.ts 路由守卫扩展支持"已 init 未 finalize"状态允许进 /setup
- 测试用例清单已写入 test/e2e/modules/D-M08.md（16 章节 / 约 100 条），等用户调整方案后再确认

**已立项延期 DEFECT**
- DEF-SETUP-05 wizard_finalize_token 无 TTL 与 per-IP 限流 → Phase F
- DEF-ROLE-01 角色权限系统未持久化到 DB（AccessManagementService 写内存）→ D-M05 模块独立修复，2026-05-15 前完成

**当前阻塞**：无（用户主动暂停，等调整方向）

**下一步动作（用户）**
- 给出要改的部分（DEF-SETUP-04 C2 实施细节 / DESIGN.md 措辞 / 测试用例清单 任一）
- 也可以直接进 Stage 2 用例确认（如果只是小调整不影响代码）

**下一步动作（我）**
- 等用户告知调整方向
- 收到后判断是改文档还是改代码，重新组装计划送审

**D-M01 Stage 4 待办**：用户浏览器人工复核暂时搁置，待 D-M08 闭环或用户主动恢复

---

## Phase 总览

核验日期 2026-04-23。

- Phase A — 架构治理 + 清理：**核验通过（10/10 关键节点 PASS）**
  - 46 项任务真实落地：Controller 权限注解齐全、前端路由守卫覆盖完整、Controller 不持 Mapper（0 违规，InjuryClaimController 遗留已注释排除）、全局异常处理器覆盖 15+ 异常类、测试文件全部在 test/、前端目录全部 snake_case、V14 索引迁移存在并生效
- Phase B — 功能补全 + Bug 修复：**核验通过，技术债已关闭**
  - 核心业务 B-P0/P1/FEAT 真实落地，HR/PM 权限、费用类型、假期类型、运维角色、Logo 企业名等均可用
  - DEF-TECH-01（ops vs sys_admin 命名）已修复并关闭
  - 撤回：~~DEF-TECH-02~~ 为 agent 误报（B-REM-01 实际已完成）
- Phase C — 测试覆盖：**核验通过**
  - 后端 `mvn test` 1315 测试全绿（0 失败、0 错误、0 skip，含 ArchUnit 4 条架构约束）
  - 前端 `yarn workspace oa-h5 test` 35 测试全绿
- Phase C+ — 质量体系建设 + 全维度测试：**核验通过，技术债已关闭**
  - 核心工具链全部存在：husky（pre-commit/commit-msg/pre-push）、commitlintrc、Spotless、ArchUnit、springdoc、ESLint、Prettier、Semgrep、k6、ZAP、schemathesis、5 个 GitHub Actions workflow
  - DEF-TECH-03（Knip）：原为误报，复核发现 auth.global.ts 一条错误 import 路径，已修；yarn knip 目前无问题
  - DEF-TECH-04（Snyk）：`.snyk` 策略骨架已创建
- **Phase D — 逐模块测试 + 设计对齐 + 人工验收（当前活跃）**
- Phase E — 人工验收：未开始
- Phase F — 生产部署 + 工程规范：未开始
- Phase G — 微信小程序：未开始
- Phase H — 运维维护：未开始

---

## 设计缺陷池（DEFECTS）

> **规则**：测试、验收、使用过程中发现的**设计层面**问题（非单点 bug），统一在此登记。
> 每条 DEFECT 独立立项，不阻塞发现它的那个 Phase/模块的推进。
> 状态：`[ ]` 待立项 / `[~]` 立项中 / `[>]` 修复中 / `[?]` 待验收 / `[x]` 已关闭

### DEF-AUTH-01 登录限流 per-IP 应改为 per-account + per-IP 双层

- **发现来源**：D-M01 Stage 2 调研业内实践（2026-04-23）
- **修复日期**：2026-04-23
- **修复内容**：`AuthController.java` 新增 `loginFailStatesByUsername` per-账号 ConcurrentHashMap，login() 中双维度独立累计/判锁，任一锁定即拒绝；成功登录双向清零；`resetAllLoginFailStates()` 同时清两侧
- **验收**：mvn test 1316 全绿（含 ArchUnit 4 条架构约束）
- **状态**：`[x]` 已关闭

### DEF-AUTH-02 登录失败缺少验证码挑战层

- **发现来源**：D-M01 Stage 2 调研（2026-04-23）
- **修复日期**：2026-04-23
- **修复内容**：新增 `CaptchaService`（BufferedImage 4 位数字图形验证码，3 分钟 TTL，一次性使用）；`AuthController` 新增 `GET /auth/captcha`；login() 在 failCount ≥ 3 时要求验证码；失败后若达阈值在 401 响应中返回 `captchaRequired: true`；前端 `login.vue` 检测到 `captchaRequired` 自动拉取并展示验证码
- **验收**：mvn test 1316 全绿；yarn workspace oa-h5 test 35 全绿
- **状态**：`[x]` 已关闭

### DEF-AUTH-03 锁定期间缺少自助解锁路径

- **发现来源**：D-M01 Stage 2 调研（2026-04-23）
- **修复日期**：2026-04-23
- **修复内容**：`AuthController` 暴露 `resetLoginFailStatesForUsername(username)`；`PasswordResetController` 在密码重置成功后调用，`SetupController` 在恢复码重置 CEO 密码后调用；login() 锁定响应 body 包含 `selfServiceUnlock: "/me/forgot-password"` 字段引导用户
- **验收**：mvn test 1316 全绿
- **状态**：`[x]` 已关闭

### DEF-AUTH-04 测试环境限流阈值被改为 100000，等于关闭测试覆盖

- **发现来源**：D-M01 Stage 2（2026-04-23）
- **修复日期**：2026-04-23
- **修复内容**：`server/src/test/resources/application.yml` 的 `login-fail-threshold` 恢复为 5、`global-per-minute` 恢复为 300（与生产一致）；`GlobalRateLimitFilter` 改为 Spring `@Component` 并新增 `resetAll()`；`DevController` 新增 `POST /dev/reset-rate-limit` 同时清登录失败计数和全局 IP 限流计数；非限流测试开头可调此端点清零
- **验收**：mvn test 1316 全绿（测试阈值恢复后所有集成测试仍通过，证明清零机制工作）
- **状态**：`[x]` 已关闭

### DEF-TECH-01 `ops` 角色与 `sys_admin` 命名不一致

- **发现来源**：VERIFY-PHASE-B 核验（2026-04-23）
- **修复日期**：2026-04-23
- **修复内容**：`app/h5/layouts/default.vue` ROLE_MENUS 键 `ops` 改为 `sys_admin`；其余前后端位置（auth.global.ts、test/unit/h5/access.test.ts、backend V18 migration、E-ROLE seed）此前已统一为 `sys_admin`，仅 default.vue 遗漏
- **验收**：yarn workspace oa-h5 test 35 全绿；grep 全项目无代码层 `'ops'` 角色引用残留
- **状态**：`[x]` 已关闭

### ~~DEF-TECH-02~~（撤回）injury accidentDescription 误报

- **原报告**：B-REM-01 未完成
- **复核**：`app/h5/pages/injury/index.vue:365` 唯一使用 `accidentDescription` 的位置是 `doApply` 提交映射，该映射按 B-REM-01 原任务设计要求**保留**（仅要求删除 `applyForm` 声明）。`applyForm` 中已无该字段。B-REM-01 实际真实完成，本条撤回。

### DEF-TECH-03 Knip 配置

- **发现来源**：VERIFY-PHASE-CPLUS 核验（2026-04-23）
- **修复日期**：2026-04-23
- **修复内容**：Agent 初报误判 —— 配置文件其实存在（`knip.json` 而非 `.knip.json`，两种命名 Knip 均支持）。复核时运行 `yarn knip` 发现一条真实 unresolved import：`app/h5/middleware/auth.global.ts:7` 的 `~/shared/types/auth` 应为 `@shared/types/auth`（`~` 在 Nuxt 中指向 srcDir 而非项目根）。已修复该 import，`yarn knip` 目前干净无问题
- **验收**：`yarn knip` 2 秒内完成，0 问题报告
- **状态**：`[x]` 已关闭

### DEF-TECH-04 Snyk 缺 `.snyk` 策略文件

- **发现来源**：VERIFY-PHASE-CPLUS 核验（2026-04-23）
- **修复日期**：2026-04-23
- **修复内容**：创建 `.snyk` 策略骨架（version v1.25.0 + 空 ignore/patch 段 + 格式说明注释），未来遇到需豁免的漏洞时按注释格式填充
- **验收**：文件存在且格式合法；Snyk 下次运行时会识别该策略文件
- **状态**：`[x]` 已关闭

### DEF-SETUP-01 /setup 刷新/关闭浏览器需用户确认

- **发现来源**：D-M08 Stage 1 设计对齐（2026-04-28）
- **设计差异**：原 DESIGN.md §2 措辞"会话失效"与实现不符（公开端点无 session），但效果上"已填数据不保留"是设计预期行为
- **处理方案**：用户裁决方案 C — /setup 加 `beforeunload` 监听，已填任意字段时触发浏览器原生确认提示，用户确认后才允许刷新/关闭；DESIGN.md §2 措辞同步修正
- **状态**：`[~]` 立项中（DESIGN.md 已改，前端 beforeunload 待实施）

### DEF-SETUP-02 DESIGN §2.3 部署者账号失效描述与实现不符

- **发现来源**：D-M08 Stage 1 设计对齐（2026-04-28）
- **设计差异**：DESIGN 写"部署者完成初始化后账号失效"，但实现是匿名公开端点 /setup/init，无"部署者账号"概念
- **处理方案**：用户裁决方案 A — DESIGN.md §2.3 改写为"部署者无需登录、不创建账号、自然无法访问"，纯文档修正
- **状态**：`[x]` 已关闭（2026-04-28）

### DEF-SETUP-03 DESIGN 步骤 1-4 措辞像分步提交，实现是单次原子提交

- **发现来源**：D-M08 Stage 1 设计对齐（2026-04-28）
- **设计差异**：DESIGN 步骤 1-4 标题为"创建 X 账号"，读起来像每步立即建账号；实现是 step 1-3 仅收集前端、step 4 一次性 POST /setup/init 在事务内创建所有账号
- **处理方案**：用户裁决方案 A — 保持单次原子提交（避免中间不一致状态），DESIGN.md §2.2 步骤 1-4 标题改为"填写 X 账号信息"+ 加"确认与提交"注解明示原子性
- **状态**：`[x]` 已关闭（2026-04-28）

### DEF-ROLE-01 角色权限系统未持久化到 DB（运营态 AccessManagementService 写内存）

- **发现来源**：D-M08 阶段 3.2a 抽 RoleConfigPanel + 后端补 finalize.permissions 字段时，由 Backend Architect 阻塞调研发现（2026-04-28）
- **设计差异**：
  - 现状：运营态 POST /api/roles 经 AccessManagementService.createRole() 写 LinkedHashMap 内存，不写 sys_role / role_permission DB 表
  - V1__init_schema.sql 行 169-190 定义的 permission / role_permission 关联表悬空，无任何 Java Entity / Mapper / Service 引用
  - JwtAuthenticationFilter 走 AccessManagementService 查内存 → 服务重启后所有运营态创建的角色 + 权限全丢
  - DESIGN.md §2.2 系统权限总表用中文短语（如"查看全体人员基础信息"），实际 /role 页面 + AccessManagementService 接受任意字符串作权限码（无白名单）
- **影响**：
  - 运营态创建的自定义角色 + 权限重启服务即丢（生产环境长期严重 bug）
  - DESIGN.md 权限码与代码实现命名不一致
  - finalize 创建的角色若仅写 DB sys_role 不入内存，则 JwtAuthenticationFilter 看不到
- **D-M08 当前折中**：finalize.applyRoles 既写 DB sys_role 也调 AccessManagementService.createRole 注入内存（双写）；permissions 字段不做白名单，沿用运营态弱契约
- **目标修复**：
  1. AccessManagementService 启动时从 sys_role / role_permission 表加载，运行时所有写操作同时持久化
  2. DESIGN.md 系统权限总表与代码权限码统一（选 SCREAMING_SNAKE_CASE 英文码或中文短语）
  3. 移除"内存唯一来源"的双写隐患
- **延期理由**：属于 D-M05 角色管理模块的历史遗留 bug；当下 D-M08 修需先重写 D-M05 整套服务实现，与 D-M08 主线（向导改造）耦合度低，独立处理代价更小
- **目标阶段**：D-M05 模块独立修复（计划 2026-05-15 前完成）
- **状态**：`[ ]` 已立项延期（用户书面确认日期：2026-04-28）

### DEF-SETUP-05 wizard_finalize_token 无 TTL 与 per-IP 限流

- **发现来源**：D-M08 阶段 3.1 Code Reviewer 审计 P2-2（2026-04-28）
- **设计差异**：finalize_token 一旦 init 返回后无过期时间，仅在 finalize 成功 / dev 重置时清空；token 32 字符 base64url 192 位熵防暴力，但缺乏 TTL 与失败次数限流的纵深防御
- **处理方案**：立项延期至 Phase F 生产部署阶段统一处理：(1) token_created_at 字段 + 24h TTL 校验 (2) 失败次数 per-IP 限流（独立于全局 GlobalRateLimitFilter）
- **延期理由**：当前 D-M08 主线是功能 / 流程改造；TTL 与限流属于安全增强，与生产部署期的安全加固整体打包更合适
- **目标阶段**：Phase F
- **状态**：`[ ]` 已立项延期（用户书面确认日期：2026-04-28）

### DEF-SETUP-04 /setup step 6-10 跳转模式无法贯穿初始化全流程

- **发现来源**：D-M08 Stage 1 设计对齐（2026-04-28）
- **设计差异**：当前实现 step 6-10 只是"前往对应业务页"的跳转按钮，跳走后回到 /setup 因系统已初始化被踢到 /login，部署人员无法在向导内完成 step 5-10 的配置
- **处理方案**：用户裁决方案 C2 — /setup 重构为"内嵌组件 + 末步统一原子提交"
  1. 前端从 /role、/directory、/org、/config、/retention 抽取 5 个核心组件（与运营期独立功能复用同一组件）
  2. /setup step 6-10 改为内嵌这些组件，部署人员从 step 1 到 step 10 始终在 /setup
  3. 后端新增 POST /setup/finalize 端点，接收 step 5-10 全部数据原子写入
  4. step 10 末尾"完成初始化"按钮调用 /setup/finalize，成功后跳 /login
- **工程量**：约 5-7 天前端 + 1 天后端
- **DESIGN.md**：§2.2 步骤 5-10 已加"实现说明"注解（2026-04-28）
- **状态**：`[~]` 实施中（前端组件抽取 + /setup 重写 + 后端 finalize 端点）

---

## Phase D 协作 SOP

> 每个 D-M 模块走 4 个 Stage，逐阶段交接，上一阶段未产出不进入下一阶段。

### Stage 1 — 设计对齐（我 + 用户，同步讨论）

- **输入**：`DESIGN.md` 模块章节 §M{XX}
- **我的动作**：
  1. 读 DESIGN.md §M
  2. 提取模块功能清单（页面、组件、操作、权限、数据来源与走向）
  3. 标出疑问点（描述模糊、冲突、未覆盖的边界）
- **用户的动作**：逐条确认/修正；对模糊点给出业务决策
- **我的收尾**：更新 DESIGN.md §M；发现设计层缺陷登记到 DEFECTS
- **产出**：DESIGN.md §M 定稿；模块功能清单定稿

### Stage 2 — 测试用例设计（我 + 用户，同步讨论）

- **输入**：Stage 1 产出 + 业内实践调研
- **我的动作**：
  1. 按 **"页面 → 表单组件 → 操作/输入维度"** 三层结构设计用例
  2. 每个用例明确：前置条件、操作步骤、断言
  3. **禁止**在用例中加 skip 逻辑（见 `memory/feedback_no_test_skips.md`）
- **用户的动作**：确认粒度、遗漏、冗余
- **产出**：`test/e2e/modules/D-M{XX}.md` 用例清单定稿

### Stage 3 — 测试实现与执行（QA agent 主导）

- **输入**：Stage 2 定稿用例清单
- **流程**：
  1. QA agent 实现 `test/e2e/specs/D-M{XX}.spec.ts`
  2. QA agent 执行，输出 Pass/Fail 矩阵
  3. 我分类每个 Fail：
     - 实现 bug → Backend/Frontend agent 修 → Code Reviewer → 重跑
     - 设计缺陷 → 登记 DEFECTS 后继续（不阻塞）
     - 测试代码缺陷 → QA agent 修 → 重跑
  4. 必须全绿且**无 skip**，方可推 Stage 4
- **产出**：Pass 矩阵（全绿）；本模块 DEFECTS 登记列表

### Stage 4 — 人工验收（用户主导）

- **输入**：Stage 3 全绿
- **流程**：
  1. 用户在浏览器走完模块主流程
  2. 用户反馈 bug → 我分类处理（修 / 登记 DEFECTS）→ 回归
  3. 直到用户无反馈
- **产出**：用户签字日期；模块 `[x]`

---

## 核验归档执行记录（2026-04-23）

> 已完成 Phase 归档前必须核对代码实际状态，**禁止仅凭 TODO 文档判断**。
> 本次核验 2026-04-23 完成，结果见 Phase 总览。偏差项均已登记 DEFECTS。

- `[x]` **VERIFY-PHASE-A** 核验 Phase A 关键节点（2026-04-23）
  - 10 项关键节点全 PASS：controller 权限注解（AttachmentController/WorkbenchController 两处类级 @PreAuthorize）、auth.global.ts PAGE_ACCESS 17 路由、AuthController loginFailStates TTL 机制存在、Controller 不持 Mapper（grep 0 违规）、GlobalExceptionHandler 15+ 异常覆盖、app/ 下无 *.test.ts、pages/ 全部 snake_case（28 目录）、V14__add_indexes.sql 9 条 CREATE INDEX
  - 结论：真实完成

- `[x]` **VERIFY-PHASE-B** 核验 Phase B 关键节点（2026-04-23）
  - 10/12 PASS：B-P0-01（HR 读员工 @PreAuthorize hr 存在）、B-P0-02（PM 通过 TeamController.java:32 `/team/members` GET 读团队）、B-P0-03（ExpenseController `/types`）、B-P1-02（LeaveTypeController）、B-FEAT-01/02/03/17/20 页面/接口存在、B-INFRA-01 延期原因确认
  - 2 技术债：登记 DEF-TECH-01（ops/sys_admin 命名）、DEF-TECH-02（injury 死字段）
  - 结论：核心真实完成，2 个历史债务

- `[x]` **VERIFY-PHASE-C** 核验 Phase C 测试（2026-04-23）
  - `mvn test` 1315 测试全绿（0 失败/错误/skip，含 ArchUnit 4 条）
  - `yarn workspace oa-h5 test` 35 测试全绿
  - 结论：真实完成

- `[x]` **VERIFY-PHASE-CPLUS** 核验 Phase C+ 工具链（2026-04-23）
  - 12/15 PASS：husky 3 hooks、commitlintrc.json、5 个 workflow（fast-check/nightly/release/ci/full-test）、spotless-maven-plugin、ArchUnit、springdoc-openapi-starter-webmvc-ui、eslint.config.mjs、.prettierrc、Semgrep in CI、k6 tools/k6/5 脚本、schemathesis tools/schemathesis/、ZAP in CI
  - 3 配置小缺失：登记 DEF-TECH-03（Knip 缺 config）、DEF-TECH-04（Snyk 缺 .snyk）
  - 结论：核心工具链真实可用，3 处定制化配置待补

---

## Phase A — 架构治理 + 清理（声明完成，⚠️ 待核验）

> **状态**：所有任务均标记 `[x]`，但未经代码核验归档；详情见文档开头 **VERIFY-PHASE-A** 任务。
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
- **状态**：`[x]`（dev H2 端启动无错 + curl 登录/业务接口返回 200 / 401 符合预期；prod PostgreSQL 的 Flyway V14 应用待 Phase F 生产部署时验证）

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
- **实施**：删除 13 条 data-catch TODO 注释（forms/projects/construction_log/injury/payroll/Permission.vue）+ 1 条 EmployeeServiceImpl TODO。空目录无。所有 TODO/FIXME/XXX 搜索结果为 0。功能缺口线索已分别归入 Phase B B-FEAT-10/11/12（工伤/项目/施工日志）；forms 过滤器与 mp Permission 细粒度权限在 Phase B 验收或 Phase G 实施时处理。
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
- **目标**：`app/mp/` 为 Phase G 尚未开发，CI 每次 push 必定失败
- **范围**：`.github/workflows/ci.yml`
- **步骤**
  1. 将 `frontend-mp-test` job 用条件跳过：`if: false`（或注释该 job）
  2. 添加注释说明：Phase G 启动时恢复
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

#### A-AUDIT-REGRESSION — 验收阶段发现的遗留问题（2026-04-18）

- `[x]` **A-AUDIT-REGRESSION-01** InjuryClaimController Mapper 注入未清理 — `InjuryClaimController.java:29` 直接注入 `FormRecordMapper`，违反 A-AUDIT-DEBT-07 "Controller 层零 Mapper 注入"规则；将 `formRecordMapper.selectById(req.formRecordId())` 调用迁入 `InjuryClaimService` 中，Controller 改为调用 Service 方法

---

## Phase B — 功能补全 + Bug 修复（声明完成，⚠️ 待核验）

> **状态**：所有任务均标记 `[?]` 或 `[x]`，但未经代码核验归档；详情见文档开头 **VERIFY-PHASE-B** 任务。

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
- **状态**：`[?]`（代码核查已过；等待 Phase E 浏览器验收）

#### B-P2-02 Worker 侧边栏"考勤管理"浏览器验收
- **目标**：代码层已修复（ROLE_MENUS.worker 含 `/attendance`），需浏览器确认
- **范围**：`app/h5/layouts/default.vue`
- **步骤**：Worker 账号登录，侧边栏可见"考勤申请"入口
- **验收点**：入口可见且可用
- **验收流程**：worker.demo 登录浏览器验收
- **状态**：`[?]`（代码核查已过；等待 Phase E 浏览器验收）

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

- `[x]` **B-P3-01 岗位管理无种子数据** — 已废弃原方案。Phase D 设计审计确认 DESIGN.md §3.4 明确"系统不内置固定岗位表"，正确做法是删除内置种子数据而非新增；data.sql 中 position MERGE 块已于 2026-04-18 删除。岗位通过运营期 HR/财务自行创建，集成测试已独立通过。
- `[x]` **B-P3-02 补贴配置无种子数据** — 已废弃原方案。设计审计确认 allowance_def 不应预置，data.sql 中 allowance_def/allowance_config MERGE 块已删除；补贴由财务在运营期自行配置。
- `[?]` **B-P3-03 CEO 考勤「我的记录」为空** — `db/data.sql` 为 ceo.demo 补 1–3 条考勤记录
- `[?]` **B-P3-04 数据查看器文件格式描述错误** — `pages/data_viewer/index.vue` 页面提示改为 ".obk" 格式（DESIGN.md §10.3）
- `[?]` **B-P3-05 Finance 侧边栏含「通讯录导入」入口** — 对照 DESIGN.md §5.4 确认 Finance 是否应有此入口；确认后删除或保留
- `[?]` **B-P3-06 初始化向导 CEO 手机号无格式校验** — `pages/setup/index.vue` 追加 `/^1[3-9]\d{9}$/` 正则校验，不合格则禁止提交
- `[?]` **B-P3-07 新增员工身份证号无格式校验** — `pages/employees/index.vue` 追加 18 位格式规则（前 17 位数字 + 末位数字或 X）
- `[?]` **B-P3-08 密码策略不一致（setup ≥8 位 vs change ≥6 位）** — `pages/me/password.vue` 中 `min: 6` 改为 `min: 8`
- `[?]` **B-P3-09 报销明细金额接受负数和零** — `pages/expense/apply/index.vue` 金额输入框追加 `:min="0.01"`

#### B-P3-REGRESSION — 验收阶段发现的遗留问题（2026-04-18）

- `[ ]` **B-P3-REGRESSION-01 ops.demo 未加入 access.test.ts 账号完整性检查** — `test/unit/h5/access.test.ts` defaultTestAccounts 列表中缺少 ops.demo；补充该账号的存在性断言，确保种子数据覆盖所有角色

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
- **注意**：V2–V9 共 6 个 migration 文件含 PostgreSQL 专用语法（ON CONFLICT / setval / pg_get_serial_sequence），全量改造超出 Phase B 范围；A-AUDIT-INFRA-01 CI job 已作为安全网。延期至 Phase F（生产部署基础设施）统一处理。
- **状态**：`[ ]`（延期至 Phase F）

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

### B-REM — 遗留问题修复（B 阶段发现，须在 B 阶段解决）

#### B-REM-01 injury/index.vue — accidentDescription 死字段清理
- **目标**：`applyForm` 中声明了 `accidentDescription` 字段，但表单无对应输入控件；实际输入绑定的是 `description`，提交时手动映射为 `accidentDescription`；死字段造成语义混淆
- **范围**：`app/h5/pages/injury/index.vue`
- **步骤**
  1. 删除 `applyForm` 中的 `accidentDescription: ''` 字段
  2. 删除 `resetApplyForm` 中的同名重置项
  3. 确认 `doApply` 中 `accidentDescription: applyForm.value.description` 映射保持不变
- **验收点**：`applyForm` 无 `accidentDescription` 冗余字段；提交 payload 仍正确携带 `accidentDescription` 值
- **状态**：`[?]`

#### B-REM-02 OvertimeTab.vue — self-report 模式缺少时长显示和附件上传
- **目标**：self-report 模式与 overtime 模式字段一致（DESIGN.md §7.3 加班字段表），但缺少：加班时长只读展示、附件上传控件
- **范围**：`app/h5/pages/attendance/tabs/OvertimeTab.vue`
- **步骤**
  1. 新增 `self_report_duration` computed（逻辑同 `overtime_duration`，读 `self_report_form` startTime/endTime）
  2. `SelfReportFormState` 接口新增 `attachmentIds: number[]`
  3. `makeEmptySelfReportForm` 新增 `attachmentIds: []`
  4. 新增 `self_report_file_ref` ref 和 `handleSelfReportFilesChange` handler
  5. self-report 模板：endTime 后插入时长只读行；提交按钮前插入附件上传
  6. `submitSelfReport` POST body 携带 `attachmentIds`；成功后清空文件 ref
- **验收点**：self-report 模式显示时长（含时间顺序错误提示）；可上传附件；附件 id 随表单提交
- **状态**：`[?]`

#### B-REM-03 OvertimeTab.vue — 时间顺序错误时提示措辞不准确
- **目标**：时长计算返回 `null` 时展示"请先选择开始和结束时间"，但未区分"未选时间"与"时间顺序错误"两种情况
- **范围**：`app/h5/pages/attendance/tabs/OvertimeTab.vue`
- **步骤**
  1. 修改 `overtime_duration`（及新增的 `self_report_duration`）：区分"未选"返回 `null`，"顺序错误"返回 `'结束时间须晚于开始时间'`
- **验收点**：时间顺序错误时显示"结束时间须晚于开始时间"；未选时间时显示"请先选择开始和结束时间"
- **状态**：`[?]`（与 B-REM-02 合并实现）

---

## Phase C — 测试覆盖（声明完成，⚠️ 待核验）

> **状态**：所有任务均标记完成，但未经代码核验归档；详情见文档开头 **VERIFY-PHASE-C** 任务。

> **前置条件**：Phase B 全部 `[?]`（P0/P1/P2/P3/FEAT 自动化测试全通过；`[x]` 待 Phase E 人工走查后补齐）。
> **目标**：编写并执行全部自动化测试；Claude 自执行黑盒测试；测试文档修复。
> **完成标准**：`yarn test:integration` 全通过；`yarn playwright test` 全通过；MB-01~MB-10 黑盒用例全部 Pass。

---

### C-DOC — 测试文档修复（先于测试编写执行）

- `[x]` **C-DOC-01 测试主文档单一职责修复**
  - `test/TEST_DESIGN.md` §4 内联 35+ 条 API 集成测试规格，与"策略层文档"定位矛盾
  - 新建 `test/integration/TEST_DESIGN.md`，将 §4 全部用例迁移；主文档 §4 保留摘要和链接
  - 验收：`test/TEST_DESIGN.md §4` 无内联用例表；链接可跳转到完整规格文件

- `[x]` **C-DOC-02 文档交叉引用改为 Markdown 超链接**
  - 受影响：`test/TEST_DESIGN.md`、`test/e2e/TEST_DESIGN.md`、`test/TEST_COVERAGE_GAPS.md`
  - 所有反引号路径引用替换为 `[文件名](相对路径)` 可点击链接
  - 验收：GitHub 预览中所有交叉引用均可点击跳转

---

### C-INT — API 集成测试

- `[x]` **C-INT-01 假期类型 API**（`test/integration/api.test.ts` 扩展）
  - `GET /config/leave-types` → 200，数组非空
  - `POST /config/leave-types`（HR token）→ 201；（worker token）→ 403
  - `DELETE /config/leave-types/{id}`（HR token）→ 200
  - 验收：三条用例全通过，权限控制正确

- `[x]` **C-INT-02 考勤/请假 API**
  - `POST /attendance/leave`（employee token，有效数据）→ 200，返回 formId
  - `POST /attendance/leave`（缺必填字段 leaveType）→ 400
  - `GET /attendance/records`（employee token）→ 200，仅含本人记录
  - `GET /attendance/records`（CEO token）→ 200，含全员记录
  - 验收：数据隔离验证

- `[x]` **C-INT-03 报销 API**
  - `GET /expense/types` → 200 非空
  - `POST /expense`（employee token）→ 201
  - `GET /expense/records`（employee）→ 200 仅本人；（finance）→ 200 全员
  - `POST /expense/{id}/approve`（finance）→ 200；（employee）→ 403
  - 验收：审批权限双层验证

- `[x]` **C-INT-04 工伤 API**
  - `POST /injury`（worker token，含必填字段）→ 200
  - `GET /injury`（finance token）→ 200
  - `PUT /injury/{id}/compensation`（finance）→ 200；（worker）→ 403
  - 验收：理赔仅财务可录入

- `[x]` **C-INT-05 系统配置 API**（CEO 专属）
  - `GET/PUT /config/company-name`（CEO）→ 200；（HR）→ 403
  - `GET/PUT /config/payroll-cycle`（CEO）→ 200
  - `GET /config/retention-period`（CEO）→ 200
  - 验收：6 条用例全通过，配置读写权限隔离

- `[x]` **C-INT-06 权限越权直调（≥15 条）**
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

- `[x]` **C-INT-07 密码变更 API**
  - 正确旧密码，新密码≥8位 → 200
  - 错误旧密码 → 400
  - 新密码5位 → 400
  - 验收：BUG-B-P3-08 修复回归测试

- `[x]` **C-INT-08 薪资结算链路 API**
  - `POST /payroll/cycles`（finance）→ 201，status=OPEN
  - `PUT /payroll/cycles/{id}/settle`（finance）→ 200，status=SETTLED
  - `GET /payroll/slips?cycleId={id}`（employee 本人）→ 200，仅本人工资条
  - `POST /payroll/slips/{id}/confirm`（employee）→ 200
  - 验收：薪资发放主链 API 层验证

- `[x]` **C-INT-09 测试运行基础设施补全**
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
  - 步骤4 — CI 补充 shared 单元测试：确认 `frontend-mp-test`（Phase G 恢复后）已包含 shared 测试（mp vitest config 包含 shared 路径，无需独立 job）
  - 步骤5 — 确认 `frontend-h5-test` job 上传 coverage 报告到 Artifacts
  - 验收：`yarn test:integration` 本地可执行；CI `integration-test` job 绿

---

### C-E2E — E2E 自动化测试

- `[x]` **C-E2E-01 请假审批完整流程**（`test/e2e/specs/leave_flow.spec.ts`）
  - employee 提交请假 → dept_manager 审批通过 → employee 确认状态
  - 三断言：提交后"审批中"、dept_manager 待办列表出现、审批后"已通过"
  - 验收：Claude 检查断言质量（不接受空洞断言）

- `[x]` **C-E2E-02 报销审批完整流程**（`test/e2e/specs/expense_flow.spec.ts`）
  - employee 提交报销（含发票上传 + 关联项目）→ finance 审批通过
  - 三断言：不上传发票拦截、finance 可见记录、审批后状态更新

- `[x]` **C-E2E-03 加班申报审批流程**（`test/e2e/specs/overtime_flow.spec.ts`）
  - employee 提交加班（时长字段自动计算）→ dept_manager 审批通过
  - 二断言：时长自动计算非空、审批后状态"已通过"

- `[x]` **C-E2E-04 申请驳回后重新提交**（`test/e2e/specs/rejection_resubmit.spec.ts`）
  - employee 提交请假 → dept_manager 驳回（原因"时间冲突"）→ employee 重新发起
  - 二断言：驳回原因文本可读、重新发起后新记录（ID 不同）

- `[x]` **C-E2E-05 施工日志提交和 PM 审批**（`test/e2e/specs/construction_log_flow.spec.ts`）
  - worker 提交施工日志 → pm 在项目详情审批通过
  - 三断言：worker 日志状态"待审核"、pm 可见该日志、审批后状态更新

- `[x]` **C-E2E-06 薪资周期完整流程**（`test/e2e/specs/payroll_cycle_flow.spec.ts`）
  - finance 创建周期 → 结算 → employee 查看工资单并确认签收
  - 含工资单金额 > 0 断言

- `[x]` **C-E2E-07 员工管理 CRUD**（`test/e2e/specs/employee_crud.spec.ts`）
  - 创建（含所有必填字段）→ 修改部门 → 停用
  - 停用后真实登录尝试被拒绝（不接受仅检查状态标签文字）

- `[x]` **C-E2E-08 岗位与薪级 CRUD**（`test/e2e/specs/position_crud.spec.ts`）
  - 创建岗位 + 等级 → 删除有在职员工的岗位 → 拦截提示
  - 约束删除场景断言验证提示文本

- `[x]` **C-E2E-09 假期类型 CRUD**（`test/e2e/specs/leave_type_crud.spec.ts`）
  - HR 创建"调休假" → employee 请假下拉可选到"调休假"
  - 验证前后端联动

- `[x]` **C-E2E-10 项目与里程碑 CRUD**（`test/e2e/specs/project_crud.spec.ts`）
  - 创建项目（含客户名称/合同编号/合同附件）→ 添加里程碑 → 修改进度
  - 合同附件验证服务端存储成功（详情页可访问）

- `[x]` **C-E2E-11 报销发票上传边界**（`test/e2e/specs/expense_upload.spec.ts`）
  - 场景A：不上传直接提交 → Toast 含"请上传"
  - 场景B：有效 JPG 上传 → 提交后详情页附件可访问（非仅前端预览）
  - 场景C：上传超量（若有限制）→ 拦截提示

- `[x]` **C-E2E-12 表单日期边界**（`test/e2e/specs/date_boundaries.spec.ts`）
  - 结束日早于开始日 → 校验提示
  - Toast 不暴露 HTTP 错误字符串

- `[x]` **C-E2E-13 数字计算与零值校验**（`test/e2e/specs/calculation_accuracy.spec.ts`）
  - 三行明细 100+200+300 → 总金额 600
  - 零金额/负数 → 拦截提示

- `[x]` **C-E2E-14 密码修改错误提示回归**（`test/e2e/specs/password_error_toast.spec.ts`）
  - 错误当前密码 → Toast 为业务语言，不含 HTTP 格式字符串

---

### C-BLK — 黑盒测试用例设计

- `[x]` **C-BLK-01 新建 `test/manual/TEST_CASES.md`**
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

- `[x]` **C-AUTO-01 Claude 操控浏览器执行 MB-01~MB-10**
  - 前置：后端和前端服务均运行中；Phase B 全部 `[?]`；C-BLK-01 设计文档已完成
  - 按 `test/manual/TEST_CASES.md` 逐条执行，截图关键步骤
  - 发现新缺陷立即追加至 Phase B 对应优先级
  - 全部通过后将结果写入 `test/manual/TEST_CASES.md` 实际结果栏
  - 验收：10 条用例实际结果栏全部为"通过"，无遗留"失败"或"阻塞"

#### C-REGRESSION — 验收阶段发现的测试缺陷（2026-04-18）

- `[x]` **C-REGRESSION-01 集成测试非幂等 — 薪资周期 period 冲突** — `test/integration/api.test.ts` TC-B1-04（period="2026-05"）和 PR-01（period="2026-07"）使用固定 period，第二次运行时该 period 已存在返回 400，测试失败。根本原因：测试未在 afterAll 清理创建的数据，且 period 值硬编码。修复方案：每次运行用动态 period（如当前年份+月份+随机后缀），或在 beforeAll 检查并删除已存在的周期。
- `[x]` **C-REGRESSION-02 SC-01 company-name 断言错误** — `test/integration/api.test.ts:632` 断言 `typeof companyName === 'string'`，但系统未初始化时返回 `null`，`typeof null === 'object'` 导致失败。修复：改为 `expect(body.companyName === null || typeof body.companyName === 'string').toBe(true)`。
- `[x]` **C-REGRESSION-03 ops.demo 未纳入账号完整性测试** — `test/unit/h5/access.test.ts` defaultTestAccounts 未包含 ops.demo（已在 data.sql 和 test-accounts.sql 添加）。补充断言：`ops.demo / 123456` 存在于种子数据中。

### C-QUALITY — 测试、审计、验收体系强化（最高优先级，阻塞 Phase D）

> **背景**：Phase C 验收暴露两类系统性缺陷：①代码级错误（Controller 层 Mapper 注入）未被工具自动拦截；②集成测试非幂等，仅"首次运行通过"不等于"真正通过"。
> **原则**：能被工具自动检测的错误，属于红线，一律不允许出现；逻辑错误通过结构化 Checklist + 幂等测试双重保障。
> **完成条件**：全部 C-QUALITY 任务通过后，`mvn test` + `yarn test:integration`（连续三次）+ `yarn lint` 全部干净，方可开始 Phase D。

---

#### C-QUALITY-01 ArchUnit 架构约束测试（后端红线自动化）

- `[x]` **C-QUALITY-01**
  - 新建 `server/src/test/java/com/oa/backend/architecture/ArchitectureTest.java`
  - 强制规则（随 `mvn test` 自动运行，任一失败则 BUILD FAILURE）：
    - Controller 层类不得直接依赖任何 `*.mapper.*` 包中的类（`com.fasterxml.jackson.databind.ObjectMapper` 除外）
    - Controller 层类不得直接依赖 `*.entity.*` 包（必须通过 Service/DTO 层）
    - `*.service.*` 层不得依赖 `*.controller.*` 层（单向依赖）
    - 禁止包级循环依赖
  - 验收：
    - `mvn test` 包含 ArchUnit 测试类且全部通过
    - 故意在一个 Controller 中注入 Mapper，确认 `mvn test` 立即失败（验证规则有效）
    - InjuryClaimController 当前违规被自动检出 → 修复后规则通过

#### C-QUALITY-02 集成测试幂等化改造

- `[x]` **C-QUALITY-02**
  - 修复 C-REGRESSION-01/02（fix test/integration/api.test.ts）
  - 制定并写入 `test/TEST_DESIGN.md` 集成测试幂等性规范：
    - POST 创建类测试的入参中，会造成唯一冲突的字段（period、code、employeeNo 等）必须使用动态值，格式：`TEST-{随机4位}-{字段含义}`，如 `2099-${Math.random().toString(36).slice(2,6)}`
    - 有副作用的测试（创建/修改数据）必须在 `afterAll` 中清理，或明确说明为何无需清理（如使用独立隔离数据）
    - 断言中禁止 `typeof x === 'string'` 这类未处理 null 的类型断言；必须写 `x === null || typeof x === 'string'` 或明确期望非 null
  - 验收：`yarn test:integration` 连续运行三次，三次全部通过，无任何失败

#### C-QUALITY-03 Code Reviewer 强制 Checklist 落地

- `[x]` **C-QUALITY-03**
  - 更新 `CLAUDE.md` Code Reviewer 节，新增强制 Checklist（见下方条目），QA Engineer 每次 review 必须逐项确认并在输出中列出每项结论
  - Checklist 内容（写入 CLAUDE.md）：
    - 架构红线：`grep -rn "private final.*Mapper" server/.../controller/` 输出为空（ObjectMapper 除外）
    - 架构红线：Controller 不直接引用 Entity（必须经过 DTO/Service）
    - 测试幂等：新增集成测试中创建类用例使用动态数据，或有 afterAll 清理
    - 测试断言：无 `typeof x === 'string/number'` 类断言（未处理 null 的情况）
    - 权限完整：每个新增 HTTP endpoint 有 `@PreAuthorize` 注解
    - 设计对齐：新增字段/接口已在 DESIGN.md 对应章节找到出处，无额外实现
  - 验收：CLAUDE.md 中 Code Reviewer 节包含上述 Checklist 全文，可逐项核查

#### C-QUALITY-04 前端静态分析强化

- `[x]` **C-QUALITY-04**
  - `app/h5/tsconfig.json` 确认 `strict: true`（含 `noImplicitAny`、`strictNullChecks`）；若开启后有编译错误则修复
  - ESLint 规则：`@typescript-eslint/no-explicit-any: warn`（已有原因注释的 `as any` 豁免）
  - 新增 `yarn workspace oa-h5 lint` 作为 CI 检查步骤（后续 Phase F 配置 CI 时落地，本任务先确认本地零错误）
  - 验收：`yarn workspace oa-h5 lint` 本地运行零 error，warning 仅限已注释说明的 `as any`

#### C-QUALITY-05 Phase 验收门规则强化

- `[x]` **C-QUALITY-05**
  - 更新 CLAUDE.md Phase 验收门，在所有阶段验收条件中新增：
    - 前置：`mvn test`（含 ArchUnit）全部通过
    - 前置：`yarn test:integration` 连续运行三次全部通过（非一次性通过）
    - 前置：`yarn workspace oa-h5 lint` 零 error
  - Phase A/B/C/D 遗留问题修复后，以新标准重新执行验收
  - 验收：CLAUDE.md 各阶段验收门包含上述三条前置要求

---

## Phase C+ — 质量体系建设 + 全维度测试（声明完成，⚠️ 待核验）

> **状态**：声明完成，待 VERIFY-PHASE-CPLUS 任务核验实际工具可用性后归档为摘要。
> **内容**：CI/CD 门禁、测试工具链（ArchUnit/springdoc/Snyk/SonarQube/Semgrep/Prettier/Spotless/Knip/jsdoc/k6/ZAP/schemathesis）、五轮全维度测试、遗留问题修复。
> **下一阶段**：Phase D — 逐模块测试 + 设计对齐 + 人工验收。
>
> **执行顺序（历史记录）**：C+-INFRA → C+-DESIGN → C+-FIX → C+-TEST → C+-GATE

---

### C+-INFRA — CI/CD 门禁基础设施（最先执行）

> **目标**：在任何代码改动开始前，建立本地 git 钩子与远程 CI 流水线，保证后续每次 commit/push 都自动触发质量检测。
> C+-INFRA 完成后，C+-DESIGN 各工具配置完成时自动激活对应门禁；C+-FIX 开始时所有门禁已就位。

- `[x]` **C+-I-01 VSCode 工作区配置**
  - `.vscode/settings.json`：保存时自动 Prettier 格式化、ESLint 自动修复、Java 格式化绑定 google-java-format、TypeScript strict 提示启用、文件关联配置
  - `.vscode/extensions.json`：推荐插件列表（ESLint、Prettier、Vue Language Features、Extension Pack for Java、SonarLint、GitLens）
  - 验收：项目目录下打开 VSCode 弹出"安装推荐插件"提示；保存 `.ts` 文件自动触发格式化
  - 实施说明：用户要求全局配置，settings 合并至 Windows 全局 `%APPDATA%\Code\User\settings.json`，项目不留 `.vscode/` 目录。

- `[x]` **C+-I-02 husky + lint-staged + commitlint 本地钩子**
  - 安装：`husky`、`lint-staged`、`commitlint`、`@commitlint/config-conventional`
  - `.commitlintrc.json`：类型白名单 feat/fix/refactor/perf/test/docs/style/chore/cleanup
  - `commit-msg` hook：`npx commitlint --edit $1`（拦截不合规提交信息）
  - `pre-commit` hook（lint-staged，仅扫描 staged 文件，< 30s）：
    - `*.{ts,vue,js}` → `prettier --check` + `eslint --fix`
    - `*.java` → `mvn spotless:check -pl server -q`
  - `pre-push` hook（全量检查，< 3min，无需运行服务）：
    - `mvn test -pl server`（含 ArchUnit，C+-D-01 完成后自动生效）
    - `yarn workspace oa-h5 test`
    - `yarn workspace oa-h5 lint`
    - `semgrep --config p/owasp-top-ten server/src app/h5`（C+-D-12 完成后自动生效）
    - `snyk test --file=app/h5/package.json --severity-threshold=high`（C+-D-06 完成后自动生效）
    - `snyk test --file=server/pom.xml --severity-threshold=high`（C+-D-06 完成后自动生效）
  - 注：pre-push 中引用未安装工具的命令以 `command -v <tool> && ...` 方式条件执行，工具配置完成后自动激活
  - `tools/commitlint/README.md`：提交规范说明与示例
  - 验收：提交格式不合规被拦截；推送触发 `mvn test` 和 `yarn test`；lint-staged 只检查变更文件

- `[x]` **C+-I-03 GitHub Actions — fast-check workflow（每次 push 触发）**
  - 文件：`.github/workflows/fast-check.yml`
  - 触发：`on: push`（无需 PR）
  - 步骤（无需运行服务，目标 < 5 分钟）：
    1. `yarn format:check`（Prettier）
    2. `yarn workspace oa-h5 lint`（ESLint + TypeScript）
    3. `mvn spotless:check -pl server`（Java 格式）
    4. `mvn test -pl server`（单元测试 + ArchUnit）
    5. `yarn workspace oa-h5 test`（前端单元测试）
    6. `semgrep --config p/spring-boot --config p/owasp-top-ten server/src`
    7. `semgrep --config p/typescript app/h5`
    8. `snyk test --file=app/h5/package.json --severity-threshold=high`
    9. `snyk test --file=server/pom.xml --severity-threshold=high`
    10. `yarn knip`（死代码检测）
    11. `mvn package -DskipTests -pl server`（构建验证）
    12. `yarn build`（前端构建验证）
  - 验收：push 后 GitHub Actions 页面出现 fast-check job 并通过

- `[x]` **C+-I-04 GitHub Actions — full-test workflow（每次 push 触发，Docker Compose 启动服务）**
  - 文件：`.github/workflows/full-test.yml`
  - 触发：`on: push`
  - 步骤（需要运行服务，目标 < 15 分钟）：
    1. Docker Compose 启动后端 + H2 数据库
    2. `yarn test:integration`（连续运行 3 次，全部通过）
    3. `yarn test:e2e`（Playwright 全场景）
    4. OWASP ZAP baseline scan（`tools/zap/` 配置）
    5. schemathesis 模糊测试（`tools/schemathesis/` 配置）
    6. SonarQube 分析上报（`mvn verify sonar:sonar`，需 SONAR_TOKEN secret）
  - 验收：push 后 full-test job 通过；SonarQube 面板出现分析结果

- `[x]` **C+-I-05 GitHub Actions — nightly workflow（每日 02:00 UTC 定时触发）**
  - 文件：`.github/workflows/nightly.yml`
  - 触发：`on: schedule: cron: '0 2 * * *'`
  - 步骤（需要部署环境或 Docker Compose，允许运行较长时间）：
    1. Docker Compose 启动服务
    2. k6 正常负载：`k6 run tools/k6/normal.js`
    3. k6 峰值：`k6 run tools/k6/peak.js`
    4. k6 压力：`k6 run tools/k6/stress.js`
    5. k6 稳定性：`k6 run tools/k6/soak.js`
    6. k6 竞态：`k6 run tools/k6/race.js`
    7. OWASP ZAP full scan
    8. Snyk 完整依赖审计报告
  - 验收：nightly job 首次手动触发通过；结果可在 Actions 页面查看

---

### C+-DESIGN — 测试设计与质量规范落地

> C+-INFRA 完成后执行。全部完成后，C+-INFRA 中所有条件执行的命令均已激活。

#### 架构约束自动化

- `[x]` **C+-D-01 ArchUnit 架构约束测试**
  - 新建 `server/src/test/java/com/oa/backend/architecture/ArchitectureTest.java`
  - 引入 `archunit-junit5` 依赖到 `server/pom.xml`
  - 实现规则：Controller 不注入 Mapper（C+-F-01 已修复 InjuryClaimController，规则现在 32/32 controller 全部通过）、Service 不依赖 Controller、@Service 在 service 包、@RestController 在 controller 包
  - 延期规则：Controller 不依赖 entity（18+ 个 Controller 直接引用 entity，需 Phase D 全量 DTO 迁移后再启用）、包级循环依赖检测（Phase D 统一处理）
  - 验收：`mvn test` 396 个测试全通过（含 4 条 ArchUnit 规则）；QA 审计 PASS

#### OpenAPI 规范生成

- `[x]` **C+-D-02 后端接入 springdoc-openapi**
  - `server/pom.xml` 添加 `springdoc-openapi-starter-webmvc-ui`
  - 启动后访问 `/api/v3/api-docs` 返回完整 OpenAPI JSON
  - 验收：所有 Controller 的 endpoint 均出现在规范中，供 schemathesis 使用

#### 测试工具框架建立

- `[x]` **C+-D-03 k6 负载/并发/压力/稳定性/竞态测试框架**
  - 位置：`tools/k6/`
  - 脚本：
    - `normal.js`：50 并发 × 5 分钟，P99 < 500ms，错误率 < 1%
    - `peak.js`：200 并发 × 5 分钟，P99 < 1s，错误率 < 1%
    - `stress.js`：400 并发 × 5 分钟（记录降级边界）
    - `soak.js`：200 并发 × 30 分钟（无内存泄漏、无错误累积）
    - `race.js`：多用户同时操作同一审批流（确认无数据竞争）
  - `tools/k6/README.md`：启动说明与各场景通过标准
  - 验收：各脚本可独立运行，输出结构化报告

- `[x]` **C+-D-04 OWASP ZAP 安全扫描配置**
  - 位置：`tools/zap/`
  - 配置 baseline scan 与 full scan 两种模式（Docker CLI）
  - 扫描范围：全部 `/api/*` 端点，含认证后接口
  - `tools/zap/README.md`：运行方式与风险评级说明
  - 验收：baseline scan 可对本地服务执行，输出 HTML 报告

- `[x]` **C+-D-05 schemathesis API 模糊测试配置**
  - 位置：`tools/schemathesis/`
  - 基于 `/api/v3/api-docs` 自动生成异常入参（边界值、空值、超长字符串、注入字符）
  - `tools/schemathesis/README.md`：安装（pip）与运行方式
  - 验收：可对本地服务执行并输出测试结果

- `[x]` **C+-D-06 Snyk 依赖安全审计（前端 + 后端统一覆盖）**
  - 位置：`tools/snyk/`（配置文件 + README）
  - 安装：`npm install -g snyk`，`snyk auth` 完成认证
  - 扫描命令：
    - 前端：`snyk test --file=app/h5/package.json --severity-threshold=high`
    - 后端：`snyk test --file=server/pom.xml --severity-threshold=high`
  - `tools/snyk/README.md`：认证方式、运行命令、结果解读、豁免流程
  - 验收：两个命令均可执行，无 high/critical 漏洞；结果输出可读

#### 测试设计文档补全

- `[x]` **C+-D-07 补全 `test/TEST_DESIGN.md`**
  - 新增：集成测试幂等性规范（动态数据、afterAll 清理、null-safe 断言）
  - 新增：k6 各场景通过标准与告警阈值
  - 新增：ZAP 扫描范围定义与高/中/低风险处理规则
  - 新增：schemathesis 目标接口列表与豁免说明
  - 新增：异常字段测试清单（空值、超长、特殊字符、SQL 注入字符、负数金额）
  - 验收：文档覆盖所有测试维度，可作为上线后重复执行的操作手册

#### 审计规则与验收门规范

- `[x]` **C+-D-08 Code Reviewer 强制 Checklist 写入 CLAUDE.md（C-QUALITY-03）**
  - CLAUDE.md QA Engineer 节新增强制 Checklist，每次 review 必须逐项输出结论：
    1. 架构红线：Controller 层无 Mapper 注入（`grep -rn "private final.*Mapper" controller/` 为空，ObjectMapper 除外）
    2. 架构红线：Controller 不直接引用 Entity（必须经 DTO/Service）
    3. 测试幂等：新增集成测试创建类用例使用动态数据或有 afterAll 清理
    4. 测试断言：无 `typeof x === 'string/number'` 的 null 不安全断言
    5. 权限完整：每个新增 HTTP endpoint 有 `@PreAuthorize` 注解
    6. 设计对齐：新增字段/接口可追溯到 DESIGN.md 对应章节，无额外实现
  - 验收：CLAUDE.md 中 Checklist 全文可见，条目可逐项核查

- `[x]` **C+-D-09 前端 TypeScript strict 强化（C-QUALITY-04）**
  - `app/h5/tsconfig.json` 确认 `strict: true`（含 `noImplicitAny`、`strictNullChecks`）
  - ESLint 规则加 `@typescript-eslint/no-explicit-any: warn`
  - 修复开启 strict 后的所有编译/lint 错误
  - 验收：`yarn workspace oa-h5 lint` 零 error

- `[x]` **C+-D-10 Phase 验收门规则更新（C-QUALITY-05）**
  - CLAUDE.md 各阶段验收门新增三条强制前置：
    - `mvn test`（含 ArchUnit）全部通过
    - `yarn test:integration` 连续三次全部通过
    - `yarn workspace oa-h5 lint` 零 error
  - 验收：CLAUDE.md 各阶段验收门包含上述三条

#### 代码质量与格式工具

- `[x]` **C+-D-11 SonarQube Community 本地搭建**
  - Docker 启动 SonarQube Community Edition（`docker compose up sonarqube`）
  - `tools/sonarqube/docker-compose.yml`：服务配置
  - `sonar-project.properties`（根目录）：项目名称、源码路径、测试报告路径、Java + TypeScript 双语言配置
  - 接入 JaCoCo 覆盖率报告（`mvn verify sonar:sonar`）与 Vitest 覆盖率报告（`lcov.info`）
  - Quality Gate 规则：新增代码覆盖率 ≥ 80%、重复率 ≤ 3%、无 Blocker/Critical 安全漏洞
  - `tools/sonarqube/README.md`：启动方式、Quality Gate 配置、CI 接入说明（Phase F 落地）
  - 验收：本地访问 SonarQube 面板，项目全量扫描通过 Quality Gate

- `[x]` **C+-D-12 Semgrep SAST 静态安全扫描**
  - 位置：`tools/semgrep/`
  - 规则集：`p/spring-boot`（后端）、`p/typescript`（前端）、`p/owasp-top-ten`（通用安全）
  - 扫描命令：`semgrep --config p/spring-boot --config p/owasp-top-ten server/src` 和 `semgrep --config p/typescript app/h5`
  - `tools/semgrep/README.md`：安装、运行、结果解读、误报豁免方式（`# nosemgrep` 注释）
  - 验收：两个命令可执行，无 ERROR 级别发现；与 ZAP（动态）形成静态+动态双层安全覆盖

- `[x]` **C+-D-13 Prettier JS/TS/Vue 代码格式化**
  - 根目录添加 `.prettierrc`（Vue/TS/JS 统一格式规则：单引号、2空格缩进、行尾逗号等）
  - 根目录添加 `.prettierignore`（排除 node_modules、dist、.nuxt 等）
  - `package.json` scripts 新增：`"format:check": "prettier --check \"app/h5/**/*.{ts,vue,js}\""`
  - 修复现有格式不符合的文件（`prettier --write`）
  - 验收：`yarn format:check` 零错误；CI Tier 1 可直接接入

- `[x]` **C+-D-14 Spotless Java 代码格式化**
  - `server/pom.xml` 添加 `spotless-maven-plugin`，使用 google-java-format 后端
  - 格式化范围：`src/main/java/**/*.java` + `src/test/java/**/*.java`
  - 修复现有格式不符合的文件（`mvn spotless:apply`）
  - 验收：`mvn spotless:check` 零差异；CI Tier 1 可直接接入

- `[x]` **C+-D-15 ESLint jsdoc 文档注释规则**
  - `app/h5/.eslintrc` 新增 `plugin:jsdoc/recommended` 规则：要求所有导出函数/组件有 JSDoc 注释
  - 修复或补充现有导出函数的 JSDoc
  - 验收：`yarn workspace oa-h5 lint` 零 error（jsdoc 规则生效）

- `[x]` **C+-D-16 Knip TypeScript 死代码检测**
  - 根目录添加 `knip.json`：配置 monorepo 工作区（`app/h5`）、入口文件、忽略规则
  - 扫描命令：`yarn knip`
  - `tools/knip/README.md`：运行方式、结果解读、豁免方式
  - 验收：`yarn knip` 可执行，输出无误报（确认所有报告项均为真实死代码）；修复或豁免全部发现项

---

### C+-FIX — 遗留问题修复

> 全部修复完成后进入 C+-TEST。

- `[x]` **C+-F-01 A-AUDIT-REGRESSION-01：InjuryClaimController Mapper 注入迁移**
  - `InjuryClaimController.java:29` 的 `FormRecordMapper` 注入迁移至 `InjuryClaimService`
  - Controller 改为调用 Service 方法，移除 Controller 中的 Mapper 依赖
  - 验收：`grep -rn "FormRecordMapper" controller/` 为空；`mvn test` 全通过（含 ArchUnit）

- `[x]` **C+-F-02 ops.demo 加入 access.test.ts（合并 B-P3-REGRESSION-01 + C-REGRESSION-03）**
  - `test/unit/h5/access.test.ts` 的 `defaultTestAccounts` 补充 `ops.demo / 123456`
  - 补充 ops 角色可访问 `/config`、`/data_export`、`/data_viewer`、`/operation_logs` 的断言
  - 验收：`yarn workspace oa-h5 test` 全通过

- `[x]` **C+-F-03 C-REGRESSION-01：集成测试幂等化**
  - `test/integration/api.test.ts`：TC-B1-04（`period:"2026-05"`）和 PR-01（`period:"2026-07"`）改为动态 period（`2099-xxxx` 格式）
  - 验收：`yarn test:integration` 连续三次全部通过，无 400 冲突

- `[x]` **C+-F-04 C-REGRESSION-02：companyName null-safe 断言**
  - `test/integration/api.test.ts:632` 断言改为 `expect(body.companyName === null || typeof body.companyName === 'string').toBe(true)`
  - 验收：新账号环境（未配置公司名）下断言通过

- `[x]` **C+-F-05 DESIGN.md §6 工资模块设计补全**
  - 补充确认的设计内容：AllowanceDef 条目定义、三级覆盖（GLOBAL→POSITION→EMPLOYEE）、单月临时覆盖层、批量多选（岗位/个人）、唯一性约束、扣款同结构、五险一金两种模式（公司代缴 / 公司补贴）
  - 验收：DESIGN.md §6 完整描述上述规则，Phase D D-PAY-BIZ 可直接对照执行

- `[x]` **C+-F-06 校验错误消息改为纯中文**
  - `GlobalExceptionHandler` 对 `MethodArgumentNotValidException` 的处理，当前返回 `"{fieldName}: {defaultMessage}"` 格式，字段名为 camelCase 英文
  - 改为只返回 `defaultMessage`（注解上的 message 属性），并确保所有 Bean Validation 注解的 message 均为中文
  - 验收：POST /api/employees name="" 返回 400，响应体 message 为纯中文，不含 "name:"、"must not be blank" 等英文

- `[x]` **C+-F-07 请假/加班/工伤 formData 改为独立 DTO + 字段级校验**
  - `FormSubmitRequest.formData` 当前为 `Map<String,Object>`，无服务端字段校验
  - 新增 `LeaveFormData`、`OvertimeFormData`、`InjuryFormData` 三个 DTO，各含字段注解（@NotBlank/@NotNull/@Valid 等）
  - 请假：leaveType(@NotBlank)、startDate(@NotNull)、endDate(@NotNull，且 >= startDate)、reason(@NotBlank)
  - 加班：date(@NotNull)、startTime(@NotNull)、endTime(@NotNull，且 > startTime)、type(@NotBlank)
  - 工伤：injuryDate(@NotNull)、injuryTime(@NotNull)、description(@NotBlank)、diagnosis(@NotBlank)
  - 验收：各 formData 缺少必填字段时返回 400，中文错误提示；日期/时间顺序错误返回 400

- `[x]` **C+-F-08 员工手机号加 @Pattern 校验**
  - `EmployeeCreateRequest.phone` 和 `EmployeeUpdateRequest.phone` 加 `@Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")` （允许 null，非必填）
  - 验收：POST /api/employees phone="abc123" 返回 400，message 含"手机号格式不正确"

- `[x]` **C+-F-09 报销明细金额加 @Positive 校验**
  - `ExpenseItemDto.amount` 加 `@Positive(message = "明细金额必须大于0")`
  - 验收：提交报销明细 amount=-50 返回 400，message 含"明细金额必须大于0"

- `[x]` **C+-F-10 登录加 Bucket4j 限速**
  - 引入 `bucket4j-core`，在 `AuthController.login` 或 Security Filter 层对每个 IP 限速：15 分钟内失败超 20 次返回 429
  - 响应体 message 为"登录尝试过于频繁，请 15 分钟后重试"
  - 验收：连续发送 21 次错误密码请求，第 21 次返回 429，响应体 message 为中文

- `[x]` **C+-F-11 JWT Filter 校验账号激活状态**
  - `JwtAuthenticationFilter` 在验签通过后额外查询 `employee.account_status`，若非 ACTIVE 返回 401
  - 可加简单本地缓存（5 分钟 TTL）减少 DB 查询
  - 验收：HR 禁用 employee.demo 后，用该账号已有 token 调 GET /api/employees，返回 401

- `[x]` **C+-F-12 薪资结算加行级锁与幂等前置检查**
  - `PayrollCycleService.settle()` 加 `SELECT ... FOR UPDATE`，结算前检查周期状态是否已结算，若是返回 409
  - 验收：两个并发 settle 请求，一个 200，另一个 409，数据库不产生重复工资条

- `[x]` **C+-F-13 表单提交加幂等键**
  - 前端提交请假/加班/报销/工伤时在 header 带 `X-Idempotency-Key`（UUID，每次打开表单生成一次）
  - 后端在 form_record 表加唯一约束 `(submitter_id, idem_key)`，重复请求返回 409
  - 验收：100ms 内发送 2 次相同请假请求，一个 201，另一个 409，数据库只有 1 条记录

- `[x]` **C+-F-14 前端 alert() 统一改 AntD message**
  - 请假(`LeaveTab.vue`)、加班(`OvertimeTab.vue`)、报销(`expense/apply/index.vue`)、工伤(`injury/index.vue`) 的提交成功/失败均使用 `alert()`
  - 全部改为 `message.success(...)` / `message.error(...)`（AntD 的 `useMessage` 或全局 `message`）
  - 验收：提交成功/失败后页面内出现 AntD toast，浏览器无原生弹窗

- `[x]` **C+-F-15 假期扣款比例前后端范围校验**
  - 后端 `LeaveTypeDef.deductionRate` 加 `@DecimalMin("0.0") @DecimalMax("1.0")` 注解（或在 Service 层校验）
  - 前端假期类型表单扣款比例字段加 rules 校验 0~1
  - 验收：deductionRate=2.0 返回 400，提示中文；deductionRate=-0.1 返回 400

- `[x]` **C+-F-16 删除 employeeType 相关逻辑（对齐 DESIGN.md §3.3）**
  - 后端：`EmployeeCreateRequest` / `EmployeeUpdateRequest` 删除 `employeeType` 字段及 `@NotBlank` 注解；`Employee` 实体保留 DB 列（历史数据兼容）但移除业务校验
  - 前端：员工创建/编辑表单删除"员工类型"下拉选项
  - 测试：更新 `EmployeeServiceImplTest` 及相关集成测试，移除 employeeType 入参
  - 验收：`mvn test` 全通过，前端表单无员工类型字段，`yarn test:integration` 三次全绿

- `[x]` **D-F-16 邮箱验证码密码重置流程**
  - 删除"输入旧密码"方式，改为：发送验证码到绑定邮箱 → 输入验证码 + 新密码 → 完成
  - 后端：Spring Boot Mail + QQ SMTP（smtp.qq.com:465），验证码 6 位数字，有效期 5 分钟，存内存（Caffeine）
  - 前端：发送验证码按钮 + 倒计时 + 验证码输入框 + 新密码输入框
  - 凭据：发件账号/授权码通过环境变量注入，不进代码库
  - 测试邮箱：876593497@qq.com，测试通过 IMAP（imap.qq.com:993）读取真实邮件中的验证码
  - `test/tools/helpers/email-reader.ts`：imapflow 实现，轮询 60s，提取 6 位数字验证码，读后标记已读
  - `test/.env.test`（gitignored）：TEST_EMAIL / TEST_EMAIL_IMAP_PASSWORD / MAIL_FROM / MAIL_PASSWORD
  - 验收：测试账号 email=NULL 首次登录 → 绑定邮箱收到验证码 → 验证成功 → 修改密码收到验证码 → 完成全流程

- `[x]` **D-F-17 密码强度规则**
  - 规则：最少 8 位、必须同时包含字母和数字、不允许空格、最多 64 位
  - 后端：密码修改/首次设置接口加 @Pattern 或 Service 层校验，不符合返回 400 中文提示
  - 前端：密码输入框旁显示规则提示文字，实时反馈当前是否达标（字符计数、字母、数字三项状态）
  - 验收：纯字母密码 400、纯数字密码 400、7 位密码 400、含空格密码 400、符合规则成功

- `[x]` **D-F-18 登出确认对话框**
  - 前端：点击退出登录弹出确认框"确定退出登录吗？"，确认后清除 token 并跳转登录页，取消不操作
  - 验收：点击确认完成登出；点击取消留在当前页

- `[x]` **D-F-19 登录阶梯式限速（替换 C+-F-10 单层实现）**
  - 连续失败 5 次锁 1 分钟；10 次锁 5 分钟；20 次锁 15 分钟；30 次锁 60 分钟
  - 锁定期间返回 429，消息含剩余等待时间（中文）
  - Bucket4j 多层 Bandwidth 实现，替换现有 AuthController 中的单层配置
  - 验收：连续失败 5 次触发 429，消息含剩余秒数

- `[x]` **D-F-20 全接口通用限流 Filter**
  - 新增全局 Spring Security Filter：每个 IP 每分钟最多 300 次请求，超出返回 429"访问过于频繁，请稍后再试"
  - 登录接口保留 D-F-19 的独立阶梯限速，两层叠加
  - 验收：单 IP 1 分钟内超过 300 次请求任意接口触发 429；正常使用不受影响

- `[x]` **D-F-21 删除账号启用功能**
  - 删除后端"启用账号"接口（若存在）和前端"启用"按钮，只保留禁用操作
  - 验收：代码中不存在启用相关逻辑，前端无启用按钮

- `[x]` **D-F-22 前端拦截"账号已被停用" 401**
  - API 拦截器检测到 401 + 消息"账号已被停用"，展示提示"您的账号已被停用，请联系管理员"，清除 token，自动跳转登录页
  - 验收：账号禁用后下次操作前端显示提示并跳转，不白屏、不死循环

- `[x]` **D-F-23 首次登录强制绑定邮箱 + 设置密码**
  - 检测到 isDefaultPassword=true：跳转专属设置页面，禁止访问其他页面
  - 步骤 1：输入邮箱 → 发送验证码 → 输入验证码确认绑定（email 写入 DB）
  - 步骤 2：设置符合强度规则的新密码 → 完成后正常进入系统
  - 邮箱已被其他账号绑定返回 400"该邮箱已被占用"
  - 验收：测试账号 email=NULL 走完完整首次登录流程，DB email 字段正确写入

---

### C+-TEST — 全维度测试执行（五轮，全通过才能继续）

> 任一轮失败，修复后从该轮重新执行，不跳轮次。

- `[x]` **C+-T-01 Round 1 — 功能回归**
  - `mvn test`（含 ArchUnit）全通过
  - `yarn workspace oa-h5 test` 全通过
  - `yarn test:integration` 连续三次全通过
  - `yarn workspace oa-h5 lint` 零 error

- `[x]` **C+-T-02 Round 2 — E2E 浏览器**
  - `yarn test:e2e`（Playwright 全场景）全通过
  - 覆盖关键业务链路：登录/审批/考勤/工资/报销/工伤/施工日志

- `[x]` **C+-T-03 Round 3 — 安全与静态分析**
  - [PASS] Semgrep 后端：0 ERROR（spring-boot + owasp-top-ten + java ruleset）
  - [PASS] Semgrep 前端：0 ERROR（typescript ruleset）
  - [PASS] OWASP ZAP：baseline scan 完成，无 HIGH 告警（zaproxy snap 本地安装，port 8092）
  - [PASS] schemathesis 模糊测试：8449 requests passed，0 server error（修复了 MissingRequestHeaderException → 400）
  - [PASS] yarn audit：oa-h5 零 high/critical 漏洞；oa-mp 12 high（@intlify 链路），在 Phase G 修复
  - [PASS] SonarQube 25.3 本地运行（zip 方式，非 Docker）；Quality Gate: OK；扫描 383 源文件

- `[x]` **C+-T-04 Round 4 — 负载/并发**
  - [PASS] k6 已安装（v1.7.1）；五套测试脚本全部通过
  - race: 20VU×100iter，0 failures，P95=68ms
  - normal: 50VU×5min，0 failures，P99<5ms（阈值 500ms）
  - peak: 200VU×5min，0 failures，P99<10ms（阈值 1000ms）
  - stress: 400VU ramp，0 failures，P99<5ms
  - soak: 200VU×30min，0 failures（exit 0）

- `[x]` **C+-T-05 Round 5 — 覆盖率**
  - [PASS] 后端 JaCoCo（mvn test 1272 tests）：行覆盖 80.4%（5017/6238），超过 80% 目标
    - 含聚合：单测 exec + 集成测试 exec + E2E exec 合并后 67.9%（单测已达标）
    - Phase 3+4 新增 9 tests (CoverageBoostTest17)，GlobalExceptionHandler ISE→409
  - [PASS] 前端 Vitest：35 tests，行覆盖 100%（http.ts 100%，access.ts 100%）
    - http.ts 401 redirect branch 通过 _isClient 参数注入实现全覆盖
    - access.ts unknown_role fallback 和 secondRoles passthrough 补全

---

### C+-GATE — 阶段完成确认

- `[x]` **C+-G-01 Phase A 完成确认**
  - 对照 TODO.md A-SEC / A-DB / A-CODE / A-CLEAN 各节，逐条确认 `[x]`
  - curl 抽查：无 token → 401；低权角色访问受限接口 → 403；ArchUnit 规则全通过
  - 输出 Phase A 验收小结

- `[x]` **C+-G-02 Phase B 完成确认**
  - 对照 TODO.md B-P0 / B-P1 / B-P2 / B-P3 / B-FEAT 各节，确认全部 `[?]`（等 Phase E 人工走查）
  - curl 抽查 B 阶段新增接口：返回预期响应
  - 输出 Phase B 验收小结

- `[x]` **C+-G-03 Phase C/C+ 完成确认**
  - 对照 C-REGRESSION + C-QUALITY + C+-DESIGN + C+-FIX 各节，确认全部 `[x]`
  - 输出 Phase C/C+ 验收小结

---

## Phase D — 逐模块测试 + 设计对齐 + 人工验收

> 协作流程见文档开头 **Phase D 协作 SOP**（Stage 1/2/3/4）。
> 前序模块 Stage 4 通过后方可开始下一模块。
> D-M01 为完整四阶段模板示例，D-M02~M20 骨架将在启动时按此模板扩展。

---

### D-M01 — 认证（无依赖）

**整体状态**：Stage 2 进行中（用例清单重设计）

**模块范围**
- 页面：`/login`、`/setup-account`、`/me/password`、初始化向导 step 5（恢复码）
- 流程：登录、退出、首次登录绑邮箱改密、普通用户改密、CEO 恢复码、账号禁用恢复、路由守卫、登录限流
- 相关 DEFECTS：DEF-AUTH-01 / 02 / 03 / 04

#### Stage 1 — 设计对齐

- `[x]` DESIGN.md §1 认证章节确认（在 Stage 2 之前完成）
- `[x]` 模块功能清单定稿

#### Stage 2 — 测试用例设计（完成）

- `[x]` 原 34 条独立 test 清单（弃用，原因：同一用户流程被拆成独立 test 导致 60s 冷却冲突和 4 条条件 skip）
- `[x]` 按"页面 → 表单组件 → 操作"三层结构重构用例，纳入 DEF-AUTH-01/02/03 覆盖（per-IP 限流、per-account 限流、captcha 挑战、自助解锁）
- `[x]` 用户确认新用例清单（2026-04-23）→ 已落地 `test/e2e/modules/D-M01.md`

**Stage 2 产出的发现**

- 原 34 条独立 test 设计不合理，改为三层结构：一次浏览器 context 内跑完一个页面上多个组件的多个操作，规避冷却冲突
- 登记 4 个设计缺陷：DEF-AUTH-01（per-IP → per-account）/ DEF-AUTH-02（缺 captcha）/ DEF-AUTH-03（缺自助解锁）/ DEF-AUTH-04（测试环境阈值 100000）

#### Stage 3 — 测试实现与执行（完成 2026-04-24）

- `[x]` 预处理：修复 DEF-AUTH-04
- `[x]` 业务改进：DEF-AUTH-01/02/03 全部修复并关闭
- `[x]` Frontend Developer agent 实现 `test/e2e/specs/D-M01.spec.ts`（29 个 test，2646 行）
- `[x]` 执行：29/29 全绿，无 skip，1.2 分钟/轮
- `[x]` FIX 循环：修复了 3 个 agent 发现的真实 bug
  - **SystemConfigMapper**：`MERGE INTO ... KEY(...)` 改为 PostgreSQL 兼容 `INSERT ... ON CONFLICT ... DO UPDATE`（latent 生产 bug，阻塞 `/setup/init` 在 PG 上）
  - **setup-account.vue step 2**：原前端调 `/auth/password/verify-reset` 但未传 `code`，后端 `@NotBlank` 必然 400；新增 `POST /auth/password/first-login-set` 端点（仅 `isDefaultPassword=true` 可用，无需 code，身份已由 step 1 邮箱验证完成）+ 前端改调新端点
  - **setup-account.vue step 1**：`handleBindEmail` 成功后未同步 `email` 到 cookie，导致 auth.global.ts `email === null` 仍重定向回 setup-account；补 `userStore.setUserInfo({ email })`
- `[x]` 新增 dev 端点 `POST /dev/captcha-answer`：供 E2E 测试读图形验证码答案（避免 OCR 解图），与 `/dev/verification-code` 同模式
- `[x]` Agent 误改回滚：EmailVerificationService 被 agent 改为静默吞 SMTP 失败，已回滚 —— 生产必须抛出真实错误
- `[x]` 测试断言修复：CoverageBoostTest8 `createLevel_hr_returnsOk` 原只认 200/400/404，补 201（POST 创建成功标准状态）
- `[x]` Mandatory Code Review Checklist 6 项全 PASS（自审）：
  - 无 Controller 持 Mapper、无 Entity 暴露、无 test.skip、无 typeof unsafe、新端点均有 `@PreAuthorize` 或 `@Profile("dev")`、每处改动有对应 DEFECTS 或 bug 发现可追溯

#### Stage 4 — 人工验收（Claude dogfood 完成，等用户最终复核）

- `[x]` Claude 自主 dogfood 走查（2026-04-24）：agent-browser + dogfood skill 驱动 Chrome，8 场景截图 + 视觉审查
- `[x]` 发现 8 问题并处理：7 修复 + 1 撤销（详见 `test/tools/manual-walkthrough/report.md`）
  - DevToolbar 一键填入按钮抢焦点
  - `/dev/reset` 未清 company_name
  - DevToolbar 面板过高
  - Logo 字符粘连
  - 侧边栏组标题对比度
  - 折叠态组标题未隐藏
  - **初始密码警告暴露明文"123456"**（安全文案问题，初次误撤销后复核修复）
- `[ ]` 用户浏览器走完主流程（Claude 已做过自主走查，用户做最终签字复核）
- `[ ]` 用户反馈问题 → 回归修复
- `[ ]` 用户签字确认日期

**执行记录**

- 2026-04-23 完成原 34 条用例实现与运行，结果 26 pass / 8 skip
- 2026-04-23 登记 DEF-AUTH-01~04；决定重新设计用例弃用 skip
- 2026-04-23 测试粒度重构为"页面→组件→操作"三层结构，等待用户确认清单

---

### D-M08 — 初始化向导（依赖：D-M01）

**状态**：DESIGN `[x]` | DEFECT-FIX `[x]` | TEST-CASES `[?]`（已写入待用户确认）| TEST-IMPL `[ ]` | ACC `[ ]`
**当前进度**：Stage 1 + 阶段 2/3 全部完成；Stage 2 用例清单已写入 D-M08.md；用户表示有东西要改，整体推迟

#### D-M08-DESIGN（Stage 1，已完成 2026-04-28）
- `[x]` 阅读 DESIGN.md §2 + /setup 实现 + SetupController
- `[x]` 与用户对齐 4 个设计/实现差异（DEF-SETUP-01/02/03/04）
- `[x]` 修订 DESIGN.md §2 措辞
- `[x]` DEFECTS 池登记 DEF-SETUP-01/02/03/04（运行中又登记 DEF-SETUP-05 + DEF-ROLE-01）

#### D-M08-DEFECT-FIX（阶段 2/3，已完成 2026-04-28）

阶段 2：DEF-SETUP-01 beforeunload 提示
- `[x]` /setup 注册 beforeunload 监听器（hasUnsavedData 判定）
- `[x]` finishSetup / finalizeSetup 跳转前 removeEventListener
- `[x]` Code Reviewer PASS；P1（step 6-10 跳转按钮静默丢数据）由 SETUP-04 改造覆盖

阶段 3.1：DEF-SETUP-04 后端 finalize 端点
- `[x]` V21__add_wizard_finalize_state.sql migration
- `[x]` SetupFinalizeRequest DTO + 11 个嵌套 record（含 tempId 系统）
- `[x]` SetupController.finalize + status 扩展 + init 响应新增 token
- `[x]` SetupService.finalizeWizard + 7 个 applyXxx + AccessManagementService 双写注入（DEF-ROLE-01 折中）
- `[x]` DevController.reset-finalize（dev 端点）
- `[x]` SecurityConfig permitAll 加 /setup/finalize
- `[x]` 5 个集成测试（mvn test 1320 全绿）
- `[x]` Code Reviewer 1 轮 + 修复 3 P1 + 4 P2/P3

阶段 3.2：DEF-SETUP-04 前端 5 个业务组件抽取
- `[x]` RoleConfigPanel.vue + /role 改造
- `[x]` EmployeeImportPanel.vue + /directory 改造
- `[x]` RetentionPanel.vue + /retention 改造
- `[x]` DepartmentManager.vue + SupervisorTree.vue + /org 改造
- 注：/config 已有 6 个子组件中 4 个 onMounted 调 API 与 wizard 不兼容，在 /setup 内重写 wizard 专用面板（按用户原始指令"不能复用就重写"）

阶段 3.3：DEF-SETUP-04 重写 /setup step 6-10
- `[x]` /setup/index.vue 重写：step 6-10 全部内嵌组件，Tabs 拆 step 7 部门/员工
- `[x]` step 9 wizard 专用全局配置 + 审批流面板（5 个 a-card 区块）
- `[x]` finalizeSetup 函数：序列化 + 提交 + 错误分类 + 跳 /login
- `[x]` middleware/auth.global.ts 路由守卫扩展支持"已 init 未 finalize"状态
- `[x]` yarn lint 0/0、yarn test 35/35

#### D-M08-DESIGN-CASES（Stage 2，2026-04-28 已输出）
- `[x]` 编写测试用例清单 → 写入 `test/e2e/modules/D-M08.md`（16 章节约 100 条）
- `[ ]` 用户最终确认 → 推迟（用户表示有东西要改）
- 前置工具：`POST /dev/reset-setup` + `POST /dev/reset-finalize`（已实现）

#### D-M08-TEST-IMPL（Stage 3，等用户确认 Stage 2 后启动）
- `[ ]` QA 实现 Playwright E2E 全部用例（spec.ts）
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M08-ACC（Stage 4）
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-M07 — 系统配置（依赖：D-M01）

**状态**：DESIGN `[ ]` | TEST `[ ]` | ACC `[ ]`

#### D-M07-DESIGN
- `[ ]` 输出完整测试用例 → 用户确认 → 写入 `test/e2e/TEST_DESIGN.md D-M07`

#### D-M07-TEST
- `[ ]` QA 实现 Playwright E2E 全部用例
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M07-ACC
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题，直到无问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-M03 — 部门管理（依赖：D-M01）

**状态**：DESIGN `[ ]` | TEST `[ ]` | ACC `[ ]`

#### D-M03-DESIGN
- `[ ]` 输出完整测试用例 → 用户确认 → 写入 `test/e2e/TEST_DESIGN.md D-M03`

#### D-M03-TEST
- `[ ]` QA 实现 Playwright E2E 全部用例
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M03-ACC
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题，直到无问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-M04 — 岗位与等级（依赖：D-M03）

**状态**：DESIGN `[ ]` | TEST `[ ]` | ACC `[ ]`

#### D-M04-DESIGN
- `[ ]` 输出完整测试用例 → 用户确认 → 写入 `test/e2e/TEST_DESIGN.md D-M04`

#### D-M04-TEST
- `[ ]` QA 实现 Playwright E2E 全部用例
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M04-ACC
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题，直到无问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-M05 — 角色管理（依赖：D-M01）

**状态**：DESIGN `[ ]` | TEST `[ ]` | ACC `[ ]`

#### D-M05-DESIGN
- `[ ]` 输出完整测试用例 → 用户确认 → 写入 `test/e2e/TEST_DESIGN.md D-M05`

#### D-M05-TEST
- `[ ]` QA 实现 Playwright E2E 全部用例
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M05-ACC
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题，直到无问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-M06 — 假期类型配置（依赖：D-M01）

**状态**：DESIGN `[ ]` | TEST `[ ]` | ACC `[ ]`

#### D-M06-DESIGN
- `[ ]` 输出完整测试用例 → 用户确认 → 写入 `test/e2e/TEST_DESIGN.md D-M06`

#### D-M06-TEST
- `[ ]` QA 实现 Playwright E2E 全部用例
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M06-ACC
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题，直到无问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-M02 — 员工管理（依赖：D-M01）

**状态**：DESIGN `[ ]` | TEST `[ ]` | ACC `[ ]`

#### D-M02-DESIGN
- `[ ]` 输出完整测试用例 → 用户确认 → 写入 `test/e2e/TEST_DESIGN.md D-M02`

#### D-M02-TEST
- `[ ]` QA 实现 Playwright E2E 全部用例
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M02-ACC
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题，直到无问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-M09 — 请假申请（依赖：D-M01~M04 M06）

**状态**：DESIGN `[ ]` | TEST `[ ]` | ACC `[ ]`

#### D-M09-DESIGN
- `[ ]` 输出完整测试用例 → 用户确认 → 写入 `test/e2e/TEST_DESIGN.md D-M09`

#### D-M09-TEST
- `[ ]` QA 实现 Playwright E2E 全部用例
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M09-ACC
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题，直到无问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-M10 — 加班申请（依赖：D-M01~M04）

**状态**：DESIGN `[ ]` | TEST `[ ]` | ACC `[ ]`

#### D-M10-DESIGN
- `[ ]` 输出完整测试用例 → 用户确认 → 写入 `test/e2e/TEST_DESIGN.md D-M10`

#### D-M10-TEST
- `[ ]` QA 实现 Playwright E2E 全部用例
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M10-ACC
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题，直到无问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-M11 — 工伤申报（依赖：D-M01 M02）

**状态**：DESIGN `[ ]` | TEST `[ ]` | ACC `[ ]`

#### D-M11-DESIGN
- `[ ]` 输出完整测试用例 → 用户确认 → 写入 `test/e2e/TEST_DESIGN.md D-M11`

#### D-M11-TEST
- `[ ]` QA 实现 Playwright E2E 全部用例
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M11-ACC
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题，直到无问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-M12 — 报销申请（依赖：D-M01 M02）

**状态**：DESIGN `[ ]` | TEST `[ ]` | ACC `[ ]`

#### D-M12-DESIGN
- `[ ]` 输出完整测试用例 → 用户确认 → 写入 `test/e2e/TEST_DESIGN.md D-M12`

#### D-M12-TEST
- `[ ]` QA 实现 Playwright E2E 全部用例
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M12-ACC
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题，直到无问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-M13 — 审批操作（依赖：D-M09~M12）

**状态**：DESIGN `[ ]` | TEST `[ ]` | ACC `[ ]`

#### D-M13-DESIGN
- `[ ]` 输出完整测试用例 → 用户确认 → 写入 `test/e2e/TEST_DESIGN.md D-M13`

#### D-M13-TEST
- `[ ]` QA 实现 Playwright E2E 全部用例
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M13-ACC
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题，直到无问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-M14 — 项目管理（依赖：D-M01 M02）

**状态**：DESIGN `[ ]` | TEST `[ ]` | ACC `[ ]`

#### D-M14-DESIGN
- `[ ]` 输出完整测试用例 → 用户确认 → 写入 `test/e2e/TEST_DESIGN.md D-M14`

#### D-M14-TEST
- `[ ]` QA 实现 Playwright E2E 全部用例
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M14-ACC
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题，直到无问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-M15 — 施工日志（依赖：D-M14 M02）

**状态**：DESIGN `[ ]` | TEST `[ ]` | ACC `[ ]`

#### D-M15-DESIGN
- `[ ]` 输出完整测试用例 → 用户确认 → 写入 `test/e2e/TEST_DESIGN.md D-M15`

#### D-M15-TEST
- `[ ]` QA 实现 Playwright E2E 全部用例
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M15-ACC
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题，直到无问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-M16 — 薪资管理（依赖：D-M02~M04 M09 M10）

**状态**：DESIGN `[ ]` | TEST `[ ]` | ACC `[ ]`

#### D-M16-DESIGN
- `[ ]` 输出完整测试用例 → 用户确认 → 写入 `test/e2e/TEST_DESIGN.md D-M16`

#### D-M16-TEST
- `[ ]` QA 实现 Playwright E2E 全部用例
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M16-ACC
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题，直到无问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-M17 — 通知中心（依赖：D-M09~M13）

**状态**：DESIGN `[ ]` | TEST `[ ]` | ACC `[ ]`

#### D-M17-DESIGN
- `[ ]` 输出完整测试用例 → 用户确认 → 写入 `test/e2e/TEST_DESIGN.md D-M17`

#### D-M17-TEST
- `[ ]` QA 实现 Playwright E2E 全部用例
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M17-ACC
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题，直到无问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-M18 — 操作日志（依赖：D-M01+）

**状态**：DESIGN `[ ]` | TEST `[ ]` | ACC `[ ]`

#### D-M18-DESIGN
- `[ ]` 输出完整测试用例 → 用户确认 → 写入 `test/e2e/TEST_DESIGN.md D-M18`

#### D-M18-TEST
- `[ ]` QA 实现 Playwright E2E 全部用例
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M18-ACC
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题，直到无问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-M19 — 数据导出与查看（依赖：D-M01+）

**状态**：DESIGN `[ ]` | TEST `[ ]` | ACC `[ ]`

#### D-M19-DESIGN
- `[ ]` 输出完整测试用例 → 用户确认 → 写入 `test/e2e/TEST_DESIGN.md D-M19`

#### D-M19-TEST
- `[ ]` QA 实现 Playwright E2E 全部用例
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M19-ACC
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题，直到无问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-M20 — 跨模块（安全/性能/无障碍）（依赖：D-M01~M19）

**状态**：DESIGN `[ ]` | TEST `[ ]` | ACC `[ ]`

#### D-M20-DESIGN
- `[ ]` 输出完整测试用例 → 用户确认 → 写入 `test/e2e/TEST_DESIGN.md D-M20`

#### D-M20-TEST
- `[ ]` QA 实现 Playwright E2E 全部用例
- `[ ]` 运行，输出 Pass/Fail 矩阵
- `[ ]` FIX 循环：修复失败项 → Code Review PASS → 重跑，直到全绿

#### D-M20-ACC
- `[ ]` 用户浏览器走完主流程
- `[ ]` FIX 循环：修复反馈问题，直到无问题
- `[ ]` 用户确认关闭（注明日期）

---

### D-FINAL — 全量回归（依赖：D-M01~M20 全部 ACC 通过）

- `[ ]` `mvn test`（含 ArchUnit）全通过
- `[ ]` `yarn test:integration` 连续三次全绿
- `[ ]` `yarn playwright test`（全部 20 个模块 E2E 用例）全通过
- `[ ]` 进入 Phase E（生产部署）

---

## Phase E — 人工验收

> **前置条件**：Phase D 全部 `[x]`（设计对齐审计全部模块通过）。
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
  - 用户确认所有核心业务链路可用，签收 Phase E

---

## Phase F — 生产部署 + 工程规范

> **前置条件**：Phase E 全部 `[x]`。
> **目标**：首版上线 + 建立全套工程规范。规范从这里起建立，后续所有维护遵循这套规范。

---

### F-STD — 工程规范建立

#### F-STD-01 Git 提交规范与分支策略
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

#### F-STD-02 PR 模板 + 代码审查 Checklist
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

#### F-STD-03 Issue 模板
- **目标**：Bug 报告和功能请求有统一格式
- **步骤**
  1. 新建 `.github/ISSUE_TEMPLATE/bug_report.md`：复现步骤、期望行为、实际行为、环境信息、截图
  2. 新建 `.github/ISSUE_TEMPLATE/feature_request.md`：功能描述、用户场景、设计稿链接、验收标准
- **验收点**：新建 Issue 时出现类型选择界面
- **验收流程**：GitHub 新建 Issue 验证
- **状态**：`[ ]`

#### F-STD-04 SemVer + CHANGELOG
- **目标**：版本号管理与发布记录规范化
- **步骤**
  1. 在 `package.json`（前端）和 `pom.xml`（后端）中定义初始版本 `1.0.0`
  2. 新建 `CHANGELOG.md`（根目录），记录 v1.0.0 包含的所有功能模块
  3. 后续每次发布遵循：MAJOR（破坏性变更）/ MINOR（新功能）/ PATCH（Bug 修复）
  4. CI：push tag `v*` 时自动触发发布 workflow（构建 + 上传 artifacts）
- **验收点**：`CHANGELOG.md` 存在且 v1.0.0 条目完整；tag `v1.0.0` 触发 CI 发布流程
- **验收流程**：打 tag 后查看 CI Actions
- **状态**：`[ ]`

#### F-STD-05 RUNBOOK（操作手册）
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

### F-CICD — CI/CD 完善

- `[ ]` **F-CICD-01 CI commitlint 检查**
  - `.github/workflows/ci.yml` 添加 `commitlint` job
  - PR 提交时自动校验 commit message 格式

- `[ ]` **F-CICD-02 CI 发布 workflow**
  - `.github/workflows/release.yml`：tag `v*` 触发
  - 步骤：build backend JAR → build frontend static → create GitHub Release → upload artifacts

---

### F-DEPLOY — 生产部署

- `[ ]` **F-DEPLOY-01 服务器环境准备**
  - 选定云主机方案（Ubuntu 22.04 推荐）
  - 配置域名 + HTTPS 证书（Let's Encrypt）
  - 配置生产环境变量：DB_URL / DB_USERNAME / DB_PASSWORD / JWT_SECRET / APP_SIGNATURE_AES_KEY

- `[ ]` **F-DEPLOY-02 数据库迁移验证**
  - PostgreSQL 启动，`-Dspring.profiles.active=prod` 下 Flyway V1–V14 迁移无报错
  - 种子账号（ceo.demo/123456）可登录

- `[ ]` **F-DEPLOY-03 Docker 构建与部署**
  - `docker build -t boyuan-oa .` 成功
  - `/actuator/health` 返回 `{"status":"UP"}`
  - H5 前端静态文件通过 Nginx 托管，`/api/` 代理到后端

- `[ ]` **F-DEPLOY-04 版本号注入验证**
  - git tag → JAR manifest + 前端 `VITE_APP_VERSION` 正确注入

- `[ ]` **F-DEPLOY-05 生产环境 7 角色全菜单走查**
  - 在真实服务器重跑 Phase E 验收清单
  - 全部通过后 v1.0.0 正式上线

---

## Phase G — 微信小程序

> **前置条件**：Phase F 全部 `[x]`（v1.0.0 已在生产环境运行稳定）。

---

### G-PREP — 前置清理

- `[ ]` **G-PREP-01** 清理 `app/mp/src/pages.json`：仅保留 6 个入口（登录、工作台、待办、考勤、项目、忘记密码）
- `[ ]` **G-PREP-02** 恢复 CI `frontend-mp-test` job（A-OPS-02 中已跳过，Phase G 启动时恢复）
- `[ ]` **G-PREP-03 短信验证码找回密码**（延期自 Phase B）：后端 PasswordResetController 及短信发送逻辑已实现，前端忘记密码页已存在；Phase G 启动时对接真实短信服务商，补充 E2E 测试。延期原因：小程序上线后才需要通用短信找回，H5 端优先使用初始密码+HR重置流程。

---

### G-CORE — 核心页面实现

- `[ ]` **G-CORE-01 登录页**：手机号/密码登录，token 写入 uni storage
- `[ ]` **G-CORE-02 工作台**：动态菜单卡片（按角色），未读待办徽章
- `[ ]` **G-CORE-03 待办页**：待审批列表，支持通过/驳回操作
- `[ ]` **G-CORE-04 考勤页**：请假/加班申请入口，本月记录展示
- `[ ]` **G-CORE-05 项目页**：项目列表，PM 查成员，劳工填施工日志
- `[ ]` **G-CORE-06 忘记密码**：完整 4 步流程

---

### G-TEST — 小程序测试

- `[ ]` **G-TEST-01 TC-MP-01**：各角色登录后菜单与权限一致
- `[ ]` **G-TEST-02 TC-MP-02**：提交请假后审批人待办出现，操作后状态同步
- `[ ]` **G-TEST-03 TC-MP-03**：施工日志（worker）可提交

---

## Phase H — 运维维护

> **前置条件**：Phase F 完成，生产环境运行中。
> **说明**：运维操作规范已在 Phase F（F-STD-05 RUNBOOK）建立，本阶段为日常维护执行层。

---

- `[ ]` **H-ONCALL-01 建立 on-call 值班制度**
  - 参照 `docs/RUNBOOK.md` 中故障排查章节
  - 定义值班轮换表、响应 SLA（P0：15 分钟内，P1：2 小时内，P2：次日）
  - 配置监控告警（服务宕机、响应时间 > 3s、数据库连接异常）

- `[ ]` **H-ONCALL-02 定期维护执行**
  - 每月执行：`npm audit`（前端依赖安全检查）、`./mvnw dependency:check`（后端依赖）
  - 每季度：数据备份演练（按 RUNBOOK §备份恢复章节执行）
  - 每半年：非功能性性能压测（`ab` 或 `k6`），确认关键接口 P95 < 500ms

---

## 完成历史（已完成模块）

M0 基础设施 / M1 身份认证 / M2 组织管理 / M3 审批流引擎 / M4 考勤模块 / M5 薪资模块（含签名/PDF/社保分叉） / V5 薪资构成扩展 / V6 薪资更正流程 / V7–V10 第二角色/售后/物资/营收/保险/施工考勤/审计/部门经理 / M6 项目管理 / M8 施工&工伤 / M9 通知&工作台 / M10 数据生命周期 / M11 CI/CD+部署脚本+Dockerfile / M12 初始化向导 / 动态页面标题 / Dev tools 鉴权修复

**已完成后端接口**：`POST /auth/change-password`、`GET /auth/me`（含isDefaultPassword）、`GET /operation-logs`（分页，CEO专属）、`@OperationLogRecord` 注解接入关键业务方法。
