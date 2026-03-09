export type SourceType = "codex_v1" | "chatgpt_v1";
export type ImportMode = "direct_files" | "zip_import" | "github_import";
export type RunnerType = "client-static" | "webcontainer";
export type PublishVisibility = "public" | "unlisted" | "private";
export type CoverUsage = "app_cover" | "standalone";

export type CurrentUserProfileSummary = {
  id: string;
  handle: string;
  name?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  plan?: string;
  createdAt?: number | string;
  stats?: {
    followers?: number;
    following?: number;
    posts?: number;
    runs?: number;
    remixes?: number;
  };
};

export type VibecodrQuotaSummary = {
  plan: string;
  usage: {
    storage: number;
    runs: number;
    bundleSize: number;
    serverActionRuns?: number;
    serverActionCount?: number;
    webhookCalls?: number;
    privateVibesUsed?: number;
    privatePulsesUsed?: number;
  };
  limits: {
    maxStorage: number;
    maxRuns: number | "unlimited";
    maxPrivateVibes: number | "unlimited";
    maxConnections: number | "unlimited";
    serverActions: {
      maxActions: number;
      maxRunsPerMonth: number;
      maxRuntimeMs: number;
    };
    pulses: {
      maxActions: number;
      maxRunsPerMonth: number;
      maxRuntimeMs: number;
      maxPrivatePulses: number | "unlimited";
      maxSubrequests: number;
      maxVanitySubdomains: number;
      proxyRateLimit: number;
      secretsProxyOwnerRateLimit: number;
      secretsProxyPulseRateLimit: number;
    };
    webhookActions: {
      maxActions: number;
      maxCallsPerMonth: number;
    };
    features: {
      customSeo: boolean;
      serverActionsEnabled: boolean;
      pulsesEnabled: boolean;
      webhookActionsEnabled: boolean;
      embedsUnbranded: boolean;
      customDomains: number;
      d1SqlEnabled: boolean;
      secretsStoreEnabled: boolean;
      canPublishLibraryVibes: boolean;
      advancedZipAnalysis: boolean;
      studioParamsTab: boolean;
      studioFilesTab: boolean;
    };
  };
  percentUsed?: {
    storage: number;
    runs: number;
    bundleSize?: number;
    serverActionRuns?: number;
    webhookCalls?: number;
  };
};

export type AccountCapabilitiesSummary = {
  profile: CurrentUserProfileSummary;
  quota: VibecodrQuotaSummary;
  launchDefaults: {
    visibility: "public";
    shouldOfferCoverGeneration: boolean;
    shouldOfferCustomSeo: boolean;
    shouldOfferPulseGuidance: boolean;
  };
  features: {
    customSeo: boolean;
    canUsePrivateOrUnlisted: boolean;
    pulsesEnabled: boolean;
    serverActionsEnabled: boolean;
    webhookActionsEnabled: boolean;
  };
  remaining: {
    pulseSlots: number;
    pulseRunsThisMonth: number | "unlimited";
    webhookCalls: number;
    privateVibes?: number | "unlimited";
    privatePulses?: number | "unlimited";
  };
  recommendations: string[];
};

export type LaunchBestPractices = {
  headline: string;
  summary: string;
  premiumLaunchChecklist: string[];
  assistantBehavior: string[];
  coverGuidance: {
    shouldOfferGeneration: boolean;
    whenToOffer: string;
    whyItMatters: string;
  };
  seoGuidance: {
    shouldOfferForPublicLaunch: boolean;
    whyItMatters: string;
    requiresCapabilityCheck: boolean;
  };
  polishMoments: string[];
};

export type PulseSetupGuidance = {
  headline: string;
  summary: string;
  whenFrontendOnlyIsEnough: string[];
  whenYouNeedPulses: string[];
  runnerGuidance: string[];
  pulseBestPractices: string[];
  accountReminder: string;
};

export type EncodedFile = {
  path: string;
  content: string;
  contentEncoding: "utf8" | "base64";
};

export type NormalizedCreationPackage = {
  sourceType: SourceType;
  sourceReference?: string;
  title: string;
  runner: RunnerType;
  entry: string;
  files: EncodedFile[];
  importMode: ImportMode;
  metadata?: Record<string, unknown>;
  idempotencyKey: string;
  github?: {
    url: string;
    branch?: string;
    rootHint?: string;
    allowModuleScripts?: boolean;
    async?: boolean;
  };
  zip?: {
    fileName: string;
    fileBase64: string;
    rootHint?: string;
    allowModuleScripts?: boolean;
    async?: boolean;
  };
};

