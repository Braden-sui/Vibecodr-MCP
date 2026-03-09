function bool(v, fallback = false) {
  if (v == null || v === "") return fallback;
  return String(v).toLowerCase() === "true";
}

const appBaseUrl = (process.env.APP_BASE_URL || "").trim();
const nodeEnv = (process.env.NODE_ENV || "development").trim().toLowerCase();
const cookieSecure = bool(process.env.COOKIE_SECURE, appBaseUrl.startsWith("https://"));
const allowManualTokenLink = bool(process.env.ALLOW_MANUAL_TOKEN_LINK, false);
const scopes = (process.env.OAUTH_SCOPES || "").trim();
const redirectUri = (process.env.OAUTH_REDIRECT_URI || "").trim();

const warnings = [];
const errors = [];

if (!appBaseUrl) errors.push("APP_BASE_URL is missing");
if ((process.env.SESSION_SIGNING_KEY || "").trim().length < 32) {
  errors.push("SESSION_SIGNING_KEY must be at least 32 characters");
}
if (nodeEnv === "production" && !appBaseUrl.startsWith("https://")) {
  errors.push("APP_BASE_URL must use https in production");
}
if (nodeEnv === "production" && !cookieSecure) {
  errors.push("COOKIE_SECURE must be true in production");
}
if (!scopes.includes("openid")) warnings.push("OAUTH_SCOPES should include openid");
if (!scopes.includes("profile")) warnings.push("OAUTH_SCOPES should include profile");
if (!scopes.includes("email")) warnings.push("OAUTH_SCOPES should include email");
if (allowManualTokenLink) {
  warnings.push("ALLOW_MANUAL_TOKEN_LINK is enabled; disable in production");
}
if (redirectUri && appBaseUrl && !redirectUri.startsWith(appBaseUrl)) {
  warnings.push("OAUTH_REDIRECT_URI does not start with APP_BASE_URL");
}

if (warnings.length) {
  console.warn("Security warnings:");
  for (const w of warnings) console.warn("- " + w);
}

if (errors.length) {
  console.error("Security errors:");
  for (const e of errors) console.error("- " + e);
  process.exit(1);
}

console.log("Security preflight passed.");
