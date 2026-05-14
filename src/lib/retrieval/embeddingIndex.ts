export type EmbeddingChunk = {
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
};

export type EmbeddedChunk = EmbeddingChunk & {
  embedding: number[];
};

export type EmbeddingIndexResult = {
  embeddedChunks: EmbeddedChunk[];
  cacheHits: number;
  cacheMisses: number;
  semanticRetrievalEnabled: boolean;
};

const MAX_CHUNKS = 200;
const MAX_CHARS_PER_CHUNK = 4000;
const MAX_TOTAL_CHARS = 200_000;

function isSemanticRetrievalEnabled() {
  return process.env.ENABLE_SEMANTIC_RETRIEVAL === "true";
}

function validateChunks(chunks: EmbeddingChunk[]) {
  if (chunks.length > MAX_CHUNKS) {
    throw new Error("Too many chunks for embedding index generation.");
  }

  let totalChars = 0;

  for (const chunk of chunks) {
    if (chunk.content.length > MAX_CHARS_PER_CHUNK) {
      throw new Error(
        `Chunk exceeds maximum size: ${chunk.filePath}#L${chunk.startLine}-L${chunk.endLine}`,
      );
    }

    totalChars += chunk.content.length;
  }

  if (totalChars > MAX_TOTAL_CHARS) {
    throw new Error("Total embedding content exceeds allowed limit.");
  }
}

/**
 * Placeholder embedding index builder.
 *
 * Current behavior:
 * - Feature-flagged only
 * - Performs bounded validation
 * - Returns deterministic empty embeddings
 * - Does NOT call external embedding providers yet
 *
 * Future behavior:
 * - Check embedding cache
 * - Generate embeddings for cache misses
 * - Persist embeddings
 * - Reuse cached vectors during retrieval
 */
export async function buildEmbeddingIndex(
  chunks: EmbeddingChunk[],
): Promise<EmbeddingIndexResult> {
  const semanticRetrievalEnabled = isSemanticRetrievalEnabled();

  if (!semanticRetrievalEnabled) {
    return {
      embeddedChunks: [],
      cacheHits: 0,
      cacheMisses: 0,
      semanticRetrievalEnabled: false,
    };
  }

  validateChunks(chunks);

  const embeddedChunks: EmbeddedChunk[] = chunks.map((chunk) => ({
    ...chunk,
    embedding: [],
  }));

  return {
    embeddedChunks,
    cacheHits: 0,
    cacheMisses: embeddedChunks.length,
    semanticRetrievalEnabled: true,
  };
}