export type OperationStatus =
  | "received"
  | "validating"
  | "normalized"
  | "ingesting"
  | "waiting_on_import_job"
  | "draft_ready"
  | "compile_running"
  | "compile_failed"
  | "publish_running"
  | "published"
  | "published_with_warnings"
  | "failed"
  | "canceled";

export type ImportOperation = {
  operationId: string;
  userId: string;
  sourceType: SourceType;
  sourceReference?: string;
  status: OperationStatus;
  currentStage: string;
  capsuleId?: string;
  importJobId?: string;
  diagnostics: Array<{
    at: number;
    stage: string;
    code: string;
    message: string;
    retryable?: boolean;
    details?: Record<string, unknown>;
  }>;
  idempotencyKey: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
};

export type SessionRecord = {
  sessionId: string;
  userId: string;
  userHandle?: string;
  vibecodrToken: string;
  createdAt: number;
  expiresAt: number;
};

export type VibeClientUserContext = {
  userId: string;
  userHandle?: string;
  vibecodrToken: string;
};

export type PublishSeoFieldsInput = {
  title?: string;
  description?: string;
  imageKey?: string;
};

export type PublishSeoInput = PublishSeoFieldsInput & {
  og?: PublishSeoFieldsInput | null;
  twitter?: PublishSeoFieldsInput | null;
};

export type PublishThumbnailUpload = {
  contentType: string;
  fileBase64: string;
  fileName?: string;
};

export type PublishThumbnailFile = {
  fileId: string;
  downloadUrl: string;
  contentType: string;
  fileName?: string;
};

export type PublishDraftOptions = {
  visibility?: PublishVisibility;
  coverKey?: string;
  thumbnailFile?: PublishThumbnailFile;
  thumbnailUpload?: PublishThumbnailUpload;
  seo?: PublishSeoInput;
};

export type LiveVibeSummary = {
  postId: string;
  title: string;
  description?: string | null;
  visibility: PublishVisibility;
  authorHandle?: string;
  authorName?: string | null;
  coverKey?: string | null;
  createdAt?: number | string;
  updatedAt?: number | string;
  playerUrl: string;
  postUrl: string;
  capsuleId?: string | null;
  stats: {
    runs: number;
    likes: number;
    comments: number;
    remixes: number;
    views?: number;
    embedViews?: number;
  };
  packageSummary?: {
    runner?: string;
    entry?: string;
    artifactId?: string | null;
  };
};

export type VibeEngagementSummary = {
  postId: string;
  title: string;
  visibility: PublishVisibility;
  playerUrl: string;
  postUrl: string;
  stats: {
    runs: number;
    likes: number;
    comments: number;
    remixes: number;
    views?: number;
    embedViews?: number;
  };
  summary: string;
};

export type VibeShareSummary = {
  postId: string;
  title: string;
  visibility: PublishVisibility;
  postUrl: string;
  playerUrl: string;
  shareCta: string;
};

export type OperationWatchResult = {
  operation: ImportOperation;
  reachedTarget: boolean;
  timedOut: boolean;
  elapsedMs: number;
  pollCount: number;
  targetStatuses: OperationStatus[];
};

export type PublishReadinessLevel = "pass" | "warning" | "blocking";

export type PublishReadinessCheck = {
  id: string;
  level: PublishReadinessLevel;
  message: string;
  details?: Record<string, unknown>;
};

export type PublishReadinessResult = {
  readyToPublish: boolean;
  operation: ImportOperation;
  capsuleId?: string;
  checks: PublishReadinessCheck[];
  recommendedActions: string[];
};

export type QuickPublishStep = {
  step: "import" | "wait_for_draft" | "compile" | "publish";
  status: "completed" | "skipped" | "failed" | "timed_out";
  message: string;
  at: number;
  details?: Record<string, unknown>;
};

export type QuickPublishResult = {
  operation: ImportOperation;
  published: boolean;
  timedOut: boolean;
  steps: QuickPublishStep[];
  recommendedActions: string[];
};

export type OperationFailureExplanation = {
  operationId: string;
  status: OperationStatus;
  failed: boolean;
  rootCauseCode?: string;
  rootCauseMessage?: string;
  retryable: boolean;
  userMessage: string;
  nextActions: string[];
  latestDiagnostics: Array<{
    at: number;
    stage: string;
    code: string;
    message: string;
    retryable?: boolean;
  }>;
};
