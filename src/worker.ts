import { createHash } from "node:crypto";
import { loadConfigFromSource, type AppConfig } from "./config.js";
import { jsonResponse } from "./lib/http.js";
import { AuthorizationCodeCoordinator } from "./auth/authorizationCodeCoordinator.js";
import { SessionRevocationStore } from "./auth/sessionRevocationStore.js";
import { SessionStore } from "./auth/sessionStore.js";
import { OauthStateStore } from "./auth/oauthStateStore.js";
import { OperationStoreKv, type KvNamespaceLike } from "./storage/operationStoreKv.js";
import { VibecodrClient } from "./vibecodr/client.js";
import { ImportService } from "./services/importService.js";
import { createAppRequestHandler, type AppRequestHandler } from "./app.js";
import { Telemetry } from "./observability/telemetry.js";

type FetcherLike = {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
};

type CloudflareRateLimitBinding = {
  limit(options: { key: string }): Promise<{ success: boolean }>;
};

type AnalyticsEngineDataset = {
  writeDataPoint(point: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void;
};

type DurableObjectIdLike = unknown;
type DurableObjectNamespaceLike = {
  idFromName(name: string): DurableObjectIdLike;
  get(id: DurableObjectIdLike): {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  };
};

type WorkerBindings = {
  NODE_ENV?: string;
  APP_BASE_URL?: string;
  VIBECDR_API_BASE?: string;
  SESSION_SIGNING_KEY?: string;
  COOKIE_SECURE?: string;
  ALLOW_MANUAL_TOKEN_LINK?: string;
  ENABLE_CODEX_IMPORT_PATH?: string;
  ENABLE_CHATGPT_IMPORT_PATH?: string;
  ENABLE_PUBLISH_FROM_CHATGPT?: string;
  MAX_REQUEST_BODY_BYTES?: string;
  RATE_LIMIT_WINDOW_SECONDS?: string;
  RATE_LIMIT_REQUESTS_PER_WINDOW?: string;
  RATE_LIMIT_MCP_REQUESTS_PER_WINDOW?: string;
  OAUTH_PROVIDER_NAME?: string;
  OAUTH_CLIENT_ID?: string;
  OAUTH_CLIENT_SECRET?: string;
  OAUTH_SCOPES?: string;
  OAUTH_REDIRECT_URI?: string;
  OAUTH_AUDIENCE?: string;
  OAUTH_ISSUER_URL?: string;
  OAUTH_DISCOVERY_URL?: string;
  OAUTH_AUTHORIZATION_URL?: string;
  OAUTH_TOKEN_URL?: string;
  MCP_STATIC_CLIENT_ID?: string;
  MCP_STATIC_CLIENT_SECRET?: string;
  MCP_STATIC_CLIENT_REDIRECT_URIS?: string;
  AUTH_CODE_COORDINATOR?: DurableObjectNamespaceLike;
  OPERATIONS_KV?: KvNamespaceLike;
  VIBE_API?: FetcherLike;
  GLOBAL_RATE_LIMITER?: CloudflareRateLimitBinding;
  MCP_RATE_LIMITER?: CloudflareRateLimitBinding;
  GATEWAY_ANALYTICS?: AnalyticsEngineDataset;
};

class InMemoryKv implements KvNamespaceLike {
  private readonly map = new Map<string, string>();

  async get(key: string, type?: "text" | "json"): Promise<string | null | unknown> {
    const value = this.map.get(key) ?? null;
    if (value == null) return null;
    if (type === "json") {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        return null;
      }
    }
    return value;
  }

  async put(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.map.delete(key);
  }
}

function toConfigSource(env: WorkerBindings): Record<string, string | undefined> {
  return {
    PORT: "8787",
    APP_BASE_URL: env.APP_BASE_URL,
    VIBECDR_API_BASE: env.VIBECDR_API_BASE,
    SESSION_SIGNING_KEY: env.SESSION_SIGNING_KEY,
    COOKIE_SECURE: env.COOKIE_SECURE,
    ALLOW_MANUAL_TOKEN_LINK: env.ALLOW_MANUAL_TOKEN_LINK,
    ENABLE_CODEX_IMPORT_PATH: env.ENABLE_CODEX_IMPORT_PATH,
    ENABLE_CHATGPT_IMPORT_PATH: env.ENABLE_CHATGPT_IMPORT_PATH,
    ENABLE_PUBLISH_FROM_CHATGPT: env.ENABLE_PUBLISH_FROM_CHATGPT,
    MAX_REQUEST_BODY_BYTES: env.MAX_REQUEST_BODY_BYTES,
    RATE_LIMIT_WINDOW_SECONDS: env.RATE_LIMIT_WINDOW_SECONDS,
    RATE_LIMIT_REQUESTS_PER_WINDOW: env.RATE_LIMIT_REQUESTS_PER_WINDOW,
    RATE_LIMIT_MCP_REQUESTS_PER_WINDOW: env.RATE_LIMIT_MCP_REQUESTS_PER_WINDOW,
    OAUTH_PROVIDER_NAME: env.OAUTH_PROVIDER_NAME,
    OAUTH_CLIENT_ID: env.OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET: env.OAUTH_CLIENT_SECRET,
    OAUTH_SCOPES: env.OAUTH_SCOPES,
    OAUTH_REDIRECT_URI: env.OAUTH_REDIRECT_URI,
    OAUTH_AUDIENCE: env.OAUTH_AUDIENCE,
    OAUTH_ISSUER_URL: env.OAUTH_ISSUER_URL,
    OAUTH_DISCOVERY_URL: env.OAUTH_DISCOVERY_URL,
    OAUTH_AUTHORIZATION_URL: env.OAUTH_AUTHORIZATION_URL,
    OAUTH_TOKEN_URL: env.OAUTH_TOKEN_URL,
    MCP_STATIC_CLIENT_ID: env.MCP_STATIC_CLIENT_ID,
    MCP_STATIC_CLIENT_SECRET: env.MCP_STATIC_CLIENT_SECRET,
    MCP_STATIC_CLIENT_REDIRECT_URIS: env.MCP_STATIC_CLIENT_REDIRECT_URIS,
    NODE_ENV: env.NODE_ENV || "production"
  };
}

