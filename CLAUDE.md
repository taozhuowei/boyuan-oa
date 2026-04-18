# AGENTS

## AGENT ASSIGNMENTS

### Orchestrator
Claude main session — planning, briefing, verification, git, docs, phase acceptance gate.
Never writes business code. Never reviews its own outputs.

### Implementation Agents (spawn via Agent tool)

Note: `~/.claude/agents/*.md` are custom persona definitions (engineering-backend-architect,
engineering-code-reviewer, testing-api-tester, etc.). They are NOT callable via Agent tool
subagent_type — only built-in types below are valid.

**Backend Engineer** — `subagent_type: "Backend Engineer"`
When: Spring Boot controller/service/entity, DB migration (V18+), API design, MyBatis-Plus mapper

**Frontend Engineer** — `subagent_type: "Frontend Engineer"`
When: Nuxt 3 page/component/store/middleware/composable, Vue SFC, TypeScript UI logic

**Technical Architect** — `subagent_type: "Technical Architect"`
When: cross-cutting architecture decisions, new module design, integration pattern selection

**WeChat Mini Program Developer** — `subagent_type: "WeChat Mini Program Developer"`
When: Phase G — app/mp uni-app implementation, WeChat API integration

**Kimi CLI** — fallback for bulk operations (5+ files or large-scale generation)
```
kimi --quiet -w <dir> -p "<prompt>"
kimi --quiet -w <dir> --continue -p "<prompt>"
kimi --quiet --thinking -w <dir> -p "<prompt>"
```
exit: 0=ok 1=fail 75=retry

### Quality Agents (spawn via Agent tool)

**QA Engineer** — `subagent_type: "QA Engineer"`
When: after EVERY implementation (code review) + Phase C test writing/fixing + phase acceptance gate
Input for review: changed file paths + diff summary + task context
Output for review: PASS or NEEDS WORK with specific findings

### Infrastructure Agents (spawn via Agent tool)

**DevOps Engineer** — `subagent_type: "DevOps Engineer"`
When: Phase C+-INFRA (husky hooks, GitHub Actions quality workflows) + Phase F (production deploy pipeline, Docker)

**Ops Engineer** — `subagent_type: "Ops Engineer"`
When: Phase H — production monitoring, alerting, incident response, capacity planning

### Phase → Agent Map

Phase A (Architecture Governance + Cleanup)
- Architecture analysis → Technical Architect
- Backend cleanup → Backend Engineer → QA Engineer (review)
- Frontend cleanup → Frontend Engineer → QA Engineer (review)
- Phase acceptance gate → QA Engineer runs full test suite + outputs report

Phase B (Feature Development + Bug Fixes)
- Full-stack features → Backend Engineer (parallel with) Frontend Engineer → QA Engineer each
- Backend-only or frontend-only → single agent → QA Engineer (review)
- Five-dimension cross-check → orchestrator verifies each dimension
- Phase acceptance gate → QA Engineer runs full test suite + outputs report

Phase C (Test Coverage)
- Test strategy design → QA Engineer
- Integration test writing and fixing → QA Engineer
- E2E test writing → QA Engineer + Frontend Engineer
- Black-box self-test execution → orchestrator (Claude) executes MB-01~MB-10 directly
- Code review after test changes → QA Engineer (review role)
- Phase acceptance gate → QA Engineer runs full suite, outputs Pass/Fail matrix

Phase C+ (CI/CD Infra + Leftover Fixes + Quality System + Full Acceptance)
- C+-INFRA (FIRST, before any code change): VSCode config + husky hooks + GitHub Actions workflows
  - C+-I-01 (.vscode/) → orchestrator writes config files
  - C+-I-02 (husky+lint-staged+commitlint) → DevOps Engineer → QA Engineer
  - C+-I-03/04/05 (GitHub Actions) → DevOps Engineer → QA Engineer
- C+-DESIGN: tools setup (ArchUnit/springdoc/k6/ZAP/schemathesis/Snyk/SonarQube/Semgrep/Prettier/Spotless/Knip/jsdoc) + docs + rules
  - Backend tasks (C+-D-01/02/06/11/12/14) → Backend Engineer → QA Engineer
  - Tools (C+-D-03/04/05/12/13/16) → QA Engineer
  - Docs/rules (C+-D-07/08/09/10/15) → orchestrator
  - User confirms test case design before proceeding to C+-FIX
- C+-FIX: each fix → Backend/Frontend Engineer → QA Engineer (review); all hooks active by this point
- C+-TEST: 5 rounds; QA Engineer executes; all must pass
- C+-GATE: orchestrator outputs acceptance report; user confirms test design (C+-G-04) and signs off (C+-G-05)

