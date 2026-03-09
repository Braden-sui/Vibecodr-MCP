import { createHash } from "node:crypto";

type ConfigEnv = Record<string, string | undefined>;

export type OauthConfig = {
  authorizationUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  scopes: string;
  redirectUri?: string;
  audience?: string;
  providerName: string;
  issuerUrl?: string;
  discoveryUrl?: string;
};

export type StaticMcpClientConfig = {
  clientId?: string;
  clientSecret?: string;
  redirectUris: string[];
};

export type AppConfig = {
  port: number;
  appBaseUrl: string;
  vibecodrApiBase: string;
  sessionSigningKey: string;
  cookieSecure: boolean;
  allowManualTokenLink: boolean;
  enableCodexImportPath: boolean;
  enableChatGptImportPath: boolean;
  enablePublishFromChatGpt: boolean;
  maxRequestBodyBytes: number;
  rateLimitWindowSeconds: number;
  rateLimitRequestsPerWindow: number;
  rateLimitMcpRequestsPerWindow: number;
  dataDir: string;
  oauth: OauthConfig;
  staticMcpClient: StaticMcpClientConfig;
};

function trimOrEmpty(value: string | undefined): string {
  return (value || "").trim();
}

function boolFromSource(source: ConfigEnv, name: string, fallback: boolean): boolean {
  const raw = source[name];
  if (raw == null) return fallback;
  return raw.toLowerCase() === "true";
}

function trimFromSource(source: ConfigEnv, name: string): string {
  return trimOrEmpty(source[name]);
}

function splitListFromSource(source: ConfigEnv, name: string): string[] {
  const raw = trimOrEmpty(source[name]);
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isLoopbackHost(hostname: string): boolean {
  const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

function isAllowedRedirectUri(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.hash) return false;
    if (url.protocol === "https:") return true;
    return url.protocol === "http:" && isLoopbackHost(url.hostname);
  } catch {
    return false;
  }
}

function boundedIntFromSource(
  source: ConfigEnv,
  name: string,
  fallback: number,
  min: number,
  max: number
): number {
  const raw = source[name];
  if (raw == null || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), min), max);
}

export function loadConfigFromSource(source: ConfigEnv): AppConfig {
  const port = Number(source.PORT ?? "8787");
  if (!Number.isFinite(port) || port <= 0) throw new Error("Invalid PORT");

  const sessionSigningKey = trimFromSource(source, "SESSION_SIGNING_KEY");
  if (!sessionSigningKey) throw new Error("Missing SESSION_SIGNING_KEY");
  if (sessionSigningKey.length < 32) {
    throw new Error("SESSION_SIGNING_KEY must be at least 32 characters");
  }

  const appBaseUrl = trimFromSource(source, "APP_BASE_URL") || "http://localhost:" + port;
  const nodeEnv = trimFromSource(source, "NODE_ENV").toLowerCase() || "development";
  if (nodeEnv === "production" && !appBaseUrl.startsWith("https://")) {
    throw new Error("APP_BASE_URL must be https in production");
  }

  const cookieSecureDefault = appBaseUrl.startsWith("https://");
  const staticClientId = trimFromSource(source, "MCP_STATIC_CLIENT_ID") || undefined;
  const staticClientSecret = trimFromSource(source, "MCP_STATIC_CLIENT_SECRET") || undefined;
  const staticClientRedirectUris = splitListFromSource(source, "MCP_STATIC_CLIENT_REDIRECT_URIS");
  if ((staticClientSecret || staticClientRedirectUris.length) && !staticClientId) {
    throw new Error("MCP_STATIC_CLIENT_ID is required when configuring preregistered MCP client settings");
  }
  if (staticClientRedirectUris.some((value) => !isAllowedRedirectUri(value))) {
    throw new Error("MCP_STATIC_CLIENT_REDIRECT_URIS must contain only https or loopback http redirect URIs");
  }

  return {
    port,
    appBaseUrl,
    vibecodrApiBase: trimFromSource(source, "VIBECDR_API_BASE") || "https://api.vibecodr.space",
    sessionSigningKey,
    cookieSecure: boolFromSource(source, "COOKIE_SECURE", cookieSecureDefault),
    allowManualTokenLink: boolFromSource(source, "ALLOW_MANUAL_TOKEN_LINK", false),
    enableCodexImportPath: boolFromSource(source, "ENABLE_CODEX_IMPORT_PATH", true),
    enableChatGptImportPath: boolFromSource(source, "ENABLE_CHATGPT_IMPORT_PATH", true),
    enablePublishFromChatGpt: boolFromSource(source, "ENABLE_PUBLISH_FROM_CHATGPT", true),
    maxRequestBodyBytes: boundedIntFromSource(source, "MAX_REQUEST_BODY_BYTES", 8_500_000, 64_000, 10_000_000),
    rateLimitWindowSeconds: boundedIntFromSource(source, "RATE_LIMIT_WINDOW_SECONDS", 60, 10, 3600),
    rateLimitRequestsPerWindow: boundedIntFromSource(source, "RATE_LIMIT_REQUESTS_PER_WINDOW", 240, 20, 10_000),
    rateLimitMcpRequestsPerWindow: boundedIntFromSource(source, "RATE_LIMIT_MCP_REQUESTS_PER_WINDOW", 120, 10, 10_000),
    dataDir: "data",
    oauth: {
      providerName: trimFromSource(source, "OAUTH_PROVIDER_NAME") || "clerk",
      authorizationUrl: trimFromSource(source, "OAUTH_AUTHORIZATION_URL"),
      tokenUrl: trimFromSource(source, "OAUTH_TOKEN_URL"),
      clientId: trimFromSource(source, "OAUTH_CLIENT_ID"),
      clientSecret: trimFromSource(source, "OAUTH_CLIENT_SECRET") || undefined,
      scopes: trimFromSource(source, "OAUTH_SCOPES") || "openid profile email offline_access",
      redirectUri: trimFromSource(source, "OAUTH_REDIRECT_URI") || undefined,
      audience: trimFromSource(source, "OAUTH_AUDIENCE") || undefined,
      issuerUrl: trimFromSource(source, "OAUTH_ISSUER_URL") || undefined,
      discoveryUrl: trimFromSource(source, "OAUTH_DISCOVERY_URL") || undefined
    },
    staticMcpClient: {
      clientId: staticClientId,
      clientSecret: staticClientSecret,
      redirectUris: staticClientRedirectUris
    }
  };
}

export function loadConfig(): AppConfig {
  return loadConfigFromSource(process.env as ConfigEnv);
}

export function stableHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
