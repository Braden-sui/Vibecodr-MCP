#!/usr/bin/env node

const baseUrl = (process.env.E2E_BASE_URL || "https://openai.vibecodr.space").replace(/\/$/, "");
const sourceType = process.env.E2E_SOURCE_TYPE || "codex_v1";
const token = (process.env.E2E_VIBECDR_TOKEN || "").trim();

let cookieJar = new Map();
let rpcId = 1;

function parseSetCookie(setCookie) {
  const firstPart = setCookie.split(";")[0] || "";
  const eq = firstPart.indexOf("=");
  if (eq <= 0) return null;
  const name = firstPart.slice(0, eq).trim();
  const value = firstPart.slice(eq + 1).trim();
  if (!name) return null;
  return { name, value };
}

function updateCookieJar(headers) {
  const setCookies = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : (headers.get("set-cookie") ? [headers.get("set-cookie")] : []);

  for (const raw of setCookies) {
    if (!raw) continue;
    const parsed = parseSetCookie(raw);
    if (!parsed) continue;
    cookieJar.set(parsed.name, parsed.value);
  }
}

function cookieHeader() {
  if (cookieJar.size === 0) return "";
  return Array.from(cookieJar.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
}

async function request(path, init = {}) {
  const headers = new Headers(init.headers || {});
  const existingCookie = headers.get("cookie");
  const jarCookie = cookieHeader();
  if (jarCookie) {
    headers.set("cookie", existingCookie ? `${existingCookie}; ${jarCookie}` : jarCookie);
  }

  const res = await fetch(baseUrl + path, { ...init, headers });
  updateCookieJar(res.headers);

  const rawText = await res.text();
  let json;
  try {
    json = rawText ? JSON.parse(rawText) : undefined;
  } catch {
    json = undefined;
  }

  return {
    status: res.status,
    ok: res.ok,
    json,
    text: rawText.length > 2000 ? rawText.slice(0, 2000) + "...[truncated]" : rawText
  };
}

async function mcpCall(name, args) {
  return request("/mcp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: rpcId++,
      method: "tools/call",
      params: { name, arguments: args || {} }
    })
  });
}

async function runStep(results, name, fn) {
  const startedAt = Date.now();
  try {
    const data = await fn();
    results.push({ name, ok: true, durationMs: Date.now() - startedAt, data });
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, ok: false, durationMs: Date.now() - startedAt, error: message });
    return null;
  }
}

function operationFromMcpResponse(resp) {
  const payload = resp?.json;
  const result = payload?.result;
  const structured = result?.structuredContent;
  const operation = structured?.operation;
  return operation && typeof operation === "object" ? operation : null;
}

function defaultPayload() {
  return {
    title: "E2E Publish Probe",
    runner: "client-static",
    entry: "index.tsx",
    files: [
      {
        path: "index.tsx",
        content: "export default function App(){return 'vibecodr e2e';}",
        contentEncoding: "utf8"
      }
    ],
    importMode: "direct_files",
    sourceReference: "e2e://manual-link"
  };
}

const results = [];
let operationId = "";
let capsuleId = "";

await runStep(results, "health", () => request("/health"));
await runStep(results, "session_before", () => request("/api/auth/session"));

if (token) {
  await runStep(results, "manual_link", () =>
    request("/api/auth/link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token })
    })
  );
} else {
  results.push({
    name: "manual_link",
    ok: false,
    durationMs: 0,
    error: "E2E_VIBECDR_TOKEN was not provided"
  });
}

await runStep(results, "session_after", () => request("/api/auth/session"));

const startResp = await runStep(results, "start_creation_import", () =>
  mcpCall("start_creation_import", { sourceType, payload: defaultPayload() })
);

const opFromStart = operationFromMcpResponse(startResp);
if (opFromStart) {
  operationId = typeof opFromStart.operationId === "string" ? opFromStart.operationId : "";
  capsuleId = typeof opFromStart.capsuleId === "string" ? opFromStart.capsuleId : "";
}

if (operationId) {
  const getOpResp = await runStep(results, "get_import_operation", () =>
    mcpCall("get_import_operation", { operationId })
  );

  const opFromGet = operationFromMcpResponse(getOpResp);
  if (opFromGet && typeof opFromGet.capsuleId === "string" && opFromGet.capsuleId) {
    capsuleId = opFromGet.capsuleId;
  }
}

await runStep(results, "compile_draft_capsule", () =>
  mcpCall("compile_draft_capsule", {
    operationId: operationId || "missing-operation",
    capsuleId: capsuleId || "missing-capsule"
  })
);

await runStep(results, "publish_draft_capsule", () =>
  mcpCall("publish_draft_capsule", {
    operationId: operationId || "missing-operation",
    capsuleId: capsuleId || "missing-capsule"
  })
);

await runStep(results, "list_import_operations", () => mcpCall("list_import_operations", { limit: 10 }));
await runStep(results, "list_vibecodr_drafts", () => mcpCall("list_vibecodr_drafts", {}));

const summary = {
  baseUrl,
  attempted: {
    linkedSession: token.length > 0,
    import: true,
    compile: true,
    publish: true
  },
  identifiers: {
    operationId: operationId || null,
    capsuleId: capsuleId || null
  },
  results
};

console.log(JSON.stringify(summary, null, 2));
