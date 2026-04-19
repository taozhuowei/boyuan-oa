# OWASP ZAP Security Scanning

## Scope

Target: `http://localhost:8080/api` — all `/api/*` routes.

## Modes

Baseline scan (~2 min) — passive scan only, no active attack:

```
docker run --network host ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://localhost:8080/api \
  -r zap-report.html -I
```

Full scan (~15 min) — active scan with attack rules:

```
docker run --network host ghcr.io/zaproxy/zaproxy:stable \
  zap-full-scan.py -t http://localhost:8080/api \
  -r zap-full-report.html -I
```

## Risk Classification

- HIGH — blocks CI; must be fixed before merge.
- MEDIUM — review and remediate within 1 sprint.
- LOW — log and track; schedule in backlog.

## CI Behavior

ZAP runs with the `-I` flag (ignore failure exit code) so findings never block CI. HTML reports are uploaded as GitHub Actions artifacts for manual review. The `full-test.yml` workflow runs the baseline scan on every push; the `nightly.yml` workflow runs the full scan nightly.
