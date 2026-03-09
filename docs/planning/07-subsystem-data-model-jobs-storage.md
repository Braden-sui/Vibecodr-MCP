# 07. Subsystem Plan: Data Model, Jobs, and Storage

## Goal

Provide durable operation tracking, resumability, and clear status semantics across synchronous and asynchronous import flows.

## Core Entities

### ImportOperation

- operationId
- userId
- sourceType
- sourceReference
- status
- capsuleId nullable
- importJobId nullable
- currentStage
- diagnostics json
- idempotencyKey
- createdAt
- updatedAt
- completedAt nullable

### ImportOperationEvent

- eventId
- operationId
- eventType
- stage
- message
- data json
- createdAt

### ImportArtifactSnapshot

- operationId
- capsuleId
- manifestSnapshot json
- fileCount
- totalBytes

## Status State Machine

- received
- validating
- normalized
- ingesting
- waiting_on_import_job
- draft_ready
- compile_running
- compile_failed
- publish_running
- published
- failed
- canceled

Terminal states:
- published
- failed
- canceled

## Build Plan

### Phase A: Schema and Access Layer

1. Define D1 schema for operation entities.
2. Add indexes:
- userId + createdAt
- idempotencyKey unique by user
- status
3. Add repository layer with strict typed methods.

Acceptance:
- duplicate idempotencyKey returns existing operation
- list and get performance acceptable under expected load

### Phase B: Operation Engine

1. Implement operation creation and stage transition service.
2. Enforce allowed transitions.
3. Persist diagnostics payload snapshots per transition.

Acceptance:
- invalid transitions blocked
- transitions always generate an operation event

### Phase C: Async Job Coordination

1. Store importJobId when using import endpoints.
2. Poll import job status with adaptive backoff.
3. Support cancellation when status permits.
4. Support manual resume by operationId.

Acceptance:
- async operations survive worker restarts
- polling and cancellation paths are test-covered

## Storage Policies

- Keep operation event records for support and audit window.
- Keep operation core records longer for analytics and dedup.
- Redact or hash sensitive source metadata in stored diagnostics.

## Data Quality Rules

- status and stage are always synchronized
- every failure stores errorCode and retryable
- published state requires capsuleId and publish metadata