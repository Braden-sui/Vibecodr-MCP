type DurableObjectStorageLike = {
  get<T = unknown>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<boolean | void>;
};

type DurableObjectStateLike = {
  storage: DurableObjectStorageLike;
};

type DurableObjectIdLike = unknown;

export type AuthorizationCodeCoordinatorNamespaceLike = {
  idFromName(name: string): DurableObjectIdLike;
  get(id: DurableObjectIdLike): {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  };
};

type IssuePayload<TRecord> = {
  code: string;
  record: TRecord;
};

type ConsumePayload = {
  code: string;
};

type StoredCodeRecord<TRecord> = {
  record: TRecord;
  expiresAt: number;
};

function jsonResponse(status: number, body?: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

async function parseJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export class AuthorizationCodeCoordinator {
  constructor(private readonly state: DurableObjectStateLike) {}

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === "POST" && url.pathname === "/issue") {
      const payload = await parseJson<IssuePayload<unknown>>(req);
      if (!payload || typeof payload.code !== "string" || !payload.record || typeof payload.record !== "object") {
        return jsonResponse(400, { error: "INVALID_ISSUE_REQUEST" });
      }
      const record = payload.record as Record<string, unknown>;
      const expiresAt = typeof record["expires_at"] === "number" ? record["expires_at"] : 0;
      if (!Number.isFinite(expiresAt) || expiresAt <= 0) {
        return jsonResponse(400, { error: "INVALID_ISSUE_EXPIRY" });
      }
      await this.state.storage.put(payload.code, {
        record: payload.record,
        expiresAt
      } satisfies StoredCodeRecord<unknown>);
      return new Response(null, { status: 204 });
    }

    if (req.method === "POST" && url.pathname === "/consume") {
      const payload = await parseJson<ConsumePayload>(req);
      if (!payload || typeof payload.code !== "string" || !payload.code) {
        return jsonResponse(400, { error: "INVALID_CONSUME_REQUEST" });
      }
      const stored = await this.state.storage.get<StoredCodeRecord<unknown>>(payload.code);
      if (!stored) {
        return jsonResponse(200, { record: null });
      }
      await this.state.storage.delete(payload.code);
      if (!stored.expiresAt || stored.expiresAt < Date.now()) {
        return jsonResponse(200, { record: null });
      }
      return jsonResponse(200, { record: stored.record as Record<string, unknown> });
    }

    return jsonResponse(404, { error: "NOT_FOUND" });
  }
}

export class AuthorizationCodeCoordinatorClient<TRecord> {
  constructor(private readonly namespace: AuthorizationCodeCoordinatorNamespaceLike) {}

  private stubFor(code: string) {
    const id = this.namespace.idFromName("oauth-code:" + code.slice(0, 2));
    return this.namespace.get(id);
  }

  async issue(code: string, record: TRecord): Promise<void> {
    const response = await this.stubFor(code).fetch("https://auth-coordinator/issue", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, record })
    });
    if (response.status !== 204) {
      throw new Error("Authorization code coordinator failed to issue code.");
    }
  }

  async consume(code: string): Promise<TRecord | null> {
    const response = await this.stubFor(code).fetch("https://auth-coordinator/consume", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code })
    });
    if (!response.ok) {
      throw new Error("Authorization code coordinator failed to consume code.");
    }
    const payload = (await response.json()) as { record?: TRecord | null };
    return payload.record ?? null;
  }
}
