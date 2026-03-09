import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.js";

function productionEnv(overrides: Record<string, unknown> = {}) {
  return {
    NODE_ENV: "production",
    APP_BASE_URL: "https://openai.vibecodr.space",
    VIBECDR_API_BASE: "https://api.vibecodr.space",
    SESSION_SIGNING_KEY: "x".repeat(32),
    OAUTH_PROVIDER_NAME: "clerk",
    OAUTH_CLIENT_ID: "client-id",
    OAUTH_ISSUER_URL: "https://clerk.vibecodr.space",
    OAUTH_SCOPES: "openid profile email offline_access",
    COOKIE_SECURE: "true",
    OPERATIONS_KV: {
      async get() {
        return null;
      },
      async put() {},
      async delete() {}
    },
    AUTH_CODE_COORDINATOR: {
      idFromName(name: string) {
        return name;
      },
      get() {
        return {
          async fetch() {
            return new Response("not implemented", { status: 501 });
          }
        };
      }
    },
    ...overrides
  };
}

test("production worker fails closed when persistent bindings are missing", async () => {
  const response = await worker.fetch(
    new Request("https://openai.vibecodr.space/health"),
    {
      NODE_ENV: "production",
      APP_BASE_URL: "https://openai.vibecodr.space",
      VIBECDR_API_BASE: "https://api.vibecodr.space",
      SESSION_SIGNING_KEY: "x".repeat(32),
      OAUTH_PROVIDER_NAME: "clerk",
      OAUTH_CLIENT_ID: "client-id",
      OAUTH_ISSUER_URL: "https://clerk.vibecodr.space",
      OAUTH_SCOPES: "openid profile email offline_access",
      COOKIE_SECURE: "true"
    }
  );

  assert.equal(response.status, 500);
  const body = await response.json() as { error?: string; traceId?: string };
  assert.equal(body.error, "Internal server error");
  assert.equal(typeof body.traceId, "string");
});

test("production worker initialize responds with the current MCP protocol version", async () => {
  const response = await worker.fetch(
    new Request("https://openai.vibecodr.space/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: {
            name: "vibecodr-mcp",
            version: "0.1.0"
          }
        }
      })
    }),
    productionEnv()
  );

  assert.equal(response.status, 200);
  const body = await response.json() as {
    result?: {
      protocolVersion?: string;
      capabilities?: { tools?: { listChanged?: boolean } };
    };
  };
  assert.equal(body.result?.protocolVersion, "2025-11-25");
  assert.equal(body.result?.capabilities?.tools?.listChanged, false);
});

test("production worker returns a structured auth challenge for protected tool calls without a session", async () => {
  const response = await worker.fetch(
    new Request("https://openai.vibecodr.space/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "mcp-protocol-version": "2025-11-25"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "quick_publish_creation",
          arguments: {}
        }
      })
    }),
    productionEnv()
  );

  assert.equal(response.status, 401);
  const authenticate = response.headers.get("www-authenticate") || "";
  assert.match(authenticate, /resource_metadata="https:\/\/openai\.vibecodr\.space\/\.well-known\/oauth-protected-resource\/mcp"/);
  assert.match(authenticate, /scope="openid profile email offline_access"/);
  const body = await response.json() as {
    error?: {
      data?: {
        authChallenge?: {
          authorizationUri?: string;
          resourceMetadataUri?: string;
          requiredScopes?: string[];
        };
      };
    };
  };
  assert.equal(body.error?.data?.authChallenge?.authorizationUri, "https://openai.vibecodr.space/authorize");
  assert.equal(body.error?.data?.authChallenge?.resourceMetadataUri, "https://openai.vibecodr.space/.well-known/oauth-protected-resource/mcp");
  assert.deepEqual(body.error?.data?.authChallenge?.requiredScopes, ["openid", "profile", "email", "offline_access"]);
});
