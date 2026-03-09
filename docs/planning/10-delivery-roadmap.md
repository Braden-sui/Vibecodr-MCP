# 10. Delivery Roadmap

## Delivery Principles

- Build the shared ingest core first, then attach source channels.
- Keep mutating actions behind feature flags until reliability gates pass.
- Validate every milestone with explicit acceptance criteria.

## Milestone Plan

## Milestone 0: Foundations (Week 1)

Scope:
- repo scaffold for ingestion service and MCP app shell
- operation schema and base status engine
- endpoint wrapper stubs for vibecodr calls

Exit criteria:
- baseline compile and test pipeline green
- operation records can be created and queried

## Milestone 1: Codex Ingestion Path (Week 2)

Scope:
- codex_v1 adapter
- direct_files ingest path
- draft create and file write orchestration

Exit criteria:
- codex fixture imports produce draft_ready state
- idempotent retry does not duplicate writes

## Milestone 2: Async Import Path (Week 3)

Scope:
- zip and github import integration
- operation polling and cancellation
- resume operation capability

Exit criteria:
- async operations complete with stable status transitions
- timeout and cancel scenarios covered in tests

## Milestone 3: Compile and Publish (Week 4)

Scope:
- compile and publish tooling and orchestration
- diagnostics normalization
- final result envelope

Exit criteria:
- successful publish path from both source adapters
- compile and publish failure handling validated

## Milestone 4: ChatGPT App Integration (Week 5)

Scope:
- MCP tool registration
- widget status UI
- auth challenge and account link handling

Exit criteria:
- ChatGPT local developer mode flow works end-to-end
- widget and tool states stay synchronized

## Milestone 5: Security and Hardening (Week 6)

Scope:
- redaction and logging hardening
- rate limits and anomaly detection
- security test suite and fixes

Exit criteria:
- security acceptance criteria in security plan met
- no unresolved high severity issues

## Milestone 6: Submission and Launch Readiness (Week 7)

Scope:
- production deployment setup
- OpenAI submission dossier completion
- screenshots and test prompt evidence pack
- public surface minimization for widget and tool descriptors

Exit criteria:
- submission checklist complete
- go and no-go review passes
- first-run publish flow reads like one guided task instead of an operator console

## Cross-Milestone Workstreams

- Observability instrumentation starts in Milestone 0 and expands each phase.
- Documentation is updated at every milestone, not deferred to the end.
- Feature flags gate user exposure until hardening passes.

## Staffing Assumption

- 1 backend focused engineer
- 1 frontend or fullstack engineer for widget and UX
- founder oversight on product and launch gating

## Critical Path Dependencies

1. Auth contract before ChatGPT mutating tools
2. Operation store before async import orchestration
3. Endpoint wrappers before tool handlers
4. Observability before external beta rollout
