# Vibecodr Upload App: Planning Document Set

This folder contains the end-to-end implementation plan for a new application that lets users upload vibecoded creations from:

- Codex app workflows
- chatgpt.com workflows via ChatGPT App and widget

This plan is grounded in:

- Existing Vibecodr platform APIs and auth patterns from the main Vibecodr codebase
- Current OpenAI Apps SDK build, deploy, and submission guidance:
  - [Build MCP Server](https://developers.openai.com/apps-sdk/build/mcp-server/)
  - [Build ChatGPT UI](https://developers.openai.com/apps-sdk/build/chatgpt-ui/)
  - [Examples](https://developers.openai.com/apps-sdk/build/examples/)
  - [Plan Tools](https://developers.openai.com/apps-sdk/plan/tools/)
  - [Reference](https://developers.openai.com/apps-sdk/reference/)
  - [Quickstart](https://developers.openai.com/apps-sdk/quickstart/)
  - [Deploy](https://developers.openai.com/apps-sdk/deploy/)
  - [Connect from ChatGPT](https://developers.openai.com/apps-sdk/deploy/connect-from-chatgpt/)
  - [Submission](https://developers.openai.com/apps-sdk/deploy/submission/)
  - [App Submission Guidelines](https://developers.openai.com/apps-sdk/app-submission-guidelines/)

## Document Index

1. [01-overview](01-overview.md)
2. [02-architecture-and-data-flow](02-architecture-and-data-flow.md)
3. [03-subsystem-ingestion-adapters](03-subsystem-ingestion-adapters.md)
4. [04-subsystem-auth-and-identity](04-subsystem-auth-and-identity.md)
5. [05-subsystem-openai-app-mcp-widget](05-subsystem-openai-app-mcp-widget.md)
6. [06-subsystem-vibecodr-integration](06-subsystem-vibecodr-integration.md)
7. [07-subsystem-data-model-jobs-storage](07-subsystem-data-model-jobs-storage.md)
8. [08-subsystem-security-compliance](08-subsystem-security-compliance.md)
9. [09-subsystem-observability-ops](09-subsystem-observability-ops.md)
10. [10-delivery-roadmap](10-delivery-roadmap.md)
11. [11-test-validation-acceptance](11-test-validation-acceptance.md)
12. [12-openai-submission-dossier](12-openai-submission-dossier.md)
13. [13-system-wiring-matrix](13-system-wiring-matrix.md)
14. [14-public-surface-minimization](14-public-surface-minimization.md)

## Templates

- [OpenAI Submission Payload Template](templates/openai-submission-payload.template.json)
- [Tool Catalog Template](templates/tool-catalog.template.yaml)
- [Environment Matrix Template](templates/environment-matrix.template.md)
