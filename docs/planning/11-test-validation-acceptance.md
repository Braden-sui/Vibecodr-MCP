# 11. Test, Validation, and Acceptance Plan

## Validation Levels

Level 0 static validation:
- schema and type checks
- route and tool contract validation
- config sanity checks

Level 1 unit tests:
- adapter parsing
- status transition rules
- endpoint wrapper error mapping
- idempotency behavior

Level 2 integration tests:
- ingestion service to vibecodr API calls
- async import polling and cancellation
- compile and publish sequencing

Level 3 host loop tests:
- MCP inspector tool and resource validation
- ChatGPT developer mode manual and scripted runs
- widget to tool roundtrip checks

## Test Matrix

### Source Coverage

- codex_v1 valid package
- codex_v1 invalid package
- chatgpt_v1 file list import
- chatgpt_v1 zip import
- replayed idempotency key import

### Pipeline Coverage

- direct_files success and partial failure
- zip_import success and timeout
- github_import success and repo error
- compile success and compile failure
- publish success and publish failure

### Auth Coverage

- valid linked user
- auth challenge required
- account mismatch
- expired token
- revoked session

### Security Coverage

- path traversal attempts
- null byte path attempts
- oversized payload
- unsupported file type
- malicious metadata in render path

## Acceptance Gates

Gate A functional:
- all critical source and pipeline tests pass

Gate B reliability:
- retry and timeout behavior pass under load simulation
- no duplicate mutation for duplicate idempotency keys

Gate C security:
- no open high severity findings
- security controls verified by tests

Gate D launch readiness:
- observability dashboards populated
- runbooks validated in tabletop exercise
- submission dossier complete

## Pre-Launch Dry Runs

1. Internal dry run:
- 20 representative imports across both source types
- include at least 5 intentional failure scenarios

2. Beta dry run:
- allowlisted creator cohort
- monitor conversion from import to publish

3. Launch rehearsal:
- rollback toggle drill
- on-call alert drill with synthetic failures