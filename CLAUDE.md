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

## PROJECT STATE (2026-04-10)

### Tech stack
- H5: Nuxt 3, Ant Design Vue (antd), TypeScript, Pinia, Vitest
- Backend: Spring Boot 3, MyBatis-Plus, H2 (dev), PostgreSQL (prod), JWT, Flyway
- Auth: JWT in Authorization header; role codes: ceo, hr, finance, project_manager, department_manager, employee, worker
- API base: /api (proxied by Nuxt)

### What is done (verified against code)
- M0-M4: infra, auth/JWT, org/dept CRUD, approval engine (advance/skip/CEO fallback), attendance
- M5: payroll cycle/settle/sign/PDF, signature canvas, social insurance mode branching
- M6: project CRUD, milestones, progress, dashboard, construction summary
- M8: construction logs, work item templates, injury claims, attachments
- M9: notifications (real DB), workbench summary (real DB)
- M10: retention policies, export tasks, operation_log physical delete
- M11: CI/CD (GitHub Actions), deploy scripts (update.sh/rollback.sh), Dockerfile (Maven), deploy:h5/deploy:backend npm scripts
- M12: setup wizard (5-step), DevController @Profile("dev") confirmed

### What is NOT done (production blockers)
Pages with "TODO: implement" placeholder (non-functional):
- /positions  — position + salary grade management (HR/CEO)
- /role       — role management (CEO)
- /config (or /settings) — system config page (CEO/HR)

Pages completely missing (route exists in layout but no page file):
- /me          — personal profile view
- /me/password — change password (logged-in user)
- /forms       — form record center (PM/worker menu)
- /directory   — directory import (finance menu)
- /operation-logs — operation log viewer (CEO/sysadmin, DESIGN §1.2)

Backend gaps:
- POST /auth/change-password — no endpoint for logged-in password change (only forgot-password reset exists)
- GET /operation-logs — no query endpoint for operation log viewer

Functional gaps (lower priority but needed before launch):
- Attendance: no "re-submit" flow after rejection (user must create a new form manually — UX gap)
- Payroll: no /correction endpoint or UI for salary correction unlock flow
- Workbench: project count card not clickable (no navigation)
- @OperationLogRecord annotation defined but never applied to any business method (audit log writes nothing)

### Deferred (post-launch)
- Payroll correction/dispute unlock flow (P2)
- Attendance retroactive submit (P2)
- Page config backend endpoint (P3)
- Version injection (git tag → JAR → VITE_APP_VERSION) (P2)
- M-MP WeChat mini program (Phase 3, blocked until web+backend are live)

### Key file locations
- Layout + nav menus: app/h5/layouts/default.vue
- Auth middleware: app/h5/middleware/auth.global.ts
- API calls: use $fetch or useFetch with /api prefix (proxied to backend :8080)
- Backend controllers: server/src/main/java/com/oa/backend/controller/
- DB migration: server/src/main/resources/db/migration/ (V1__init_schema.sql, V2__init_data.sql)
- Dev seed data: server/src/main/resources/db/data.sql (H2 only)
- Test users: ceo.demo/123456, hr.demo/123456, finance.demo/123456, pm.demo/123456, employee.demo/123456

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
