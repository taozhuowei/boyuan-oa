# Commit Message Convention

## Format

```
type: description
```

- `type` must be one of the allowed types listed below.
- `description` is a concise summary of the change in imperative mood (e.g. "add", "fix", not "added", "fixed").
- Scope is optional: `type(scope): description`.

## Allowed Types

- `feat` — new feature for the user or system
- `fix` — bug fix
- `refactor` — code restructuring with no behavior change
- `perf` — performance improvement
- `test` — adding or updating tests
- `docs` — documentation-only change
- `style` — formatting, whitespace, semicolons (no logic change)
- `chore` — build system, tooling, or dependency updates
- `cleanup` — removing dead code, unused files, or redundant configuration

## Valid Examples

```
feat: add leave application export to Excel
fix: correct overtime hours calculation for cross-midnight shifts
chore: upgrade Spring Boot to 3.4.5
```

## Invalid Examples (rejected by commit-msg hook)

```
# Missing type prefix
update leave service

# Type not in whitelist
update: fix payroll calculation bug
```

## Line Length Policy

- Subject line: no enforced limit, but keep it concise (under 72 chars recommended).
- Body and footer: **no enforced line length limit** (`body-max-line-length` and `footer-max-line-length` are disabled). Multi-line bodies and `Co-Authored-By` trailers are allowed.

## Enforcement

The `commit-msg` git hook invokes `commitlint` automatically on every commit.
A non-conforming message causes the commit to be rejected with a descriptive error.
To bypass in emergencies only: `git commit --no-verify` (not recommended).
