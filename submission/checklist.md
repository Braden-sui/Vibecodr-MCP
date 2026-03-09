# Submission Checklist

- [ ] Production MCP endpoint is public HTTPS and reachable.
- [ ] OAuth flow works end-to-end using production callback URL.
- [ ] All tool descriptors load in ChatGPT developer mode.
- [ ] Widget renders and updates after tool results.
- [ ] Privacy policy URL is public and accurate.
- [ ] Terms URL is public and accurate.
- [ ] Support email is monitored.
- [ ] Screenshots captured for key flows.
- [ ] Direct, indirect, and negative-routing prompts executed and output recorded.
- [ ] Live-vibe management prompts executed and output recorded (list live vibes, inspect one vibe, share link, engagement summary, metadata update).
- [ ] Oversize-body (`413`) and rate-limit (`429`) safeguards validated in production-like environment.
- [ ] Error traces (`traceId`/`errorId`) are visible and logged for support/debug.
- [ ] `npm run security:regression` passes and captured evidence is attached to the submission bundle.
- [ ] Observability alerts are visible at `/health/observability` and `/api/observability/summary`.
- [ ] Security review complete (no unresolved high severity issues).