Phase D (Design Alignment Audit)
- BIZ: orchestrator reads DESIGN.md section, confirms with user, updates DESIGN.md
- REV: QA Engineer audits code against confirmed design
- FIX: Backend Engineer or Frontend Engineer → QA Engineer
- CHK: QA Engineer re-checks

Phase E (Human Acceptance)
- Bug fixes from user walkthrough → Backend Engineer or Frontend Engineer → QA Engineer
- Regression validation → QA Engineer

Phase F (Production Deploy + Standards)
- CI/CD pipeline → DevOps Engineer
- Production environment setup → Ops Engineer
- Standards docs (RUNBOOK/CHANGELOG) → orchestrator

Phase G (WeChat Mini Program)
- MP implementation → WeChat Mini Program Developer → QA Engineer
- Backend API extensions → Backend Engineer → QA Engineer
- Phase acceptance gate → QA Engineer

Phase H (Operations)
- Incident response + maintenance → Ops Engineer
- Code fixes → Backend Engineer or Frontend Engineer → QA Engineer regression

## DIRS
h5 frontend: D:/Taozhuowei/Project/boyuan-oa/app/h5          (Nuxt 3 + Ant Design Vue)
mp frontend: D:/Taozhuowei/Project/boyuan-oa/app/mp          (uni-app, Phase G not started)
backend:     D:/Taozhuowei/Project/boyuan-oa/server           (Spring Boot 3 + MyBatis-Plus + H2/PostgreSQL)
shared:      D:/Taozhuowei/Project/boyuan-oa/app/shared       (types + utils, shared by h5 and mp)
root:        D:/Taozhuowei/Project/boyuan-oa

## PROTOCOL
Before any task (except continuation): verify TODO.md actual state against code.
Update TODO.md to match reality before writing briefs.

## TASK STATUS PROTOCOL (MUST FOLLOW, NO EXCEPTIONS)

Task status is NOT binary. Every task must pass through all 5 states:

- `[ ]` 待开发 — Not started; initial state
- `[~]` 开发中 — Being coded right now; set BEFORE writing first line of code
- `[>]` 待测试 — Code complete, tests pending; set AFTER code is written
- `[?]` 待验收 — Tests passed, browser walkthrough pending; set AFTER automated tests pass
- `[x]` 已完成 — Validated and accepted; set AFTER passing the phase-specific acceptance gate

**Phase-specific `[x]` gate:**
- **Phase A tasks**: human browser review is replaced by three-layer automated acceptance:
  1. Independent Code Reviewer agent gives PASS
  2. Black-box curl tests pass (key endpoints + forbidden-role 403 check)
  3. `mvn test` (392 backend tests) + `yarn workspace oa-h5 test` (21 frontend tests) all pass
  Phase C will add full e2e coverage on top; Phase E is still a mandatory human browser walkthrough for Phase B features.
- **Phase B+ tasks**: original flow applies — `[?]` requires automated tests pass, `[x]` requires human browser validation in Phase E.

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

## SESSION STARTUP PROTOCOL

Every new session MUST do this before writing any code:

1. Read `TODO.md` — find tasks in `[~]` or `[>]` state (in-progress or code-complete)
2. For any task the previous session claimed done: curl one API endpoint OR open one page to verify it actually works
3. Correct TODO if there is any discrepancy between recorded state and reality
4. Never assume the previous session's claims are correct — verify independently

## CROSS-CUTTING VERIFICATION (this project)

For every feature, before advancing past `[>]`, verify all five. Check the exact file locations below.

**1. Backend permission — `server/src/main/java/com/oa/backend/controller/*.java`**
- `@PreAuthorize("hasAnyRole(...)")` includes every role that should have access
- Test: call the endpoint with a forbidden-role JWT token → must return 403

**2. Frontend route guard — `app/h5/middleware/auth.global.ts`**
- `PAGE_ACCESS['/path']` entry exists with the correct role list
- Test: log in as `employee.demo`, navigate directly to the URL → must redirect to home

**3. Nav menu — `app/h5/layouts/default.vue` → `ROLE_MENUS`**
- All authorized roles have a menu entry pointing to this page
- All unauthorized roles do NOT see this entry in their sidebar

**4. Seed data — `local/seed-data.sql`**
- Tables this page reads have at least 1–3 test rows
- Page loads without 500 error when seed data is the only data present

**5. Field completeness — `DESIGN.md` corresponding section**
- Open DESIGN.md, find the section for this feature
- Count every field listed → verify each exists as a form input or display element in the Vue component

## PROJECT STATE (2026-04-19)

> **Task state single source of truth: `TODO.md`**
> Do NOT trust any "what is done" list in this or any other file.
> **Phase A complete — all 46 tasks `[x]`, validated 2026-04-18.**
> **Phase B complete — all tasks `[?]`; B-INFRA-01 deferred to Phase F.**
> **Phase C complete — all tests pass, black-box MB-01~MB-10 done.**
> **Current active phase: Phase C+ (CI/CD infra + leftover fixes + quality system + full acceptance).**

