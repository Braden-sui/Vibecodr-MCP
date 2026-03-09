# Vibecodr OpenAI App

## Purpose

The OpenAI app turns a generated application into a live Vibecodr vibe with as little user-side coordination as possible.

The intended product loop is:

1. understand what the app is
2. gather only missing launch details
3. confirm publish
4. publish publicly by default
5. return the live vibe, share path, and next best action

## Core user experience

The assistant should behave like a launch partner, not an operator console.

It should:
- describe Vibecodr as a social platform where code runs as content
- default to public vibes unless the user asks otherwise
- proactively offer launch polish for public launches
- use account capabilities before promising premium features
- explain failures in product language
- pivot to shareability and engagement after publish

## Widget

The shared widget resource is:
- `ui://widget/publisher-v1`

It is used across:
- platform overview
- guided publish requirements
- launch best practices
- pulse setup guidance
- account capabilities
- draft and publish-readiness states
- publish success and failure states

The default widget route is compact and public-safe.
Advanced controls are available only behind:
- `/widget?advanced=1`

Live-vibe management reads and small post-publish mutations should prefer ChatGPT's compact native tool card instead of forcing the full embedded widget.

## OAuth and account linking

ChatGPT app mode can continue using the current Clerk-backed OAuth client configuration.

The generic MCP compatibility layer does not replace Clerk. It exists so MCP clients can complete OAuth without manual token entry.

## Launch defaults

- visibility defaults to `public`
- cover image generation or upload should be proactively offered for public launches
- uploaded launch art should follow the target vibe visibility automatically, keeping private vibe covers in the private lane
- when generating cover art, default to a large landscape image (`1536x1024` when available; otherwise at least `1200x675`) and never tiny icon-sized outputs
- when the user provides an image inside ChatGPT, prefer the OpenAI-hosted file reference path over base64
- if inline base64 is the only remaining option, keep the raw file under `900 KB` so the MCP payload stays reliable
- custom SEO/social preview should be offered when account capabilities allow it
- pulses should be suggested only when the app genuinely needs trusted server-side work

## Recommended prompt probes

- `What is Vibecodr?`
- `Publish this app to Vibecodr. Ask me only for the missing details and handle the rest.`
- `What launch polish should we do before publishing this publicly?`
- `This app needs server logic. Should it use pulses or stay frontend-only?`
- `List my live vibes.`
- `Show me the share link for my latest vibe.`

## Submission and evidence

For the final OpenAI app submission, capture:
- platform overview explanation
- guided publish start
- compact widget default state
- launch polish state
- publish in progress
- publish success
- failure plain-language state
- negative routing
- live vibe and engagement state
