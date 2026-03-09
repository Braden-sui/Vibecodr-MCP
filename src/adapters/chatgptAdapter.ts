import type { NormalizedCreationPackage } from "../types.js";
import { parseNormalizedPackage } from "./packageSchema.js";

export function adaptChatGptPayload(input: unknown): NormalizedCreationPackage {
  const withSource = typeof input === "object" && input
    ? { ...(input as Record<string, unknown>), sourceType: "chatgpt_v1" as const }
    : { sourceType: "chatgpt_v1" as const };
  return parseNormalizedPackage(withSource);
}
