# schemathesis Property-Based API Testing

## Install

```
pip install schemathesis
```

## Run

```
schemathesis run --config tools/schemathesis/config.yml
```

## What It Tests

schemathesis auto-generates inputs from the OpenAPI spec and verifies:

- No endpoint returns a 5xx server error under any generated input.
- Every response status code matches the spec declaration.
- Every response Content-Type matches the spec declaration.
- Every response body conforms to the declared JSON schema.

## Prerequisites

The backend must be running and springdoc must expose the OpenAPI spec at `/v3/api-docs`. Task C+-D-02 (springdoc setup) must be completed before schemathesis can produce meaningful results — without a valid spec, the tool has nothing to generate inputs from.

## CI Integration

Runs in the `full-test.yml` workflow after the backend health check passes.
