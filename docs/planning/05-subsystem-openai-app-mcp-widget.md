# 05. Subsystem Plan: OpenAI App, MCP Server, and Widget

## Goal

Ship a ChatGPT App integration that lets users upload and publish vibecoded creations from chatgpt.com while staying aligned with Apps SDK requirements.

## App Archetype

Primary archetype: interactive-decoupled

Rationale:
- mutating operations with user confirmation
- a widget that visualizes import and publish status
- separation of data tools and render tools for model reliability

## Required OpenAI Compliance Surface

1. MCP endpoint reachable at /mcp over HTTPS.
2. Tool descriptors with accurate impact hints:
- readOnlyHint
- destructiveHint
- openWorldHint
3. Widget resource metadata:
- CSP allowlists
- domain setting for hosted widget
- widget description and invocation status strings where relevant
4. Auth integration:
- securitySchemes declaration
- auth challenge semantics for unauthorized calls
5. Submission artifacts:
- metadata, policy URLs, screenshots, test prompts and outputs

## Tool Surface Plan

### Read-Only Tools

1. get_upload_capabilities
- returns supported source types, max sizes, runner options
- annotations: readOnly true, destructive false

2. list_import_operations
- returns recent operations and statuses

3. get_import_operation
- returns one operation detail with diagnostics and next actions

### Mutating Tools

1. start_creation_import
- input: sourceType, payloadRef or files, manifest hints
- starts ingest operation and returns operationId and draft capsuleId

2. retry_creation_import
- retries a failed operation from last checkpoint

3. compile_draft_capsule
- input: capsuleId
- executes compile-draft path

4. publish_draft_capsule
- input: capsuleId
- executes publish path and returns canonical published references

5. cancel_import_operation
- cancels async operation when supported

## Widget Plan

Widget states:
- idle
- validating
- importing
- review_draft
- compile_running
- publish_running
- done
- failed

Widget responsibilities:
- user-visible status timeline
- file and manifest preview
- explicit user confirmation on mutating actions
- retry and resume actions

## Build Plan

### Phase A: MCP Server Skeleton

1. Register /mcp transport and tool catalog.
2. Implement typed input and output schemas for all tools.
3. Implement auth middleware and unauthorized challenge handling.
4. Implement structured result envelopes for model and widget consumption.

Acceptance:
- MCP inspector shows full tool descriptors
- unauthorized tool call returns correct challenge semantics

### Phase B: Tool Handler Wiring

1. Wire read-only tools to operation store.
2. Wire mutating tools to ingestion orchestrator.
3. Add idempotency key propagation on mutating tools.
4. Add retries only for safe retry categories.

Acceptance:
- repeated tool invocation does not duplicate import actions
- tool outputs include actionable diagnostics

### Phase C: Widget Integration

1. Register widget resource URI and metadata.
2. Implement bridge listeners for tool results.
3. Render structured status and next actions.
4. Add guarded action buttons that call tools with explicit user intent.

Acceptance:
- widget updates after every tool transition
- no stale or mismatched operation state in UI

### Phase D: Hardening and Submission Readiness

1. Validate CSP and allowed domains.
2. Validate production deployment URL and TLS.
3. Build submission screenshots and prompt set.
4. Run submission checklist and final dry run.

Acceptance:
- all required submission data fields complete
- review test prompts pass end-to-end

## Suggested Tool Annotation Matrix

- get_upload_capabilities: readOnly yes, destructive no, openWorld no
- list_import_operations: readOnly yes, destructive no, openWorld no
- get_import_operation: readOnly yes, destructive no, openWorld no
- start_creation_import: readOnly no, destructive no, openWorld yes
- retry_creation_import: readOnly no, destructive no, openWorld yes
- compile_draft_capsule: readOnly no, destructive no, openWorld no
- publish_draft_capsule: readOnly no, destructive yes, openWorld no
- cancel_import_operation: readOnly no, destructive yes, openWorld no