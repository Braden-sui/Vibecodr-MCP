import type { ImportOperation, OperationStatus } from "../types.js";

export type OperationDiagnostic = ImportOperation["diagnostics"][number];

export type OperationStorePort = {
  create(op: ImportOperation): Promise<ImportOperation>;
  getById(operationId: string): Promise<ImportOperation | undefined>;
  getByIdempotency(userId: string, idempotencyKey: string): Promise<ImportOperation | undefined>;
  listByUser(userId: string, limit?: number): Promise<ImportOperation[]>;
  addDiagnostic(operationId: string, diagnostic: OperationDiagnostic): Promise<ImportOperation>;
  updateStatus(
    operationId: string,
    status: OperationStatus,
    stage: string,
    patch?: Partial<Pick<ImportOperation, "capsuleId" | "importJobId" | "sourceReference">>
  ): Promise<ImportOperation>;
};
