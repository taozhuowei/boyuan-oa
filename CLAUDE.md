# AGENTS

## ROLES
Claude: plan, brief, verify, test, docs, git
Kimi: implement, files

Claude-only: requirements, design, decisions, acceptance
Kimi-only: codegen, file-ops, bulk-implementation
Neither does the other's job.

## KIMI CLI
```
kimi --quiet -w <dir> -p "<prompt>"
kimi --quiet -w <dir> --continue -p "<prompt>"
kimi --quiet --thinking -w <dir> -p "<prompt>"  # complex tasks
```
exit: 0=ok 1=fail 75=retry

## DIRS
h5 frontend: D:/Taozhuowei/Project/boyuan-oa/app/h5          (Nuxt 3 + Ant Design Vue)
mp frontend: D:/Taozhuowei/Project/boyuan-oa/app/mp          (uni-app, Phase 3 not started)
backend:     D:/Taozhuowei/Project/boyuan-oa/server           (Spring Boot 3 + MyBatis-Plus + H2/PostgreSQL)
shared:      D:/Taozhuowei/Project/boyuan-oa/app/shared       (types + utils, shared by h5 and mp)
root:        D:/Taozhuowei/Project/boyuan-oa

## PROTOCOL
Before any task (except continuation): verify TODO.md actual state against code.
Update TODO.md to match reality before writing briefs.

## TASK STATUS PROTOCOL (MUST FOLLOW, NO EXCEPTIONS)

Task status is NOT binary. Every task must pass through all 5 states:

| State | Symbol | Meaning | Who sets it |
|---|---|---|---|
| 待开发 | `[ ]` | Not started | Initial state |
| 开发中 | `[~]` | Being coded right now | Set BEFORE writing first line of code |
| 待测试 | `[>]` | Code complete, tests pending | Set AFTER code is written |
| 待验收 | `[?]` | Tests passed, browser walkthrough pending | Set AFTER automated tests pass |
| 已完成 | `[x]` | Browser-validated and accepted | Set AFTER human browser validation |

**Mandatory rules:**

1. **先改状态，再动代码。** 开始写某任务代码前，必须先将 TODO.md 中该任务状态从 `[ ]` 改为 `[~]`，然后才能开始编码。禁止先写代码再补状态。

2. **完成即更新。** 每完成一个阶段（代码完 → 测试完 → 验收完），必须立即在 TODO.md 中推进状态，不允许批量延迟更新。

3. **对照设计文档开发。** 每个任务开始前必须重新阅读 DESIGN.md 对应章节；开发过程中随时比对，确保字段、交互、权限与设计完全一致。禁止凭记忆或猜测实现细节。

4. **疑问立停。** 遇到以下任意情况，必须立即停止并向用户提问，不得自行假设或继续：
   - DESIGN.md 描述模糊或存在冲突
   - 需要新增后端接口但不确定是否已存在
   - 实现方案可能影响已完成的功能
   - 与其他任务存在依赖关系未明确

5. **做完做对做好，不留技术债。** 每个任务完成后必须通过对应验收条件（见 TODO.md 任务描述中的"验收"子项），不得以"基本可用"结项。

## BRIEF FORMAT
```
FILE: <path>
DO: <what>
REF: <DESIGN.md §x>, <existing-file>
CONSTRAINTS: <list>
FORBIDDEN: <list>
```

## PROJECT STATE (2026-04-16)

### Tech stack
- H5: Nuxt 3, Ant Design Vue (antd), TypeScript, Pinia, Vitest
- Backend: Spring Boot 3, MyBatis-Plus, H2 (dev), PostgreSQL (prod), JWT, Flyway
- Auth: JWT in Authorization header; role codes: ceo, hr, finance, project_manager, department_manager, employee, worker
- API base: /api (proxied by Nuxt)

### What is done (verified against code, 2026-04-16)
- M0-M4: infra, auth/JWT, org/dept CRUD, approval engine (advance/skip/CEO fallback), attendance
- M5: payroll cycle/settle/sign/PDF, signature canvas, social insurance mode branching
- V5: payroll composition extension — position_salary, allowance_def/config (3-tier), payroll_bonus, bonus approval toggle
- V6: payroll correction flow — POST /payroll/slips/{id}/correction, GET /corrections, SUPERSEDED slip logic
- V7–V10: second-role, after-sale, material cost, revenue, insurance, construction attendance, audit, department_manager role
- M6: project CRUD, milestones, progress, dashboard, construction summary
- M8: construction logs, work item templates, injury claims, attachments
- M9: notifications (real DB), workbench summary (real DB)
- M10: retention policies, export tasks, operation_log physical delete
- M11: CI/CD (GitHub Actions), deploy scripts (update.sh/rollback.sh), Dockerfile (Maven), deploy:h5/deploy:backend npm scripts
- M12: setup wizard (5-step), DevController @Profile("dev") confirmed
- Dynamic page title: uninitialized → "博渊OA管理系统"; after init → "{企业名}OA管理系统"
  - company_name stored in system_config; returned by GET /setup/status
  - Setup wizard step 1 includes optional company name field
  - app.vue fetches and sets reactive title via useHead()
