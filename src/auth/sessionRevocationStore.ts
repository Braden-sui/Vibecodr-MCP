import type { KvNamespaceLike } from "../storage/operationStoreKv.js";

const SESSION_REVOCATION_PREFIX = "session:revoked:";

export class SessionRevocationStore {
  constructor(private readonly kv: KvNamespaceLike) {}

  async revoke(sessionId: string, expiresAt: number): Promise<void> {
    const ttlSeconds = Math.max(Math.ceil((expiresAt - Date.now()) / 1000), 60);
    await this.kv.put(SESSION_REVOCATION_PREFIX + sessionId, "1", { expirationTtl: ttlSeconds });
  }

  async isRevoked(sessionId: string): Promise<boolean> {
    const value = await this.kv.get(SESSION_REVOCATION_PREFIX + sessionId, "text");
    return value === "1";
  }
}