function fingerprintConfig(config: AppConfig): string {
  return createHash("sha1")
    .update(
      JSON.stringify({
        appBaseUrl: config.appBaseUrl,
        vibecodrApiBase: config.vibecodrApiBase,
        sessionSigningKeyHash: createHash("sha256").update(config.sessionSigningKey).digest("hex"),
        oauth: config.oauth,
        staticMcpClient: {
          clientId: config.staticMcpClient.clientId,
          clientSecretHash: config.staticMcpClient.clientSecret
            ? createHash("sha256").update(config.staticMcpClient.clientSecret).digest("hex")
            : undefined
        },
        cookieSecure: config.cookieSecure,
        maxRequestBodyBytes: config.maxRequestBodyBytes,
        rateLimits: {
          windowSeconds: config.rateLimitWindowSeconds,
          requestsPerWindow: config.rateLimitRequestsPerWindow,
          mcpRequestsPerWindow: config.rateLimitMcpRequestsPerWindow
        },
        featureFlags: {
          enableCodexImportPath: config.enableCodexImportPath,
          enableChatGptImportPath: config.enableChatGptImportPath,
          enablePublishFromChatGpt: config.enablePublishFromChatGpt
        }
      })
    )
    .digest("hex");
}

let cachedFingerprint = "";
let cachedHandler: AppRequestHandler | null = null;
let cachedSessionStore: SessionStore | null = null;
let cachedOauthStateStore: OauthStateStore | null = null;
let cachedTelemetry: Telemetry | null = null;

function getHandler(env: WorkerBindings): AppRequestHandler {
  const config = loadConfigFromSource(toConfigSource(env));
  const currentFingerprint = fingerprintConfig(config);
  if (cachedHandler && cachedFingerprint === currentFingerprint && cachedSessionStore && cachedOauthStateStore) {
    return cachedHandler;
  }

  if (config.appBaseUrl.startsWith("https://")) {
    if (!env.OPERATIONS_KV) {
      throw new Error("OPERATIONS_KV binding is required for production Worker auth and operation persistence.");
    }
    if (!env.AUTH_CODE_COORDINATOR) {
      throw new Error("AUTH_CODE_COORDINATOR binding is required for production Worker OAuth code redemption.");
    }
  }

  const kv = env.OPERATIONS_KV || new InMemoryKv();
  const sessionRevocationStore = new SessionRevocationStore(kv);
  const sessionStore = new SessionStore(config.sessionSigningKey, sessionRevocationStore);
  const oauthStateStore = new OauthStateStore(config.sessionSigningKey);
  const operationStore = new OperationStoreKv(kv);
  const telemetry = new Telemetry({
    hashSalt: config.sessionSigningKey,
    analytics: env.GATEWAY_ANALYTICS
  });
  const apiFetch = env.VIBE_API ? env.VIBE_API.fetch.bind(env.VIBE_API) : fetch;
  const vibecodr = new VibecodrClient(config.vibecodrApiBase, apiFetch);
  const importService = new ImportService(operationStore, vibecodr, telemetry);

  cachedFingerprint = currentFingerprint;
  cachedSessionStore = sessionStore;
  cachedOauthStateStore = oauthStateStore;
  cachedTelemetry = telemetry;
  cachedHandler = createAppRequestHandler({
    config,
    sessionStore,
    oauthStateStore,
    operationStore,
    importService,
    vibecodr,
    telemetry,
    vibecodrFetch: apiFetch,
    oauthKv: kv,
    authorizationCodeCoordinator: env.AUTH_CODE_COORDINATOR,
    sessionRevocationStore,
    rateLimiters: {
      global: env.GLOBAL_RATE_LIMITER,
      mcp: env.MCP_RATE_LIMITER
    }
  });
  return cachedHandler;
}

export { AuthorizationCodeCoordinator };

export default {
  async fetch(request: Request, env: WorkerBindings): Promise<Response> {
    try {
      const handler = getHandler(env);
      return await handler(request);
    } catch (error) {
      const traceId = crypto.randomUUID();
      cachedTelemetry?.event("worker.error", "error", {
        traceId,
        errorCode: "WORKER_UNHANDLED_ERROR",
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      });
      console.error("worker.error", {
        traceId,
        error: error instanceof Error ? error.message : String(error)
      });
      return jsonResponse(500, { error: "Internal server error", traceId });
    }
  }
};
