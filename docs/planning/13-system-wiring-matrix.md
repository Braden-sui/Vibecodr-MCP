# 13. System Wiring Matrix

## Purpose

Define explicit interfaces between major systems so implementation teams can build in parallel with stable contracts.

## Interface Matrix

| Producer | Consumer | Interface | Contract Owner | Notes |
| --- | --- | --- | --- | --- |
| Source adapters | Ingestion orchestrator | NormalizedCreationPackage | Ingestion | strict schema versioning |
| Ingestion orchestrator | Vibecodr integration layer | Endpoint wrapper calls | Backend | no raw fetch in handlers |
| Vibecodr integration layer | Operation store | status and diagnostics updates | Backend | includes endpoint and upstream status |
| Operation store | MCP read-only tools | operation list and detail queries | Backend | pagination required |
| MCP mutating tools | Ingestion orchestrator | action commands with idempotency | App server | explicit user intent required |
| MCP server | Widget | structured content and widget metadata | App server and frontend | no sensitive data in model-visible text |
| Auth subsystem | MCP server and ingestion API | resolved user identity and scope claims | Auth | fail closed on mismatch |
| Observability | All services | traceId, operationId, metrics tags | Platform | common logging schema |

## Event and Command Contracts

### Commands

- StartImportCommand
- RetryImportCommand
- CompileCapsuleCommand
- PublishCapsuleCommand
- CancelImportCommand

### Events

- ImportReceived
- ImportValidated
- ImportDraftReady
- ImportFailed
- CompileStarted
- CompileFailed
- PublishStarted
- Published

## Versioning Rules

- contract version is included in command payload and adapter output
- backwards compatibility for one minor version window
- breaking changes require feature flag and dual parser period

## Implementation Sequence For Wiring

1. Finalize normalized package schema and status enum.
2. Implement operation store and transition validator.
3. Implement endpoint wrappers and integration tests.
4. Wire MCP tools to orchestrator commands.
5. Wire widget to read and mutation tools with optimistic state disabled by default.