- Dev tools fixed: /dev/** added to SecurityConfig permitAll (DevController is @Profile("dev") only)
- Seed data (local/seed-data.sql): all roles have 3–5 attendance records (all status values) and payroll slips

**Phase A H5 pages with known code (browser validation pending — no implementation gaps found):**
- /me (118L) — personal profile, calls GET /auth/me
- /me/password (137L) — change password form, calls POST /auth/change-password
- /forms (366L) — form record center (PM/worker), calls GET /forms
- /directory (294L) — CSV import, calls POST /import-preview + /import-apply
- /operation-logs (175L) — log viewer (CEO only), calls GET /operation-logs
- /positions (639L) — position + level CRUD (CEO/HR), calls /positions + /positions/{id}/levels
- /role (353L) — role management (CEO), calls /roles
- /allowances — allowance definitions + 3-tier config
- Workbench (index.vue, 276L) — project count card has @click="navigateTo('/projects')"
- First-login password banner — shown when isDefaultPassword=true, links to /me/password
- Attendance re-submit — REJECTED forms show resubmitRecord button

**Phase A backend endpoints present (unchanged):**
- POST /auth/change-password — bcrypt verify + update
- GET /auth/me — current user info incl. isDefaultPassword
- GET /operation-logs — paginated, CEO only
- POST /payroll/slips/{id}/correction — finance initiates
- GET /payroll/corrections — correction history
- @OperationLogRecord applied to: ApprovalFlowService.advance, PayrollEngine.settle, EmployeeController.updateEmployee, SignatureController.bindSignature

### What is NOT done
**2026-04-16 全量代码审查发现 21 项 P0 缺口（对照 DESIGN.md），详见 TODO.md A1–A7：**

**A1 — 整页缺失（需从零实现）:**

- /leave-types (HR) — 假期类型/配额/扣款配置 CRUD，请假申请假种下拉需联动此接口
- /data-export (CEO) — 时间范围选择 → 导出 .obk 文件（DESIGN.md §10.2）
- /data-viewer (CEO) — 拖拽上传 .obk 文件只读展示历史数据（DESIGN.md §10.3）

**A2 — 员工与组织:**

- /employees 表单缺失：性别（必填）、部门/岗位/等级三级联动下拉、直系领导搜索下拉、身份证号、出生日期；角色字段是文本输入而非下拉
- /org 仅实现部门 CRUD 树，未实现 DESIGN.md §3.5 要求的双面板拖拽汇报关系树

**A3 — 考勤:**

- /attendance leave tab：缺请假时长只读展示、附件上传、追溯申请复选框（DESIGN.md §7.2）
- /attendance overtime tab：缺加班时长只读展示、附件上传（DESIGN.md §7.3）
- /attendance isPmOrCeo 逻辑未包含 department_manager（发起通知 Tab 对部门经理不可见）
- ROLE_MENUS.worker 无 /attendance 入口（劳工无法提交请假/加班申请）

**A4 — 报销与工伤:**

- /expense/apply：缺发票文件上传（DESIGN.md §9.2 必填）、关联项目下拉
- /injury：缺受伤时间选择器、独立医生诊断结果字段、独立事故经过字段；财务录入理赔需手动输入 formRecordId/employeeId（应改为已通过申报单下拉）

**A5 — 项目:**

- /projects/[id] info Tab：缺合同编号、合同附件、客户名称、项目说明字段（DESIGN.md §8.1）；成员添加用数字 ID 输入框而非员工搜索下拉
- /construction-log：PM 审批按钮缺失（index.vue 有 TODO 注释；需在 /projects/[id] 施工日志审批 Tab 确认或补全）

**A6 — 系统配置（/config 页面）:**

- 缺企业名称编辑 Card（DESIGN.md §2.2；PUT /config/company-name 或 /system-config key=company_name）
- 缺薪资周期配置（发薪日、结算截止日；DESIGN.md §5.0.5）
- 缺全局数据保留期配置（与 /retention 页联动）
- BUSINESS_TYPE_LABELS 缺 EXPENSE: '报销申请' 类型（审批流配置页无法配置报销审批流）

**A7 — 权限/路由/布局:**

- default.vue todo 数量统计仅对 ceo/project_manager 有效；dept_manager/finance/hr/employee/worker 顶部角标恒为 0
- ROLE_MENUS.finance 缺独立路由入口（岗位薪资配置、社保配置、项目成本、营收管理；DESIGN.md §5.4）
- ROLE_MENUS 无 ops 角色定义（ops 账号登录后工作台为空）
- default.vue 侧边栏 Logo 硬编码为"众维OA工作台"（应动态读取 company_name）

**Phase B/C/D not started:**

- B2: Docker/PostgreSQL prod deploy validation
- B2: version injection (git tag → JAR → VITE_APP_VERSION)
- C: WeChat mini-program (uni-app, Phase 3, blocked until web+backend live)
- D: Production server setup and deployment

### Key file locations
- Layout + nav menus: app/h5/layouts/default.vue
- Auth middleware: app/h5/middleware/auth.global.ts
- API calls: use $fetch or useFetch with /api prefix (proxied to backend :8080)
- Backend controllers: server/src/main/java/com/oa/backend/controller/
- DB migration: server/src/main/resources/db/migration/ (V1__init_schema.sql, V2__init_data.sql)
- Dev seed data: server/src/main/resources/db/data.sql (H2 only); local/seed-data.sql (gitignored, loaded at dev startup)
- company_name: stored in system_config table; key = "company_name"
- Test users: ceo.demo/123456, hr.demo/123456, finance.demo/123456, pm.demo/123456, employee.demo/123456, worker.demo/123456, dept_manager.demo/123456

### Integration test
- test/integration/api.test.ts covers M0-M2 APIs only
- Full smoke test (login→leave→approve→payroll confirm) not automated yet

---

## Directory Layout & File Placement Rules

Read this section before creating, moving, or deleting any file or directory.

### Top-level structure
```
/
├── app/
│   ├── h5/          # H5 frontend (Nuxt 3 + Ant Design Vue)
│   ├── mp/          # WeChat mini-program (uni-app, Phase C)
│   └── shared/      # Shared TS types + utils used by both h5 and mp
├── server/          # Spring Boot backend
├── test/            # All test code and test design docs
│   ├── integration/ # API integration tests (Vitest + real HTTP)
│   └── unit/        # Unit tests (currently: shared/)
├── local/           # Local-only files (gitignored): seed SQL, personal notes
├── .github/         # CI/CD workflows (GitHub Actions)
├── ARCHITECTURE.md  # Project-level technical architecture doc
├── DESIGN.md        # Business design doc (product/requirements)
├── TODO.md          # Single source of progress tracking
├── CLAUDE.md        # AI agent instructions (this file)
├── README.md        # Project overview + quick start
└── BUSINESS_REPORT_PRICING_ANALYSIS.md  # Business/pricing analysis (non-code)
```

### Document ownership rules
| Document type | Location |
|---|---|
| H5 frontend implementation detail | app/h5/FRONTEND_IMPL.md |
| Backend implementation detail | server/BACKEND_IMPL.md |
| Technical architecture (cross-cutting) | ARCHITECTURE.md (root) |
| Business/product design | DESIGN.md (root) |
| Progress tracking | TODO.md (root, single source of truth) |
| Test design and strategy | test/TEST_DESIGN.md |

### File placement rules
- **Test files**: ALL test code goes under test/. Never scatter test files inside source directories (e.g. no app/shared/test/).
- **Docs**: Each service/app directory has ONE implementation doc (README = quick start, IMPL = implementation detail). No duplication across files.
- **Temp files**: Temporary scripts, debug helpers, one-off tools go to local/ (gitignored). Never commit them.
- **Tools / scripts**: Only commit scripts that are actively wired into CI or documented workflows. Unused scripts must be deleted.
- **Dependencies**: No speculative dependencies. Add a package only when code actually imports it.
- **Lock files**: Exactly ONE lock file at repo root: yarn.lock. Never commit package-lock.json or app/package-lock.json.

### Before adding a file — checklist
1. Does a file with this responsibility already exist? If yes, update it.
2. Is this the correct directory per the ownership table above?
3. Is it a temp file that belongs in local/ instead?
4. Will this file be gitignored or tracked? Check .gitignore.
5. If adding a dependency: is it actually imported? Is it devDep or dep?
