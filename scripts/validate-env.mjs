const required = ["SESSION_SIGNING_KEY", "APP_BASE_URL", "VIBECDR_API_BASE", "OAUTH_CLIENT_ID"];

const missing = required.filter((k) => !(process.env[k] || "").trim());

const appBaseUrl = (process.env.APP_BASE_URL || "").trim();
const sessionKey = (process.env.SESSION_SIGNING_KEY || "").trim();
const authUrl = (process.env.OAUTH_AUTHORIZATION_URL || "").trim();
const tokenUrl = (process.env.OAUTH_TOKEN_URL || "").trim();
const issuerUrl = (process.env.OAUTH_ISSUER_URL || "").trim();
const discoveryUrl = (process.env.OAUTH_DISCOVERY_URL || "").trim();
const nodeEnv = (process.env.NODE_ENV || "").trim().toLowerCase();
const maxRequestBodyBytes = (process.env.MAX_REQUEST_BODY_BYTES || "").trim();
const rateLimitWindowSeconds = (process.env.RATE_LIMIT_WINDOW_SECONDS || "").trim();
const rateLimitRequestsPerWindow = (process.env.RATE_LIMIT_REQUESTS_PER_WINDOW || "").trim();
const rateLimitMcpRequestsPerWindow = (process.env.RATE_LIMIT_MCP_REQUESTS_PER_WINDOW || "").trim();

function validatePositiveInt(raw, key, min, max) {
  if (!raw) return;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < min || parsed > max) {
    missing.push(`${key} must be an integer between ${min} and ${max}`);
  }
}

if (sessionKey && sessionKey.length < 32) {
  missing.push("SESSION_SIGNING_KEY must be at least 32 characters");
}

if (nodeEnv === "production" && appBaseUrl && !appBaseUrl.startsWith("https://")) {
  missing.push("APP_BASE_URL must be https in production");
}

if ((!authUrl || !tokenUrl) && !issuerUrl && !discoveryUrl) {
  missing.push(
    "OAUTH endpoints not configured: set OAUTH_AUTHORIZATION_URL and OAUTH_TOKEN_URL, or set OAUTH_ISSUER_URL/OAUTH_DISCOVERY_URL"
  );
}

validatePositiveInt(maxRequestBodyBytes, "MAX_REQUEST_BODY_BYTES", 64000, 10000000);
validatePositiveInt(rateLimitWindowSeconds, "RATE_LIMIT_WINDOW_SECONDS", 10, 3600);
validatePositiveInt(rateLimitRequestsPerWindow, "RATE_LIMIT_REQUESTS_PER_WINDOW", 20, 10000);
validatePositiveInt(rateLimitMcpRequestsPerWindow, "RATE_LIMIT_MCP_REQUESTS_PER_WINDOW", 10, 10000);

if (missing.length) {
  console.error("Missing required environment variables:");
  for (const key of missing) console.error("- " + key);
  process.exit(1);
}

console.log("Environment validation passed.");
