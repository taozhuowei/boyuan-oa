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

- `[ ]` 待开发 — Not started; initial state
- `[~]` 开发中 — Being coded right now; set BEFORE writing first line of code
- `[>]` 待测试 — Code complete, tests pending; set AFTER code is written
- `[?]` 待验收 — Tests passed, browser walkthrough pending; set AFTER automated tests pass
- `[x]` 已完成 — Browser-validated and accepted; set AFTER human browser validation

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

## PROJECT STATE (2026-04-17)

> **Task state single source of truth: `TODO.md`**
> Do NOT trust any "what is done" list in this or any other file.
> Last manual test: 2026-04-17 — 25 bugs found (recorded in TODO.md Phase B).
> TODO.md was fully rewritten 2026-04-17 into a 7-phase roadmap (A→G).
> **Current active phase: Phase A (architecture governance + cleanup).**

### 7-Phase Roadmap (see TODO.md for full detail)
- Phase A — Architecture governance + cleanup (CURRENT)
- Phase B — Feature completeness + bug fixes
- Phase C — Full test coverage + Claude black-box self-test
- Phase D — Human browser acceptance
- Phase E — Production deploy + ALL engineering standards (git/PR/branch/SemVer/CHANGELOG/RUNBOOK)
- Phase F — WeChat mini-program
- Phase G — Operational maintenance

### Known critical facts
- Flyway migrations: V1–V13 exist. Next new migration = **V14** (DB index migration, task A-DB-01).
- Page dir rename in progress (Phase A, task A-CLEAN-02): kebab-case → snake_case.
  Affected: construction-log→construction_log, data-export→data_export, data-viewer→data_viewer, leave-types→leave_types, operation-logs→operation_logs.
  After rename, all route keys in auth.global.ts and ROLE_MENUS must use snake_case paths.
- WorkbenchController directly holds 4 Mappers (no Service layer) — task A-CODE-02.
- AttachmentController has no @PreAuthorize at all — task A-SEC-01.
- auth.global.ts PAGE_ACCESS covers only 13 routes — task A-SEC-03.

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
- Test users: `ceo.demo/123456`, `hr.demo/123456`, `finance.demo/123456`, `pm.demo/123456`, `employee.demo/123456`, `worker.demo/123456`, `dept_manager.demo/123456`

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
