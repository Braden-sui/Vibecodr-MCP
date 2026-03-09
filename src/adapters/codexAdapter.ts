import type { NormalizedCreationPackage } from "../types.js";
import { parseNormalizedPackage } from "./packageSchema.js";

export function adaptCodexPayload(input: unknown): NormalizedCreationPackage {
  const withSource = typeof input === "object" && input
    ? { ...(input as Record<string, unknown>), sourceType: "codex_v1" as const }
    : { sourceType: "codex_v1" as const };
  return parseNormalizedPackage(withSource);
}
