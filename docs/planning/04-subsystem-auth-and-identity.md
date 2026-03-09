# 04. Subsystem Plan: Auth and Identity

## Goal

Guarantee that every import, compile, and publish action is attributable to the correct vibecodr user, across Codex and ChatGPT surfaces.

## Existing Vibecodr Auth Capabilities To Leverage

- CLI token exchange endpoint: POST /auth/cli/exchange
- Route-scoped CLI grant enforcement in API auth middleware
- Existing OAuth provider framework and connection routes:
  - GET /me/connections
  - GET or POST /me/connections/:provider/start
  - DELETE /me/connections/:provider
  - GET /oauth/:provider/callback
- Internal route proxies for connections under /internal/me/connections and /internal/oauth

## Identity Model

- canonicalUserId: vibecodr user id in Clerk-backed auth
- sourceActor:
  - codex_actor for Codex app sessions
  - chatgpt_actor for ChatGPT app sessions
- accountLinkState:
  - linked
  - pending_link
  - mismatch
  - revoked

## Auth Paths

### Codex Path

1. User signs in via Codex-supported auth.
2. Client exchanges token using POST /auth/cli/exchange.
3. Ingestion calls only route-scoped endpoints allowed by CLI grants.
4. Token rotation occurs before expiry threshold.

### ChatGPT App Path

1. ChatGPT app requests tool requiring auth.
2. MCP server enforces securitySchemes and returns auth challenge when needed.
3. User completes vibecodr sign-in and consent.
4. MCP server stores session mapping and continues tool execution.

## Build Plan

### Phase A: Auth Contract

1. Define auth envelope for each tool request:
- subject
- sessionId
- source
- scopes
- expiry
2. Define session binding rules for widget and tool calls.
3. Define mismatch behavior when source account maps to a different vibecodr user.

Acceptance:
- no ambiguous user resolution
- deterministic error for identity mismatch

### Phase B: Token and Session Lifecycle

1. Implement token refresh checks and proactive renewal.
2. Add shared auth middleware for ingestion API and MCP server.
3. Add secure logout and revoke pathways.

Acceptance:
- repeated tool calls do not fail due to stale sessions
- revoked tokens fail closed

### Phase C: Audit and Abuse Controls

1. Emit auth.audit events on exchange, link, revoke, failure.
2. Add per-user and per-source rate limits on auth-sensitive endpoints.
3. Add anomaly flags for rapid account switching and repeated failed exchange.

Acceptance:
- suspicious patterns are observable in logs and metrics
- auth abuse does not leak privileged actions

## Failure Modes

- TOKEN_EXPIRED
- TOKEN_SCOPE_INSUFFICIENT
- ACCOUNT_LINK_REQUIRED
- ACCOUNT_LINK_MISMATCH
- AUTH_PROVIDER_UNAVAILABLE
- AUTH_CHALLENGE_REQUIRED

## Operational Notes

- Keep grants least privilege by default.
- Keep source to user mapping explicit and queryable for support.
- Never expose provider tokens to user code or widget runtime.