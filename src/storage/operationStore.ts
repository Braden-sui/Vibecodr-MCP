import { promises as fs } from "node:fs";
import path from "node:path";
import type { ImportOperation, OperationStatus } from "../types.js";
import type { OperationDiagnostic, OperationStorePort } from "./operationStorePort.js";

type DbShape = { operations: ImportOperation[] };

export class OperationStore implements OperationStorePort {
  private readonly filePath: string;
  private loaded = false;
  private db: DbShape = { operations: [] };

  constructor(dataDir: string) {
    this.filePath = path.join(dataDir, "operations.json");
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      this.db = JSON.parse(raw) as DbShape;
    } catch {
      this.db = { operations: [] };
      await this.flush();
    }
    this.loaded = true;
  }

  private async flush(): Promise<void> {
    const tmp = this.filePath + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(this.db, null, 2), "utf8");
    await fs.rename(tmp, this.filePath);
  }

  async create(op: ImportOperation): Promise<ImportOperation> {
    await this.ensureLoaded();
    this.db.operations.push(op);
    await this.flush();
    return op;
  }

  async getById(operationId: string): Promise<ImportOperation | undefined> {
    await this.ensureLoaded();
    return this.db.operations.find((op) => op.operationId === operationId);
  }

  async getByIdempotency(userId: string, idempotencyKey: string): Promise<ImportOperation | undefined> {
    await this.ensureLoaded();
    return this.db.operations.find((op) => op.userId === userId && op.idempotencyKey === idempotencyKey);
  }

  async listByUser(userId: string, limit = 30): Promise<ImportOperation[]> {
    await this.ensureLoaded();
    return this.db.operations
      .filter((op) => op.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  async addDiagnostic(operationId: string, diagnostic: OperationDiagnostic): Promise<ImportOperation> {
    await this.ensureLoaded();
    const op = this.db.operations.find((item) => item.operationId === operationId);
    if (!op) throw new Error("Operation not found");
    op.diagnostics.push(diagnostic);
    op.updatedAt = Date.now();
    await this.flush();
    return op;
  }

  async updateStatus(
    operationId: string,
    status: OperationStatus,
    stage: string,
    patch?: Partial<Pick<ImportOperation, "capsuleId" | "importJobId" | "sourceReference">>
  ): Promise<ImportOperation> {
    await this.ensureLoaded();
    const op = this.db.operations.find((item) => item.operationId === operationId);
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
    await this.flush();
    return op;
  }
}
