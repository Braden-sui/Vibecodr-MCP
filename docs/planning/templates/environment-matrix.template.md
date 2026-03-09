# Environment Matrix Template

## Runtime Environments

| Environment | Base URL | MCP URL | Auth Mode | Data Source | Feature Flags | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| local | http://localhost:3000 | https://<tunnel>/mcp | dev auth | local fixtures + dev API | all off by default | ChatGPT dev mode uses tunnel |
| staging | https://staging.<domain> | https://staging.<domain>/mcp | staging auth | staging vibecodr API | selective on | pre-prod validation |
| production | https://<domain> | https://<domain>/mcp | prod auth | prod vibecodr API | controlled rollout | launch and submission |

## Required Environment Variables

| Key | Scope | Required | Description | Example |
| --- | --- | --- | --- | --- |
| APP_BASE_URL | server | yes | public app base URL | https://uploads.vibecodr.space |
| MCP_PATH | server | yes | mcp route path | /mcp |
| VIBECDR_API_BASE | server | yes | vibecodr public API base | https://api.vibecodr.space |
| CLERK_PUBLISHABLE_KEY | client | yes | auth client key | pk_live_xxx |
| CLERK_SECRET_KEY | server | yes | auth server key | sk_live_xxx |
| CONNECTION_OPENAI_CLIENT_ID | server | conditional | OpenAI provider client id | openai_client_id |
| SESSION_SIGNING_KEY | server | yes | session signing key | random secret |
| ENABLE_CHATGPT_IMPORT_PATH | server | yes | feature flag | true or false |
| ENABLE_CODEX_IMPORT_PATH | server | yes | feature flag | true or false |
| ENABLE_PUBLISH_FROM_CHATGPT | server | yes | feature flag | true or false |

## External Domains For CSP and Egress

| Domain | Purpose | Required Stage |
| --- | --- | --- |
| api.vibecodr.space | upstream API calls | all |
| auth.openai.com | provider oauth exchange if used | staging and production |
| api.openai.com | provider host allowlist for OpenAI connections | staging and production |
| static asset domain | widget assets | all |

## Deployment Validation Checklist

- health endpoint responds
- mcp endpoint reachable over https
- auth challenge behavior verified
- tool catalog loads in ChatGPT app settings
- widget renders and updates state