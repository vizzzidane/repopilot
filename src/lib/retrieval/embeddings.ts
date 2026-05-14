export type EmbeddingVector = number[];

export type EmbeddedChunk = {
  id: string;
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
  embedding: EmbeddingVector;
};

export function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector) {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

export function rankEmbeddedChunks(
  queryEmbedding: EmbeddingVector,
  chunks: EmbeddedChunk[],
  options?: {
    maxResults?: number;
  }
) {
  const maxResults = options?.maxResults ?? 12;

  return chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}