import test from "node:test";
import assert from "node:assert/strict";
import { ImportService } from "../src/services/importService.js";
import { Telemetry } from "../src/observability/telemetry.js";
import type { ImportOperation, SessionRecord } from "../src/types.js";
import type { OperationStorePort } from "../src/storage/operationStorePort.js";

function createOperationStore(operation: ImportOperation): OperationStorePort {
  let current = { ...operation };
  return {
    async create(op) {
      current = { ...op };
      return { ...current };
    },
    async getById(operationId) {
      return current.operationId === operationId ? { ...current } : undefined;
    },
    async getByIdempotency() {
      return undefined;
    },
    async listByUser() {
      return [{ ...current }];
    },
    async addDiagnostic(operationId, diagnostic) {
      assert.equal(operationId, current.operationId);
      current = { ...current, diagnostics: [...current.diagnostics, diagnostic], updatedAt: Date.now() };
      return { ...current };
    },
    async updateStatus(operationId, status, stage, patch) {
      assert.equal(operationId, current.operationId);
      current = {
        ...current,
        status,
        currentStage: stage,
        ...(patch || {}),
        updatedAt: Date.now()
      };
      return { ...current };
    }
  };
}

test("publishDraft uploads private launch art through the standalone lane", async () => {
  const operation: ImportOperation = {
    operationId: "op_123",
    userId: "user_123",
    sourceType: "chatgpt_v1",
    status: "draft_ready",
    currentStage: "compiled",
    capsuleId: "cap_123",
    diagnostics: [],
    idempotencyKey: "idem_123",
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  const session: SessionRecord = {
    sessionId: "sess_123",
    userId: "user_123",
    userHandle: "braden",
    vibecodrToken: "token_abc",
    createdAt: Date.now(),
    expiresAt: Date.now() + 60_000
  };
  const seenUsages: string[] = [];
  const vibecodr = {
    async publishDraft() {
      return { postId: "post_123", postUrl: "https://vibecodr.space/post/post_123" };
    },
    async uploadCover(_ctx: unknown, input: { usage: string }) {
      seenUsages.push(input.usage);
      return { key: "covers/user/key.png", usage: input.usage };
    },
    async updatePostMetadata() {
      return {};
    }
  };
  const telemetry = new Telemetry({ hashSalt: "salt" });
  const service = new ImportService(createOperationStore(operation), vibecodr as never, telemetry);

  const result = await service.publishDraft(session, operation.operationId, "cap_123", {
    visibility: "private",
    thumbnailUpload: {
      contentType: "image/png",
      fileBase64: Buffer.from("thumbnail-bytes").toString("base64"),
      fileName: "cover.png"
    }
  });

  assert.equal(seenUsages[0], "standalone");
  assert.equal(result.status, "published");
});
