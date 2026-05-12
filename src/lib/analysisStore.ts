import { Redis } from "@upstash/redis";

export type StoredSourceFile = {
  path: string;
  content: string;
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

  await redis.set(getAnalysisKey(analysisId), analysis, {
    ex: ANALYSIS_TTL_SECONDS,
  });
}

export async function getAnalysis(analysisId: string) {
  if (!redis) {
    throw new Error("Analysis storage is not configured.");
  }

  return redis.get<StoredAnalysis>(getAnalysisKey(analysisId));
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

  const existing =
    (await redis.get<UserAnalysisHistoryItem[]>(key)) || [];

  const updated = [item, ...existing].slice(0, 50);

  await redis.set(key, updated, {
    ex: ANALYSIS_TTL_SECONDS,
  });
}

export async function getUserAnalysisHistory(userId: string) {
  if (!redis) {
    throw new Error("Analysis storage is not configured.");
  }

  return (
    (await redis.get<UserAnalysisHistoryItem[]>(
      getUserHistoryKey(userId)
    )) || []
  );
}