# Review Notes

## App purpose
This app imports vibecoded projects from Codex and ChatGPT, then compiles and publishes them to the authenticated user's Vibecodr account.

## Auth model
OAuth account link flow obtains provider access token, exchanges through Vibecodr CLI exchange endpoint, and stores a short-lived session cookie.

## Data handling
- Raw file payloads validated before mutation.
- Path traversal and malformed file paths are blocked.
- Session cookie is HTTP-only.
- Sensitive tokens are not returned in tool outputs.

## Operational safeguards
- Idempotency key support on import creation path.
- Operation status tracking and diagnostics.
- Cancel and retry support for import operations.
- One-shot first-run flow via `quick_publish_creation` with optional watch/readiness fallback tools.
- Plain-language failure recovery via `explain_operation_failure`.
- Tool `outputSchema` declarations plus runtime `structuredContent` validation.
- Structured tool errors include `errorId`; gateway/MCP errors include `traceId` + `x-trace-id`.
- Fixed-window abuse controls on gateway + stricter `/mcp` request limits.
- Cloudflare Worker `ratelimits` bindings enabled for cross-isolate enforcement in production.
- Configurable request body size guardrail with deterministic `413 REQUEST_BODY_TOO_LARGE` behavior.
- Structured telemetry now covers auth, HTTP requests, MCP/tool calls, operation lifecycle transitions, and upstream Vibecodr latency/status.
- Support endpoints: `/health/observability` and authenticated `/api/observability/summary`.
- Active anomaly alerts are included in observability summaries for operator triage.
- Regression command `npm run security:regression` exercises guardrails and observability contracts against the built runtime.
