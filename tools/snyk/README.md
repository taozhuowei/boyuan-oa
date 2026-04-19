# Snyk Dependency Vulnerability Scanning

## Install

```
npm install -g snyk
```

## Authenticate

```
snyk auth <token>
```

## Scan

Scan backend (Maven):

```
snyk test --file=server/pom.xml --severity-threshold=high
```

Scan frontend (npm/yarn):

```
snyk test --file=app/h5/package.json --severity-threshold=high
```

## Monitor

```
snyk monitor
```

Sends a snapshot to the Snyk dashboard for ongoing vulnerability tracking.

## CI Integration

The `SNYK_TOKEN` secret must be set in GitHub repository settings under Settings > Secrets and variables > Actions. The CI workflow reads this token to authenticate with Snyk during the pipeline run.
