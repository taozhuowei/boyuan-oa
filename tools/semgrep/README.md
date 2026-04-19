# Semgrep Static Analysis

## Install

```
pip install semgrep
```

## Run

Custom project rules (architecture enforcement):

```
semgrep --config tools/semgrep/custom-rules.yml server/src/
```

OWASP Top 10 rules (security):

```
semgrep --config p/owasp-top-ten server/src/ app/h5/
```

Spring Boot rules:

```
semgrep --config p/spring-boot server/src/
```

## Custom Rules

`custom-rules.yml` enforces three project-specific constraints:

- `no-mapper-in-controller` — Mappers must not be injected directly into controllers; use a service layer. Severity: ERROR.
- `no-sql-in-service` — Raw SQL strings must not appear in service classes; use MyBatis mapper methods. Severity: WARNING.
- `no-system-out-in-production` — `System.out.println` must not appear in production code; use SLF4J. Severity: WARNING.

## CI Integration

Runs in the `fast-check.yml` workflow under the `security-static` job with `continue-on-error: true`. Findings are reported as annotations but do not block the build.
