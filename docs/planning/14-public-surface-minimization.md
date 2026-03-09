# 14. Public Surface Minimization Plan

## Goal

Reduce the public ChatGPT app surface until it behaves like a single guided publish companion instead of a lightweight operator console.

This plan covers two related concerns:

1. public widget minimization
2. MCP tool-surface simplification

The target shape is:

- one obvious task: publish a vibe from the current conversation
- one optional polish layer: visibility, thumbnail, SEO
- one failure-only recovery layer: only shown when the flow breaks

## Why This Exists

The current build is functional, but it still exposes too much of the underlying workflow:

- widget sections still reveal package editing, import mode selection, and manual recovery controls
- the MCP catalog still advertises recovery primitives as first-class app actions
- the model can still talk like an operator because the app surface still looks like one

This conflicts with current OpenAI guidance around:

- extracting a focused job instead of porting a product surface
- optimizing for conversation instead of navigation
- using UI selectively for clarity, not for workflow control

References:

- [UX Principles](https://developers.openai.com/apps-sdk/concepts/ux-principles/)
- [UI Guidelines](https://developers.openai.com/apps-sdk/guides/ui-guidelines/)
- [Apps SDK Reference](https://platform.openai.com/docs/apps-sdk/reference)

## Current Public Surface

### Widget

Current public widget file:

- `src/web/widgetHtml.ts`

Publicly reachable sections still present in the widget:

1. `One connection, then the AI carries the launch`
2. `Publish this creation`
3. `Package source and raw payload`
4. `Optional finishing touches`
5. `Live publish story`
6. `Open live controls`
7. `Inspection and recovery`

Even when collapsed, items 3, 6, and 7 keep the surface shaped like a control panel.

### Tool Surface

Current public tool descriptors:

- `src/mcp/tools.ts`

Tools that currently read as public app verbs:

- `get_vibecodr_platform_overview`
- `get_guided_publish_requirements`
- `get_upload_capabilities`
- `list_import_operations`
- `get_import_operation`
- `watch_operation`
- `get_publish_readiness`
- `explain_operation_failure`
- `list_vibecodr_drafts`
- `get_vibecodr_draft`
- `start_creation_import`
- `compile_draft_capsule`
- `quick_publish_creation`
- `publish_draft_capsule`
- `cancel_import_operation`

This is too broad for a first-run user-facing ChatGPT app.

## Target Public Shape

### Widget: Public Default

The default widget should show only:

1. connection state
2. publish summary
3. current journey state
4. optional finishing touches

The user should be able to understand:

- what Vibecodr is
- what ChatGPT is about to do
- what is missing, if anything
- whether the vibe is live yet

The user should not need to understand:

- operation ids
- capsule ids
- import mode defaults
- compile versus publish orchestration
- raw payload shape

### Tool Surface: Public Default

The model should be biased toward a smaller public contract:

#### Primary public tools

1. `get_vibecodr_platform_overview`
- answer “what is Vibecodr?” with a canonical platform definition

2. `get_guided_publish_requirements`
- tell the model how to run the publish conversation

3. `quick_publish_creation`
- dominant first-run mutating path

4. `get_publish_readiness`
- explain whether anything still blocks launch

5. `get_vibecodr_draft`
- fetch one draft summary when the model needs a concrete state read

#### Secondary public tools

6. `list_vibecodr_drafts`
- only when the user explicitly asks to browse drafts

7. `start_creation_import`
- fallback when the model intentionally wants draft-first behavior

#### Recovery-only tools

These should remain implemented but should not read like primary app verbs:

- `watch_operation`
- `compile_draft_capsule`
- `publish_draft_capsule`
- `list_import_operations`
- `get_import_operation`
- `explain_operation_failure`
- `cancel_import_operation`

## Widget Minimization Plan

### Phase 1: Remove Public Control-Panel Language

Replace remaining dashboard-like section semantics with product semantics.

Current labels to replace or suppress:

- `Package source and raw payload`
- `Open live controls`
- `Inspection and recovery`

Target behavior:

- do not mention “payload”, “operation”, or “recovery” in the first view
- reserve those terms for explicit developer or failure contexts

### Phase 2: Progressive Disclosure Rules

The widget should render by state.

#### Before auth

Show:

- why the user is connecting
- what happens after connection

Hide:

- all package mutation controls
- all status controls
- all inspection controls

#### After auth, before failure

Show:

- publish summary
- launch polish
- live publish story

Hide:

- raw payload editing
- source/import controls
- operation browsing
- manual compile/publish buttons

#### After failure

Only then show:

- failure explanation
- one recovery action
- optional advanced recovery details

#### Developer mode only

Developer-only controls should render only when a dedicated app flag is true, not merely because the widget HTML contains them.

### Phase 3: Remove Raw JSON From the Public Flow

Current public widget still contains editable package JSON.

Target:

- summary-first by default
- raw JSON hidden behind a feature flag or failure-only repair path

Public users should never feel like the expected path is “edit this JSON blob”.

### Phase 4: Make Launch Polish Conditional

`Optional finishing touches` should remain available, but only expand when:

- the model asks for missing thumbnail or visibility details
- the user asks to customize launch metadata

Default quick publish should not visually depend on opening this section.

## Tool-Surface Simplification Plan

### Phase 1: Re-rank the Tool Catalog

Keep the implementation intact, but make the public app behavior publish-first.

Actions:

1. strengthen `quick_publish_creation` description as the default path
2. make `start_creation_import` explicitly secondary
3. make recovery tools describe themselves as inspection or repair paths, not normal workflow steps

### Phase 2: Add a Public vs Recovery Tool Taxonomy

In the codebase, separate tools into:

- public conversational tools
- repair and inspection tools

This can be done without removing the handlers by:

- grouping descriptors
- tightening descriptions
- registering recovery tools with more explicit advanced wording
- biasing internal model guidance away from them

### Phase 3: Normalize Outputs Around User Intent

All primary public tools should return:

- user-oriented state labels
- one clear next action
- no infrastructure jargon unless explicitly requested

Examples:

- `I couldn't determine which file starts the app.`
- `The draft is ready for launch.`
- `The vibe is live and shareable now.`

Not:

- `compile_failed`
- `capsuleId`
- `watch_operation failed`
- `Upstream API error 404`

### Phase 4: Make Recovery Tools Failure-Gated

Recovery tools should be invoked only when:

- the primary publish path failed
- the user explicitly asked to inspect internals
- the model has already attempted the guided path

This should be encoded in:

- tool descriptions
- `get_guided_publish_requirements`
- widget copy

## Concrete File Plan

### Widget

Primary file:

- `src/web/widgetHtml.ts`

Required changes:

1. state-gate advanced sections instead of merely collapsing them
2. remove raw payload editor from normal public rendering
3. only render live controls when operation state is failed or developer mode is enabled
4. only render inspection and recovery when failure state is active

### MCP Tool Descriptors and Guidance

Primary file:

- `src/mcp/tools.ts`

Required changes:

1. tighten tool descriptions around public vs repair semantics
2. update `get_guided_publish_requirements` to explicitly suppress repair tools during normal flows
3. update `get_upload_capabilities` so it no longer suggests payload-level steering as a normal first-run path
4. ensure public tool outputs stay summary-first and repair outputs stay plain-language

## Acceptance Criteria

This minimization work is complete when:

1. a first-run user sees only:
- connect
- publish
- optional polish
- live status

2. a first-run ChatGPT thread defaults to:
- `get_vibecodr_platform_overview` for platform explanation
- `quick_publish_creation` for publish actions
- `get_publish_readiness` for launch blockers

3. the widget does not visually present:
- raw JSON editing
- operation ids
- compile/publish/watch buttons
- inspection lists

unless the flow is in failure state or developer mode.

4. failure responses are phrased as user-facing explanations instead of internal status names.

5. the connector feels like:
- one guided publish companion

not:

- a dashboard with hidden controls.

## Implementation Order

1. Widget state gating
2. Tool descriptor re-ranking
3. Plain-language output normalization
4. Failure-only recovery reveal
5. New screenshot pass for submission evidence
