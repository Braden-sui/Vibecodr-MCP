# OpenAI Apps Compliance Matrix

Last reviewed: 2026-03-05

## Sources

- https://developers.openai.com/apps-sdk/concepts/ux-principles
- https://developers.openai.com/apps-sdk/concepts/ui-guidelines
- https://developers.openai.com/apps-sdk/build/mcp-server
- https://developers.openai.com/apps-sdk/reference
- https://developers.openai.com/apps-sdk/deploy/submission
- https://developers.openai.com/apps-sdk/app-submission-guidelines

## Scope

This document tracks the current Vibecodr.Space ChatGPT app against the OpenAI Apps SDK guidance. It separates code-level compliance from manual submission evidence that still has to be collected in ChatGPT.

## Code-level compliance

### MCP server and tool metadata

- MCP endpoint is reachable at `/mcp`.
- Tool descriptors use explicit input and output schemas.
- Public read tools advertise `noauth`.
- Authenticated tools advertise `oauth2` and return a validated auth-challenge shape when connection is required.
- Tool annotations distinguish read-only, destructive, and idempotent behavior.
- Widget resource is registered with `text/html;profile=mcp-app` and includes widget metadata, domain, and CSP.

### Conversational flow and tool design

- The primary public path is `quick_publish_creation`.
- The app now supports a second resource-centric loop for already-live vibes: list, inspect, share, and refine metadata without restarting the publish flow.
- Recovery tools remain implemented but are explicitly described as advanced recovery only.
- Guided-publish instructions tell the model to ask only for missing launch details and to keep the user out of workflow internals.
- Plain-language failure translation is centralized so model-visible outputs do not default to raw internal status text.

### UI guidelines

- The inline widget defaults to a neutral, ChatGPT-native state.
- The connection card is hidden by default and only appears after an auth challenge or in advanced mode.
- The public surface keeps one primary action and one optional secondary action.
- Advanced payload editing and recovery controls are hidden behind advanced mode.
- The widget uses restrained motion and a flatter visual system.
- The widget now renders explicit live-vibe, engagement, and share states instead of collapsing successful publish flows into a generic status view.

### Privacy and response minimization

- Public tools no longer mark themselves as OAuth-only when they are not.
- Public publish/readiness outputs expose public launch state instead of always exposing internal operation identifiers.
- Recovery-only tools still return operation identifiers because those identifiers are required to continue manual repair flows.

## Manual evidence still required

These items cannot be closed by source changes alone.

- Capture current screenshots from a fresh ChatGPT thread after refreshing the app.
- Record direct, indirect, and negative routing prompts and outcomes.
- Record a real end-to-end authenticated publish run in ChatGPT.
- Record a plain-language failure run in ChatGPT.
- Attach the evidence pack to the submission bundle.
- Final manual review of privacy-policy, terms, support, and branding URLs in the actual submission form.

## Submission readiness interpretation

The codebase is now aligned with the OpenAI Apps SDK guidance to the fullest extent feasible inside the repository. Remaining gaps are evidence and operator signoff items, not architecture or implementation gaps.
