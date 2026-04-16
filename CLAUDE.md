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

**All Phase A H5 pages implemented (verified by file read, 2026-04-16):**
- /me (118L) — personal profile, calls GET /auth/me
- /me/password (137L) — change password form, calls POST /auth/change-password
- /forms (366L) — form record center (PM/worker), calls GET /forms
- /directory (294L) — CSV import, calls POST /import-preview + /import-apply
- /operation-logs (175L) — log viewer (CEO only), calls GET /operation-logs
- /positions (639L) — position + level CRUD (CEO/HR), calls /positions + /positions/{id}/levels
- /role (353L) — role management (CEO), calls /roles
- /config (391L) — attendance units + approval flow config (CEO), calls /config/attendance-unit + /approval-flows
- /allowances — allowance definitions + 3-tier config
- Workbench (index.vue, 276L) — project count card has @click="navigateTo('/projects')"
- First-login password banner — shown when isDefaultPassword=true, links to /me/password
- Attendance re-submit — REJECTED forms show resubmitRecord button

**All Phase A backend endpoints present:**
- POST /auth/change-password — bcrypt verify + update
- GET /auth/me — current user info incl. isDefaultPassword
- GET /operation-logs — paginated, CEO only
- POST /payroll/slips/{id}/correction — finance initiates
- GET /payroll/corrections — correction history
- @OperationLogRecord applied to: ApprovalFlowService.advance, PayrollEngine.settle, EmployeeController.updateEmployee, SignatureController.bindSignature

### What is NOT done
**Pending browser walkthrough (code exists, not yet browser-validated — [-] in TODO.md):**
- All Phase A pages above are [-] in TODO.md; need manual browser walk per role
- TODO.md Phase B B1: 6-role full menu walkthrough (browser, manual)

**Genuine code gaps (not implemented anywhere):**
- /config page does NOT include company_name editing (DESIGN.md §2.2 mentions it as editable; only attendance units + approval flows are implemented)

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
