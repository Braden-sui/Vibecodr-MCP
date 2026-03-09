# 09. Subsystem Plan: Observability and Operations

## Goal

Make every import and publish attempt debuggable in production with traceable state, metrics, and actionable alerts.

## Observability Strategy

### Structured Logging

Log fields for every operation event:

- traceId
- operationId
- userId hash or internal id
- sourceType
- stage
- status
- endpoint
- latencyMs
- retryCount
- errorCode nullable

### Metrics

Core metrics:

- imports_started_total
- imports_completed_total
- imports_failed_total
- import_stage_duration_ms by stage
- compile_failures_total
- publish_failures_total
- auth_challenge_total
- auth_failure_total
- duplicate_idempotency_hits_total

SLO metrics:

- import_success_rate
- p95_time_to_draft_ready
- p95_time_to_published

### Tracing

- propagate traceId from client to ingestion to vibecodr calls
- include upstream status and endpoint tags
- include operationId on all spans

## Alerts

P1 alerts:

- sustained publish failure rate above threshold
- auth failure spike with possible outage pattern
- ingestion validation bypass or anomaly signal

P2 alerts:

- elevated import job timeout rate
- elevated compile failure rate by sourceType
- repeated retry storm for single operation

## Runbooks

1. Import stuck in waiting_on_import_job
- verify importJobId in operation record
- query GET /import/jobs/:id
- cancel or resume based on upstream state

2. Publish failures spike
- inspect compile result payloads
- identify dominant errorCode
- execute rollback flag for affected path

3. Auth challenges looping
- verify security scheme config
- verify callback URI and session store health

## Feature Flags and Rollout Controls

- enable_chatgpt_import_path
- enable_codex_import_path
- enable_publish_from_chatgpt
- enable_async_polling_engine

Progressive rollout:

1. internal staff
2. allowlisted creators
3. percentage rollout
4. full availability

## Operational Acceptance Criteria

- every failed operation includes traceId and actionable errorCode
- alerts route to on-call with clear runbook links
- can pause mutating tools without taking down read-only tools