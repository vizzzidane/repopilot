import { Redis } from "@upstash/redis";
import type { StoredSourceFile } from "@/lib/analysisStore";

type CachedRepoAnalysis = {
  response: Record<string, unknown>;
  sourceFiles: StoredSourceFile[];
  createdAt: string;
};

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const REPO_CACHE_TTL_SECONDS = 60 * 60 * 3;

function getRepoCacheKey(owner: string, repo: string) {
  return `repopilot:repo-cache:${owner.toLowerCase()}/${repo.toLowerCase()}`;
}

export async function getCachedRepoAnalysis(owner: string, repo: string) {
  if (!redis) {
    return null;
  }

  return redis.get<CachedRepoAnalysis>(getRepoCacheKey(owner, repo));
}

export async function setCachedRepoAnalysis(
  owner: string,
  repo: string,
  response: Record<string, unknown>,
  sourceFiles: StoredSourceFile[]
) {
  if (!redis) {
    return;
  }

  await redis.set(
    getRepoCacheKey(owner, repo),
    {
      response,
      sourceFiles,
      createdAt: new Date().toISOString(),
    },
    {
      ex: REPO_CACHE_TTL_SECONDS,
    }
  );
}