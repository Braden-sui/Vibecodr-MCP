# Submission Test Prompts

These prompts are organized into direct, indirect, and negative-routing coverage as recommended by Apps SDK metadata testing guidance.

## Direct routing prompts

1. Prompt:
- Show me upload capabilities for Vibecodr publishing.

Expected:
- Uses `get_upload_capabilities`.
- Returns source types, import modes, limits, and `recommendedFirstRunFlow=quick_publish_creation`.

2. Prompt:
- Quick publish this ChatGPT app payload as a public vibe with compile enabled.

Expected:
- Uses `quick_publish_creation`.
- Returns step timeline (`import`, optional `wait_for_draft`, `compile`, `publish`) and final published status.

3. Prompt:
- Watch operation <operationId> until draft_ready.

Expected:
- Uses `watch_operation`.
- Returns polling result with elapsed time and `targetStatuses` context.

4. Prompt:
- Is operation <operationId> ready to publish?

Expected:
- Uses `get_publish_readiness`.
- Returns checks with blocking/warning/pass levels and recommended next actions.

5. Prompt:
- Explain why operation <operationId> failed and what I should do next.

Expected:
- Uses `explain_operation_failure`.
- Returns plain-language cause, retryability, and concrete next actions.

## Indirect routing prompts

1. Prompt:
- I generated an app in ChatGPT and want it live on Vibecodr in one step.

Expected:
- Routes to `quick_publish_creation` without requiring user to name the tool.

2. Prompt:
- My publish is stuck waiting on import job completion.

Expected:
- Routes to `watch_operation` (or recommends it).

3. Prompt:
- Should I compile before publishing this draft?

Expected:
- Routes to `get_publish_readiness` and surfaces compile recommendation.

4. Prompt:
- Publishing failed. Help me recover without starting over.

Expected:
- Routes to `explain_operation_failure` and provides remediation steps.

## Negative prompts (should not route)

1. Prompt:
- Write me a poem about JavaScript closures.

Expected:
- No Vibecodr tool invocation.

2. Prompt:
- Book me a flight to Denver.

Expected:
- No Vibecodr tool invocation.

3. Prompt:
- What is 234 * 912?

Expected:
- No Vibecodr tool invocation.

4. Prompt:
- Translate this paragraph to French.

Expected:
- No Vibecodr tool invocation.
