import { Redis } from "@upstash/redis";

export type StoredSourceFile = {
  path: string;
  content: string;
};

export type StoredAnalysis = {
  repoOwner: string;
  repoNameRaw: string;
  repoHtmlUrl: string;
  defaultBranch: string;
  sourceFiles: StoredSourceFile[];
  createdAt: string;
};

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const ANALYSIS_TTL_SECONDS = 60 * 60 * 6;

function getKey(analysisId: string) {
  return `repopilot:analysis:${analysisId}`;
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

  await redis.set(getKey(analysisId), analysis, {
    ex: ANALYSIS_TTL_SECONDS,
  });
}

export async function getAnalysis(analysisId: string) {
  if (!redis) {
    throw new Error("Analysis storage is not configured.");
  }

  return redis.get<StoredAnalysis>(getKey(analysisId));
}