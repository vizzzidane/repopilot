import { Redis } from "@upstash/redis";
import { z } from "zod";
import type { StoredSourceFile } from "@/lib/analysisStore";
import { AnalyzeResponseSchema } from "@/lib/aiSchemas";

const CachedSourceFileSchema = z.object({
  path: z.string().min(1).max(500),
  content: z.string().max(2500),
});

const CachedRepoResponseSchema = AnalyzeResponseSchema.extend({
  repoOwner: z.string().min(1),
  repoNameRaw: z.string().min(1),
  defaultBranch: z.string().min(1),
  repoHtmlUrl: z.string().url(),
  repoStars: z.number().optional(),
  repoForks: z.number().optional(),
  repoLanguage: z.string().nullable().optional(),
  repoSizeKb: z.number().optional(),
  indexedFiles: z
    .array(
      z.object({
        path: z.string().min(1).max(500),
      })
    )
    .default([]),
  analyzedFileCount: z.number().optional(),
  indexingStrategy: z.string().optional(),
});

const CachedRepoAnalysisSchema = z.object({
  response: CachedRepoResponseSchema,
  sourceFiles: z.array(CachedSourceFileSchema),
  createdAt: z.string(),
});

type CachedRepoAnalysis = z.infer<typeof CachedRepoAnalysisSchema>;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const REPO_CACHE_TTL_SECONDS = 60 * 60 * 3;
const MAX_CACHED_SOURCE_FILES = 16;
const MAX_CACHED_TOTAL_SOURCE_CHARS = 50000;

function getRepoCacheKey(owner: string, repo: string) {
  return `repopilot:repo-cache:${owner.toLowerCase()}/${repo.toLowerCase()}`;
}

function trimSourceFiles(sourceFiles: StoredSourceFile[]) {
  const trimmedFiles = sourceFiles
    .slice(0, MAX_CACHED_SOURCE_FILES)
    .map((file) => ({
      path: file.path,
      content: file.content.slice(0, 2500),
    }));

  let totalChars = 0;
  const boundedFiles: StoredSourceFile[] = [];

  for (const file of trimmedFiles) {
    const nextTotal = totalChars + file.content.length;

    if (nextTotal > MAX_CACHED_TOTAL_SOURCE_CHARS) {
      break;
    }

    totalChars = nextTotal;
    boundedFiles.push(file);
  }

  return boundedFiles;
}

export async function getCachedRepoAnalysis(owner: string, repo: string) {
  if (!redis) {
    return null;
  }

  const key = getRepoCacheKey(owner, repo);
  const cached = await redis.get<unknown>(key);

  if (!cached) {
    return null;
  }

  const parsed = CachedRepoAnalysisSchema.safeParse(cached);

  if (!parsed.success) {
    await redis.del(key);
    return null;
  }

  return parsed.data;
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

  const boundedSourceFiles = trimSourceFiles(sourceFiles);

  const payload: CachedRepoAnalysis = {
    response: CachedRepoResponseSchema.parse(response),
    sourceFiles: boundedSourceFiles,
    createdAt: new Date().toISOString(),
  };

  await redis.set(getRepoCacheKey(owner, repo), payload, {
    ex: REPO_CACHE_TTL_SECONDS,
  });
}