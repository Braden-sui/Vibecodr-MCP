# 08. Subsystem Plan: Security and Compliance

## Goal

Ship the upload system with least privilege, strict input validation, and auditability across both source channels.

## Threat Model Highlights

### Trust Boundaries

1. Client boundary:
- Codex app client
- ChatGPT widget client

2. Service boundary:
- Ingestion API and MCP server

3. Upstream boundary:
- vibecodr public API and internal APIs

### Primary Threats

- malformed archive and path traversal payloads
- token misuse or scope escalation
- replay and duplicate mutation attempts
- prompt injection through source metadata rendered in UI
- data leakage through logs and diagnostics

## Security Controls

### Input and Payload Controls

- strict schema validation before any mutation
- canonical path enforcement on all file paths
- byte size and file count limits
- explicit allowed file type policy for asset uploads

### Auth and Authorization Controls

- route-scoped grants for CLI path
- source session to vibecodr account binding
- explicit challenge flow for unauthenticated ChatGPT tool calls
- token expiry and refresh guardrails

### Idempotency and Replay Controls

- required idempotency key on mutating operations
- dedup by userId plus idempotencyKey
- bounded request replay window

### Data Protection Controls

- do not log raw source file content
- redact secrets and access tokens in all logs
- encrypt sensitive operation metadata at rest when required
- isolate widget-only sensitive data from model-visible content

### UI and Prompt Safety Controls

- sanitize any user-provided markdown or HTML before rendering
- treat host-delivered tool output as untrusted
- never execute source code during preview stage

## Compliance and Policy Artifacts

- privacy policy URL and support contact required for submission
- terms and acceptable use alignment for uploaded content handling
- incident response runbook for abuse reports and malware payloads

## Build Plan

### Phase A: Security Baseline

1. Add centralized validation and sanitization library.
2. Add secure logging formatter with redaction.
3. Add auth guard middleware for all mutation routes.

### Phase B: Hardening

1. Add rate limits by user and source type.
2. Add suspicious behavior detection and alerting.
3. Add security regression tests for path and payload exploits.

### Phase C: Operational Security

1. Rotate app secrets and signing keys on schedule.
2. Add audit dashboard for failed auth and repeated mutation retries.
3. Add documented breach and abuse handling workflow.

## Security Acceptance Criteria

- no known path traversal or null-byte bypass
- no token leakage in app or server logs
- no unauthorized mutation from unauthenticated tool call
- all high-severity findings addressed before launch