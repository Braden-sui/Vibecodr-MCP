# Observability Dashboard Spec

## Primary Panels

1. Import funnel
- `imports_started_total`
- `imports_completed_total`
- `imports_failed_total`

2. Failure by source type
- `imports_failed_total` grouped by `sourceType`
- `compile_failures_total` grouped by `sourceType`
- `publish_failures_total` grouped by `sourceType`

3. Latency
- `http_request_latency_ms` by endpoint
- `upstream_request_latency_ms` by endpoint
- `import_stage_duration_ms` by stage and source type

4. Auth health
- `auth_challenge_total`
- `auth_failure_total`

5. Idempotency and retry pressure
- `duplicate_idempotency_hits_total`
- recent `operation.lifecycle.failure` events with high `retryCount`

## Suggested Alert Thresholds

- P1: publish failure ratio above 20 percent for 10 minutes
- P1: auth failure count above baseline by 5x for 10 minutes
- P2: import stage p95 above 2x normal baseline
- P2: repeated `IMPORT_JOB_POLL_ERROR` for same operation more than 3 times

## Event Filter Keys

- `traceId`
- `operationId`
- `userHash`
- `sourceType`
- `stage`
- `status`
- `endpoint`
- `errorCode`
