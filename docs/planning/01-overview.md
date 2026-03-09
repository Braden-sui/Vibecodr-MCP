# 01. Product Overview

## Objective

Build a production-grade upload application that lets creators import vibecoded projects from:

- Codex app sessions
- chatgpt.com creation flows

and publish them into vibecodr using existing capsule, draft, and publish infrastructure, with a first-class ChatGPT App integration.

## Core Problem

Today, vibecoded outputs are created across multiple surfaces, but there is no single import, normalization, and publish workflow that:

- understands source-specific metadata
- preserves files, runner, and entry intent
- maps identity to a vibecodr user safely
- gives deterministic publish status and recovery paths

## Product Outcomes

1. Users can import a creation and get a capsuleId in one guided flow.
2. Users can review and patch manifest metadata before compile.
3. Users can compile and publish with clear failure diagnostics.
4. ChatGPT App users can complete the flow from ChatGPT with secure auth.
5. Codex users can use an equivalent upload route with shared backend semantics.

## Ground-Truth Constraints From Vibecodr

- POST /capsules/empty supports initial draft creation.
- CLI grants are route-scoped and allow:
  - POST /capsules/empty
  - PUT /capsules/:id/files/*
  - POST /capsules/:id/compile-draft
  - POST /capsules/:id/publish
  - GET /me/drafts, GET /drafts/:id, DELETE /drafts/:id
- Import APIs exist:
  - POST /import/github
  - POST /import/zip
  - GET /import/jobs/:id
  - POST /import/jobs/:id/cancel
- Storage asset uploads exist:
  - POST /user/storage/assets?uploadTarget=public_cdn|dedicated
- OAuth connection system exists for providers including OpenAI.

## OpenAI Platform Requirements (Planning Baseline)

- MCP endpoint at /mcp for ChatGPT app connection.
- Tool descriptors must include accurate annotations:
  - readOnlyHint
  - destructiveHint
  - openWorldHint
- Widget resources must include CSP and domain metadata and should use the Apps bridge.
- Auth flows must align with securitySchemes and auth challenge semantics.
- Deployment and submission require production endpoint, policy assets, and test evidence.

## In Scope

- End-to-end ingest architecture and implementation plan
- OpenAI app, server, and widget plan
- Auth and identity mapping plan
- Data model, queue and job, observability, and security plans
- Delivery phases, acceptance gates, and rollback strategy

## Out of Scope (Phase 1)

- Replacing existing vibecodr compile and publish logic
- New social feed ranking mechanics
- New billing model changes beyond existing plan gates
- Building provider-specific source sync for every external platform

## Success Metrics

- Import success rate: >= 98% for valid project packages
- Publish success rate after import: >= 95%
- P95 ingest-to-draft time: <= 15s for median-sized projects
- P95 compile trigger latency: <= 3s
- Auth failure rate for ChatGPT app: < 2% after rollout hardening
- Zero P1 security incidents attributable to ingestion path

## Primary Risks

- Source payload variability from Codex vs ChatGPT output shape drift
- Auth and session mismatch between ChatGPT user and vibecodr account
- Partial writes during multi-file import
- Retry and idempotency gaps during tool re-invocation