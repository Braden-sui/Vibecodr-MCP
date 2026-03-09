import type { AppConfig } from "../config.js";

export const OFFICIAL_MCP_CLIENT_METADATA_PATH = "/.well-known/oauth-client/vibecodr-mcp.json";

export type OfficialMcpClientMetadata = {
  client_id: string;
  client_name: string;
  client_uri: string;
  grant_types: string[];
  response_types: string[];
  redirect_uris: string[];
  token_endpoint_auth_method: "none";
  scope?: string;
};

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function buildOfficialMcpClientMetadata(config: AppConfig): OfficialMcpClientMetadata {
  const base = trimSlash(config.appBaseUrl);
  return {
    client_id: base + OFFICIAL_MCP_CLIENT_METADATA_PATH,
    client_name: "Vibecodr MCP CLI",
    client_uri: "https://vibecodr.space",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    redirect_uris: [
      "http://127.0.0.1/oauth/callback/vibecodr",
      "http://localhost/oauth/callback/vibecodr",
      "http://[::1]/oauth/callback/vibecodr"
    ],
    token_endpoint_auth_method: "none",
    scope: config.oauth.scopes
  };
}

export function isOfficialMcpClientId(config: AppConfig, clientId: string): boolean {
  return clientId === buildOfficialMcpClientMetadata(config).client_id;
}
