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
