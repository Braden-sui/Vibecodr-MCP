#!/usr/bin/env node

const baseUrl = (process.env.MCP_BASE_URL || "https://openai.vibecodr.space").replace(/\/$/, "");
const includeRaw = process.argv.includes("--raw");

let rpcId = 1;

async function mcpRequest(method, params = {}) {
  const res = await fetch(baseUrl + "/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "mcp-protocol-version": "2025-03-26"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: rpcId++,
      method,
      params
    })
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    throw new Error(`MCP ${method} failed: HTTP ${res.status}: ${text}`);
  }
  if (!json || json.jsonrpc !== "2.0") {
    throw new Error(`MCP ${method} returned a non-JSON-RPC response.`);
  }
  if (json.error) {
    throw new Error(`MCP ${method} returned error ${json.error.code}: ${json.error.message}`);
  }
  return json.result;
}

function printToolSummary(result) {
  const tools = Array.isArray(result?.tools) ? result.tools : [];
  const summary = tools.map((tool) => ({
    name: tool.name,
    title: tool.title,
    auth: Array.isArray(tool.securitySchemes)
      ? tool.securitySchemes.map((scheme) => scheme.type || "unknown")
      : [],
    destructive: Boolean(tool.annotations?.destructiveHint),
    readOnly: Boolean(tool.annotations?.readOnlyHint),
    description: tool.description
  }));

  console.log(JSON.stringify({
    baseUrl,
    protocolVersion: "2025-03-26",
    toolCount: summary.length,
    tools: summary
  }, null, 2));
}

await mcpRequest("initialize", {
  protocolVersion: "2025-03-26",
  capabilities: {},
  clientInfo: { name: "mcp-tools-cli", version: "1.0.0" }
});

const toolsList = await mcpRequest("tools/list");

if (includeRaw) {
  console.log(JSON.stringify(toolsList, null, 2));
} else {
  printToolSummary(toolsList);
}
