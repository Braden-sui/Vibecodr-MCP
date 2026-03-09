import type { ImportOperation, OperationStatus } from "../types.js";

type Diagnostic = ImportOperation["diagnostics"][number];

type FailureDetails = {
  upstreamStatus?: number;
  upstreamPath?: string;
  upstreamCode?: string;
  upstreamMessage?: string;
  rawMessage?: string;
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function firstString(source: Record<string, unknown> | undefined, keys: string[]): string | undefined {
  if (!source) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function includesAny(value: string | undefined, needles: string[]): boolean {
  if (!value) return false;
  const text = value.toLowerCase();
  return needles.some((needle) => text.includes(needle.toLowerCase()));
}

export function extractFailureDetails(error: unknown): Record<string, unknown> | undefined {
  const err = asRecord(error);
  if (!err) return undefined;
  const details: Record<string, unknown> = {};
  if (typeof err["status"] === "number" && Number.isFinite(err["status"])) details["upstreamStatus"] = err["status"];
  if (typeof err["path"] === "string") details["upstreamPath"] = err["path"];
  if (typeof err["message"] === "string") details["rawMessage"] = err["message"];

  const data = asRecord(err["data"]);
  const nestedError = asRecord(data?.["error"]);
  const upstreamCode = firstString(data, ["code", "error", "errorCode"]) || firstString(nestedError, ["code", "error", "errorCode"]);
  const upstreamMessage = firstString(data, ["message", "detail", "description", "raw"]) || firstString(nestedError, ["message", "detail", "description"]);
  if (upstreamCode) details["upstreamCode"] = upstreamCode;
  if (upstreamMessage) details["upstreamMessage"] = upstreamMessage;
  return Object.keys(details).length ? details : undefined;
}

function normalizeFailureDetails(details: Record<string, unknown> | undefined): FailureDetails {
  return {
    upstreamStatus: typeof details?.["upstreamStatus"] === "number" ? details["upstreamStatus"] as number : undefined,
    upstreamPath: typeof details?.["upstreamPath"] === "string" ? details["upstreamPath"] as string : undefined,
    upstreamCode: typeof details?.["upstreamCode"] === "string" ? details["upstreamCode"] as string : undefined,
    upstreamMessage: typeof details?.["upstreamMessage"] === "string" ? details["upstreamMessage"] as string : undefined,
    rawMessage: typeof details?.["rawMessage"] === "string" ? details["rawMessage"] as string : undefined
  };
}

type FailureTranslation = {
  userMessage: string;
  diagnosticMessage: string;
  rootCauseSummary?: string;
  nextActions: string[];
};

export function translateFailure(
  code: string | undefined,
  status: OperationStatus,
  details?: Record<string, unknown>
): FailureTranslation {
  const info = normalizeFailureDetails(details);
  const compilePath = includesAny(info.upstreamPath, ["/compile-draft"]);
  const publishPath = includesAny(info.upstreamPath, ["/publish"]);
  const importPath = includesAny(info.upstreamPath, ["/import/", "/capsules/empty", "/files/"]);
  const combined = [info.upstreamCode, info.upstreamMessage, info.rawMessage].filter(Boolean).join(" | ");

  if (status === "canceled") {
    return {
      userMessage: "The launch was canceled before it finished.",
      diagnosticMessage: "This launch was canceled before the vibe went live.",
      nextActions: ["Start the publish flow again when you are ready to continue."]
    };
  }

  if (code === "COMPILE_FAILED" || compilePath) {
    if (
      info.upstreamStatus === 404 ||
      includesAny(combined, ["entryfilemissing", "entry file", "starts the app", "compile-draft", "draft.entryfilemissing"])
    ) {
      return {
        userMessage: "The draft exists, but Vibecodr could not find the file that starts the app.",
        diagnosticMessage: "Vibecodr could not find the file that starts this app draft.",
        rootCauseSummary: "The draft points at a start file that Vibecodr could not resolve.",
        nextActions: [
          "Tell ChatGPT which file starts the app, then retry the launch.",
          "If the start file is already obvious, have ChatGPT set it explicitly and publish again."
        ]
      };
    }
    return {
      userMessage: "Vibecodr could not finish the compile check for this draft yet.",
      diagnosticMessage: "Vibecodr could not complete the compile check for this draft.",
      rootCauseSummary: info.upstreamMessage || info.rawMessage,
      nextActions: [
        "Ask ChatGPT to explain the blocker in plain language and retry the compile step.",
        "If the code was just edited, try the launch again after the package summary looks correct."
      ]
    };
  }

  if (code === "PUBLISH_FAILED" || publishPath) {
    return {
      userMessage: "The draft did not make it through the final publish step.",
      diagnosticMessage: "Vibecodr could not finish publishing this draft.",
      rootCauseSummary: info.upstreamMessage || info.rawMessage,
      nextActions: [
        "Ask ChatGPT to retry the publish step.",
        "If the draft needs more polish first, update the launch details and publish again."
      ]
    };
  }

  if (code === "POST_METADATA_FAILED") {
    return {
      userMessage: "The vibe is live, but its cover image or social preview details did not update yet.",
      diagnosticMessage: "The vibe published successfully, but its cover image or social preview details did not update.",
      nextActions: [
        "Retry the launch polish step if the cover image or share preview matters.",
        "If the live URL already looks good enough, you can keep sharing the vibe now."
      ]
    };
  }

  if (code === "POST_METADATA_SKIPPED") {
    return {
      userMessage: "The vibe is live, but launch polish was skipped because Vibecodr did not return the post record needed for metadata updates.",
      diagnosticMessage: "The vibe published, but launch polish could not run because the post record was unavailable.",
      nextActions: [
        "Retry the metadata update if the cover image or preview text still matters.",
        "Otherwise keep the launch moving with the live URL you already have."
      ]
    };
  }

  if (
    code === "INGEST_FAILED" ||
    code === "ZIP_IMPORT_NO_JOB_OR_CAPSULE" ||
    code === "GITHUB_IMPORT_NO_JOB_OR_CAPSULE" ||
    code === "IMPORT_JOB_POLL_ERROR" ||
    importPath
  ) {
    return {
      userMessage: "Vibecodr could not finish turning this creation into a draft.",
      diagnosticMessage: "Vibecodr could not finish creating the draft for this launch.",
      rootCauseSummary: info.upstreamMessage || info.rawMessage,
      nextActions: [
        "Ask ChatGPT to retry the draft creation step.",
        "If the package is unusual, have ChatGPT verify the file list and start file before retrying."
      ]
    };
  }

  return {
    userMessage: "This launch hit a blocker before it could finish.",
    diagnosticMessage: "This launch hit a blocker before Vibecodr could complete the workflow.",
    rootCauseSummary: info.upstreamMessage || info.rawMessage,
    nextActions: [
      "Ask ChatGPT to explain the blocker and retry the right step.",
      "If the issue repeats, review the package summary and launch details before trying again."
    ]
  };
}

export function translateDiagnosticForPublic(diagnostic: Diagnostic, status: OperationStatus) {
  const translation = translateFailure(diagnostic.code, status, diagnostic.details);
  return {
    at: diagnostic.at,
    stage: diagnostic.stage,
    code: diagnostic.code,
    message: translation.diagnosticMessage,
    ...(typeof diagnostic.retryable === "boolean" ? { retryable: diagnostic.retryable } : {})
  };
}
