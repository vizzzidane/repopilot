import { Redis } from "@upstash/redis";
import type { EmbeddingVector } from "./embeddings";

const EMBEDDING_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;

const redis =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

function normalizeCacheKey(text: string) {
  return text.trim().toLowerCase();
}

function createEmbeddingCacheKey(text: string) {
  return `repopilot:embedding:${normalizeCacheKey(text)}`;
}

export async function getCachedEmbedding(
  text: string
): Promise<EmbeddingVector | null> {
  if (!redis) {
    return null;
  }

  const key = createEmbeddingCacheKey(text);

  const value = await redis.get<unknown>(key);

  if (!Array.isArray(value)) {
    return null;
  }

  const embedding = value.filter(
    (item): item is number => typeof item === "number"
  );

  if (embedding.length === 0) {
    return null;
  }

  return embedding;
}

export async function setCachedEmbedding(
  text: string,
  embedding: EmbeddingVector
) {
  if (!redis) {
    return;
  }

  if (embedding.length === 0) {
    return;
  }

  const key = createEmbeddingCacheKey(text);

  await redis.set(key, embedding, {
    ex: EMBEDDING_CACHE_TTL_SECONDS,
  });
}
