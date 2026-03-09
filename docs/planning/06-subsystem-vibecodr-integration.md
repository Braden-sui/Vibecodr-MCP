# 06. Subsystem Plan: Vibecodr API Integration

## Goal

Integrate with existing vibecodr endpoints without introducing unnecessary new backend surface area.

## Endpoint Mapping Plan

### Draft and File Pipeline

- POST /capsules/empty
- PUT /capsules/:id/files/:path
- GET /capsules/:id/files-summary
- GET /capsules/:id/manifest
- PATCH /capsules/:id/manifest

### Compile and Publish Pipeline

- POST /capsules/:id/compile-draft
- POST /capsules/:id/publish

### Import Pipeline

- POST /import/zip
- POST /import/github
- GET /import/jobs/:id
- POST /import/jobs/:id/cancel

### Draft Recovery and Session Continuity

- GET /me/drafts
- GET /drafts/:id
- DELETE /drafts/:id
- POST /drafts/:id/open-in-studio

### Optional Asset Upload Support

- POST /user/storage/assets with uploadTarget query param:
  - public_cdn
  - dedicated

## Integration Wrapper Layer

Implement one wrapper module per endpoint family with:

- input schema validation
- typed response parsing
- idempotency key support where applicable
- standardized error mapping
- retry policy by endpoint class

Wrapper families:
- CapsulesClient
- ImportsClient
- DraftsClient
- StorageAssetsClient
- AuthClient

## Build Plan

### Phase A: Client Contracts

1. Define request and response interfaces based on current route behavior.
2. Add adapter mapping between normalized package and vibecodr request shapes.
3. Add safe defaults for manifest title, runner, and entry.

Acceptance:
- no direct raw fetch calls from tool handlers
- all endpoint calls pass through typed clients

### Phase B: Reliability Features

1. Add retry policy:
- no retry on validation errors
- bounded retry on network and 5xx errors
2. Add timeout policy per endpoint class.
3. Add trace propagation headers for cross-service debugging.

Acceptance:
- retry behavior deterministic and test-covered
- failed operations include upstream endpoint and status in diagnostics

### Phase C: Data Consistency Rules

1. Draft creation must occur before file writes.
2. File writes are ordered and tracked.
3. Compile cannot run until file writes complete.
4. Publish cannot run until compile success.

Acceptance:
- state machine prevents invalid transitions
- transition errors are explicit and recoverable

## Future API Enhancements (Optional, Not Required for MVP)

- bulk file upload endpoint to reduce N requests
- direct import from standardized source envelope endpoint
- richer compile diagnostics endpoint for UI rendering