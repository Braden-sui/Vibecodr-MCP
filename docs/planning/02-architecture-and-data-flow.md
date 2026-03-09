# 02. Architecture and Data Flow

## Target Architecture

The implementation uses one shared ingest core with two source adapters.

- Source adapter A: Codex-origin package ingestion
- Source adapter B: ChatGPT-origin package ingestion
- Shared normalization: project package schema, file map, manifest defaults
- Shared publish orchestration: create or import -> files -> compile -> publish

## High-Level Components

1. ChatGPT App Surface
- MCP server with tool handlers
- Widget UI for review and user-confirmed actions
- OAuth-based account binding to vibecodr identity

2. Ingestion Service
- Accepts source package envelope
- Validates schema and file constraints
- Creates a draft capsule path using existing APIs

3. Vibecodr Integration Layer
- Calls existing vibecodr endpoints
- Applies retries, idempotency, and status polling
- Normalizes response payloads for UI and model use

4. Persistence and Jobs
- Import execution records
- Dedup and idempotency ledger
- Async status stream and retry policy

5. Security and Ops
- AuthN and authZ mapping
- Audit events
- Metrics, logs, and alerting

## Data Flow

1. User starts import in ChatGPT widget or Codex app.
2. Client sends source envelope to ingestion API.
3. Ingestion API validates and normalizes.
4. Ingestion API chooses path:
- Zip or repo import via existing import endpoints
- Direct draft path via capsules empty and file writes
5. Ingestion API returns draft capsuleId and status.
6. User reviews metadata and confirms compile.
7. Compile and publish endpoints are called.
8. Final result and canonical URLs are returned.

## Sequence Diagram (Mermaid Source)

sequenceDiagram
  participant U as User
  participant C as Client (Codex or ChatGPT Widget)
  participant I as Ingestion Service
  participant V as Vibecodr API
  participant J as Import Job Store

  U->>C: Submit creation package
  C->>I: POST /ingest (source envelope)
  I->>I: Validate and normalize payload
  alt Zip or repo path
    I->>V: POST /import/zip or /import/github
    V-->>I: jobId or capsule response
    I->>J: Persist import execution state
    I->>V: GET /import/jobs/:id
    V-->>I: Job status and capsule metadata
  else Direct draft path
    I->>V: POST /capsules/empty
    V-->>I: capsuleId
    loop For each file
      I->>V: PUT /capsules/:id/files/:path
      V-->>I: OK
    end
  end
  I-->>C: Draft capsule + status
  C->>I: Compile and publish request
  I->>V: POST /capsules/:id/compile-draft
  V-->>I: compile result
  I->>V: POST /capsules/:id/publish
  V-->>I: publish result
  I-->>C: Final publish metadata

## Cross-System Contracts

- Ingestion input contract: source envelope with sourceType, files, manifest hints, metadata, idempotencyKey.
- Ingestion output contract: operationId, capsuleId, state, diagnostics, publish preview metadata.
- Error contract: stable errorCode, userSafeMessage, retryable flag, traceId.

## Non-Functional Guardrails

- Idempotent re-entry for duplicate submissions.
- Strong request size and file count limits.
- Hardened timeout and cancellation for async imports.
- Structured telemetry with trace correlation across tool calls and vibecodr API calls.