### 9-Phase Roadmap (see TODO.md for full detail)
- Phase A — Architecture governance + cleanup (COMPLETE)
- Phase B — Feature completeness + bug fixes (COMPLETE, all `[?]`, pending Phase E browser)
- Phase C — Full test coverage + Claude black-box self-test (COMPLETE)
- Phase C+ — CI/CD infra + quality toolchain + leftover fixes + full acceptance (CURRENT)
- Phase D — Design alignment audit: module-by-module BIZ confirm → REV → FIX → CHK
- Phase E — Human browser acceptance
- Phase F — Production deploy pipeline + engineering standards (CHANGELOG/RUNBOOK/SemVer)
- Phase G — WeChat mini-program
- Phase H — Operational maintenance

### Known critical facts
- Flyway migrations: V1–V17 exist. Next new migration = **V18**.
  V14 = DB indexes, V15 = ops role, V16 = gm→general_manager data migration, V17 = add COMPENSATORY leave type.
- B-INFRA-01 deferred: V2–V9 migrations use PostgreSQL-only syntax (ON CONFLICT, setval); cannot run in H2 dev. CI job validates prod migrations. Will be resolved in Phase F.
- Page dir rename complete (A-CLEAN-02 `[x]`): construction_log, data_export, data_viewer, leave_types, operation_logs.
  All route keys in auth.global.ts and ROLE_MENUS use snake_case paths.
- Controller layer Mapper injections removed (A-AUDIT-DEBT-07 `[x]`): 31/32 controllers cleaned. InjuryClaimController still has FormRecordMapper injection — tracked as A-AUDIT-REGRESSION-01 in C+-FIX.
- Large Vue files split (A-AUDIT-FOLLOWUP `[x]`): projects/[id].vue, payroll/index.vue, attendance/index.vue, config/index.vue.
- auth.global.ts PAGE_ACCESS routes complete (A-SEC-03 `[x]`).
- WorkbenchService quick-action paths use `/forms?type=leave` and `/forms?type=overtime`.
- /api/auth/login uses EmployeeService (DB-based); test with /api/auth/dev-login (no password, in-memory) when DB accounts absent.
- PositionController GET endpoints: CEO/HR/FINANCE only (PROJECT_MANAGER removed, per DESIGN §3.4).
- customized-file-upload component: app/h5/components/customized/FileUpload/index.vue (Nuxt auto-registers as customized-file-upload).

### Tech stack
- H5: Nuxt 3, Ant Design Vue (antd), TypeScript, Pinia, Vitest
- Backend: Spring Boot 3, MyBatis-Plus, H2 (dev), PostgreSQL (prod), JWT, Flyway
- Auth: JWT in Authorization header; role codes: `ceo`, `hr`, `finance`, `project_manager`, `department_manager`, `employee`, `worker`
- API base: `/api` (proxied by Nuxt to backend `:8080`)

### Key file locations
- Layout + nav menus: `app/h5/layouts/default.vue`
- Auth middleware: `app/h5/middleware/auth.global.ts`
- API calls: use `$fetch` or `useFetch` with `/api` prefix
- Backend controllers: `server/src/main/java/com/oa/backend/controller/`
- DB migration: `server/src/main/resources/db/migration/` (V1__init_schema.sql, V2__init_data.sql)
- Dev seed data: `server/src/main/resources/db/data.sql` (H2 only); `local/seed-data.sql` (gitignored)
- company_name: stored in `system_config` table; key = `"company_name"`
- Test users: `ceo.demo/123456`, `hr.demo/123456`, `finance.demo/123456`, `pm.demo/123456`, `employee.demo/123456`, `worker.demo/123456`, `dept_manager.demo/123456`, `ops.demo/123456`

---

## Directory Layout & File Placement Rules

Read this section before creating, moving, or deleting any file or directory.

### Top-level structure
```
/
├── app/
│   ├── h5/          # H5 frontend (Nuxt 3 + Ant Design Vue)
│   ├── mp/          # WeChat mini-program (uni-app, Phase F)
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

- H5 frontend implementation detail → `app/h5/FRONTEND_IMPL.md`
- Backend implementation detail → `server/BACKEND_IMPL.md`
- Technical architecture (cross-cutting) → `ARCHITECTURE.md` (root)
- Business/product design → `DESIGN.md` (root)
- Progress tracking → `TODO.md` (root, single source of truth)
- Test strategy + layer specs → `test/TEST_DESIGN.md`
- E2E test cases → `test/e2e/TEST_DESIGN.md`
- Black-box manual test cases → `test/manual/TEST_CASES.md`

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
