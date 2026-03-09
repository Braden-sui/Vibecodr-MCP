import type { ImportOperation, OperationStatus } from "../types.js";
import type { OperationDiagnostic, OperationStorePort } from "./operationStorePort.js";

type KvGetType = "text" | "json";

export type KvNamespaceLike = {
  get(key: string, type?: KvGetType): Promise<string | null | unknown>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  delete?(key: string): Promise<void>;
};

type UserOperationIndex = {
  operationIds: string[];
};

export class OperationStoreKv implements OperationStorePort {
  private readonly maxIndexSize: number;

  constructor(private readonly kv: KvNamespaceLike, opts?: { maxIndexSize?: number }) {
    this.maxIndexSize = opts?.maxIndexSize ?? 500;
  }

  private opKey(operationId: string): string {
    return "op:" + operationId;
  }

  private idempotencyKey(userId: string, idempotencyKey: string): string {
    return "idem:" + userId + ":" + idempotencyKey;
  }

  private userIndexKey(userId: string): string {
    return "ops:user:" + userId;
  }

  private async writeOperation(op: ImportOperation): Promise<void> {
    await this.kv.put(this.opKey(op.operationId), JSON.stringify(op));
  }

  private async readUserIndex(userId: string): Promise<UserOperationIndex> {
    const raw = await this.kv.get(this.userIndexKey(userId), "text");
    if (!raw || typeof raw !== "string") return { operationIds: [] };
    try {
      const parsed = JSON.parse(raw) as Partial<UserOperationIndex>;
      if (!Array.isArray(parsed.operationIds)) return { operationIds: [] };
      const operationIds = parsed.operationIds.filter((value): value is string => typeof value === "string");
      return { operationIds };
    } catch {
      return { operationIds: [] };
    }
  }

  private async writeUserIndex(userId: string, index: UserOperationIndex): Promise<void> {
    const trimmed: UserOperationIndex = { operationIds: index.operationIds.slice(0, this.maxIndexSize) };
    await this.kv.put(this.userIndexKey(userId), JSON.stringify(trimmed));
  }

  private async touchUserIndex(userId: string, operationId: string): Promise<void> {
    const index = await this.readUserIndex(userId);
    const operationIds = [operationId, ...index.operationIds.filter((id) => id !== operationId)];
    await this.writeUserIndex(userId, { operationIds });
  }

  async create(op: ImportOperation): Promise<ImportOperation> {
    await this.writeOperation(op);
    await this.kv.put(this.idempotencyKey(op.userId, op.idempotencyKey), op.operationId);
    await this.touchUserIndex(op.userId, op.operationId);
    return op;
  }

  async getById(operationId: string): Promise<ImportOperation | undefined> {
    const value = await this.kv.get(this.opKey(operationId), "json");
    if (!value || typeof value !== "object") return undefined;
    return value as ImportOperation;
  }

  async getByIdempotency(userId: string, idempotencyKey: string): Promise<ImportOperation | undefined> {
    const operationId = await this.kv.get(this.idempotencyKey(userId, idempotencyKey), "text");
    if (!operationId || typeof operationId !== "string") return undefined;
    return this.getById(operationId);
  }

  async listByUser(userId: string, limit = 30): Promise<ImportOperation[]> {
    const index = await this.readUserIndex(userId);
    const ids = index.operationIds.slice(0, Math.max(1, Math.min(limit, 100)));
    const operations = await Promise.all(ids.map((id) => this.getById(id)));
    return operations
      .filter((value): value is ImportOperation => Boolean(value))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  async addDiagnostic(operationId: string, diagnostic: OperationDiagnostic): Promise<ImportOperation> {
    const op = await this.getById(operationId);
    if (!op) throw new Error("Operation not found");
    op.diagnostics.push(diagnostic);
    op.updatedAt = Date.now();
    await this.writeOperation(op);
    await this.touchUserIndex(op.userId, op.operationId);
    return op;
  }

  async updateStatus(
    operationId: string,
    status: OperationStatus,
    stage: string,
    patch?: Partial<Pick<ImportOperation, "capsuleId" | "importJobId" | "sourceReference">>
  ): Promise<ImportOperation> {
    const op = await this.getById(operationId);
    if (!op) throw new Error("Operation not found");
    op.status = status;
    op.currentStage = stage;
    if (patch?.capsuleId !== undefined) op.capsuleId = patch.capsuleId;
    if (patch?.importJobId !== undefined) op.importJobId = patch.importJobId;
    if (patch?.sourceReference !== undefined) op.sourceReference = patch.sourceReference;
    op.updatedAt = Date.now();
    if (status === "failed" || status === "canceled" || status === "published" || status === "published_with_warnings") {
      op.completedAt = Date.now();
    }
    await this.writeOperation(op);
    await this.touchUserIndex(op.userId, op.operationId);
    return op;
  }
}
