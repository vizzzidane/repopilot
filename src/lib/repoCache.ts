import { Redis } from "@upstash/redis";
import { z } from "zod";
import type { StoredSourceFile } from "@/lib/analysisStore";
import { AnalyzeResponseSchema } from "@/lib/aiSchemas";

const REPO_CACHE_TTL_SECONDS = 60 * 60 * 3;
const MAX_CACHED_SOURCE_FILES = 16;
const MAX_CACHED_FILE_CHARS = 2500;
const MAX_CACHED_TOTAL_SOURCE_CHARS = 50000;
const MAX_CACHED_IMPORTS_PER_FILE = 20;

const CachedSourceFileSchema = z.object({
  path: z.string().min(1).max(500),
  content: z.string().max(MAX_CACHED_FILE_CHARS),
  imports: z.array(z.string().min(1).max(300)).optional().default([]),
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
  partialAnalysis: z.boolean().optional(),
  analysisWarnings: z.array(z.string()).optional(),

  repositoryRisks: z
    .array(
      z.object({
        level: z.enum(["low", "medium", "high"]),
        title: z.string(),
        description: z.string(),
      })
    )
    .optional(),

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

function normalizeCachePart(value: string) {
  return value.trim().toLowerCase();
}

function getRepoCacheKey(owner: string, repo: string) {
  const normalizedOwner = normalizeCachePart(owner);
  const normalizedRepo = normalizeCachePart(repo);

  return `repopilot:repo-cache:${normalizedOwner}/${normalizedRepo}`;
}

function sanitizeCachedText(value: string) {
  return value.replace(/\u0000/g, "");
}

function trimSourceFiles(sourceFiles: StoredSourceFile[]) {
  let totalChars = 0;
  const boundedFiles: z.infer<typeof CachedSourceFileSchema>[] = [];

  for (const file of sourceFiles.slice(0, MAX_CACHED_SOURCE_FILES)) {
    const safePath = sanitizeCachedText(file.path).slice(0, 500);
    const safeContent = sanitizeCachedText(file.content).slice(
      0,
      MAX_CACHED_FILE_CHARS
    );

    const safeImports = Array.isArray(file.imports)
      ? file.imports
          .filter((value) => typeof value === "string")
          .map((value) => sanitizeCachedText(value).slice(0, 300))
          .filter(Boolean)
          .slice(0, MAX_CACHED_IMPORTS_PER_FILE)
      : [];

    const nextTotal = totalChars + safeContent.length;

    if (nextTotal > MAX_CACHED_TOTAL_SOURCE_CHARS) {
      break;
    }

    boundedFiles.push({
      path: safePath,
      content: safeContent,
      imports: safeImports,
    });

    totalChars = nextTotal;
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

  const parsed = CachedRepoAnalysisSchema.parse(payload);

  await redis.set(getRepoCacheKey(owner, repo), parsed, {
    ex: REPO_CACHE_TTL_SECONDS,
  });
}