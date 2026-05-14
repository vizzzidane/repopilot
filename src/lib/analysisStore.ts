import { Redis } from "@upstash/redis";
import { z } from "zod";

export type StoredSourceFile = {
  path: string;
  content: string;
  imports?: string[];
};

export type StoredAnalysis = {
  userId: string;

  repoOwner: string;
  repoNameRaw: string;
  repoHtmlUrl: string;
  defaultBranch: string;

  sourceFiles: StoredSourceFile[];

  createdAt: string;
};

export type UserAnalysisHistoryItem = {
  analysisId: string;

  repoOwner: string;
  repoNameRaw: string;
  repoHtmlUrl: string;

  createdAt: string;
};

const StoredSourceFileSchema = z.object({
  path: z.string().min(1).max(500),
  content: z.string().max(2500),
});

const StoredAnalysisSchema = z.object({
  userId: z.string().min(1),

  repoOwner: z.string().min(1),
  repoNameRaw: z.string().min(1),
  repoHtmlUrl: z.string().url(),
  defaultBranch: z.string().min(1),

  sourceFiles: z.array(StoredSourceFileSchema),

  createdAt: z.string(),
});

const UserAnalysisHistoryItemSchema = z.object({
  analysisId: z.string().min(1).max(100),

  repoOwner: z.string().min(1),
  repoNameRaw: z.string().min(1),
  repoHtmlUrl: z.string().url(),

  createdAt: z.string(),
});

const UserAnalysisHistorySchema = z.array(UserAnalysisHistoryItemSchema);

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const ANALYSIS_TTL_SECONDS = 60 * 60 * 6;

function getAnalysisKey(analysisId: string) {
  return `repopilot:analysis:${analysisId}`;
}

function getUserHistoryKey(userId: string) {
  return `repopilot:user-history:${userId}`;
}

function sanitizeStoredText(value: string) {
  return value.replace(/\u0000/g, "");
}

function sanitizeStoredAnalysis(analysis: StoredAnalysis): StoredAnalysis {
  return {
    ...analysis,
    repoOwner: sanitizeStoredText(analysis.repoOwner),
    repoNameRaw: sanitizeStoredText(analysis.repoNameRaw),
    repoHtmlUrl: sanitizeStoredText(analysis.repoHtmlUrl),
    defaultBranch: sanitizeStoredText(analysis.defaultBranch),
    sourceFiles: analysis.sourceFiles.map((file) => ({
      path: sanitizeStoredText(file.path).slice(0, 500),
      content: sanitizeStoredText(file.content).slice(0, 2500),
    })),
    createdAt: sanitizeStoredText(analysis.createdAt),
  };
}

function sanitizeHistoryItem(
  item: UserAnalysisHistoryItem
): UserAnalysisHistoryItem {
  return {
    analysisId: sanitizeStoredText(item.analysisId).slice(0, 100),
    repoOwner: sanitizeStoredText(item.repoOwner),
    repoNameRaw: sanitizeStoredText(item.repoNameRaw),
    repoHtmlUrl: sanitizeStoredText(item.repoHtmlUrl),
    createdAt: sanitizeStoredText(item.createdAt),
  };
}

export function createAnalysisId() {
  return crypto.randomUUID();
}

export async function storeAnalysis(
  analysisId: string,
  analysis: StoredAnalysis
) {
  if (!redis) {
    throw new Error("Analysis storage is not configured.");
  }

  const safeAnalysis = StoredAnalysisSchema.parse(
    sanitizeStoredAnalysis(analysis)
  );

  await redis.set(getAnalysisKey(analysisId), safeAnalysis, {
    ex: ANALYSIS_TTL_SECONDS,
  });
}

export async function getAnalysis(analysisId: string) {
  if (!redis) {
    throw new Error("Analysis storage is not configured.");
  }

  const analysis = await redis.get<unknown>(getAnalysisKey(analysisId));

  if (!analysis) {
    return null;
  }

  const parsed = StoredAnalysisSchema.safeParse(analysis);

  if (!parsed.success) {
    await redis.del(getAnalysisKey(analysisId));
    return null;
  }

  return parsed.data;
}

export async function deleteAnalysis(analysisId: string) {
  if (!redis) {
    throw new Error("Analysis storage is not configured.");
  }

  await redis.del(getAnalysisKey(analysisId));
}

export async function addAnalysisToUserHistory(
  userId: string,
  item: UserAnalysisHistoryItem
) {
  if (!redis) {
    throw new Error("Analysis storage is not configured.");
  }

  const key = getUserHistoryKey(userId);
  const existingRaw = await redis.get<unknown>(key);
  const existingParsed = UserAnalysisHistorySchema.safeParse(existingRaw);
  const existing = existingParsed.success ? existingParsed.data : [];

  const safeItem = UserAnalysisHistoryItemSchema.parse(
    sanitizeHistoryItem(item)
  );

  const updated = [
    safeItem,
    ...existing.filter(
      (historyItem) => historyItem.analysisId !== safeItem.analysisId
    ),
  ].slice(0, 50);

  await redis.set(key, updated, {
    ex: ANALYSIS_TTL_SECONDS,
  });
}

export async function getUserAnalysisHistory(userId: string) {
  if (!redis) {
    throw new Error("Analysis storage is not configured.");
  }

  const history = await redis.get<unknown>(getUserHistoryKey(userId));
  const parsed = UserAnalysisHistorySchema.safeParse(history);

  if (!parsed.success) {
    await redis.del(getUserHistoryKey(userId));
    return [];
  }

  return parsed.data;
}