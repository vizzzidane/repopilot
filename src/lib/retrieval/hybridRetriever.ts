import { chunkRepositoryFiles, type SourceChunk } from "./chunking";
import { rankChunksForQuestion, type RankedChunk } from "./scoring";

export type HybridRetrievalResult = {
  selectedChunks: RankedChunk[];
  fallbackUsed: boolean;
};

const DEFAULT_MAX_RESULTS = 12;

export function retrieveRelevantChunks(
  question: string,
  files: {
    path: string;
    content: string;
  }[],
  options?: {
    maxResults?: number;
  }
): HybridRetrievalResult {
  const maxResults = options?.maxResults ?? DEFAULT_MAX_RESULTS;

  const chunks = chunkRepositoryFiles(files);

  const rankedChunks = rankChunksForQuestion(question, chunks, {
    maxResults,
  });

  if (rankedChunks.length > 0) {
    return {
      selectedChunks: rankedChunks,
      fallbackUsed: false,
    };
  }

  const fallbackChunks: RankedChunk[] = chunks
    .slice(0, maxResults)
    .map((chunk: SourceChunk) => ({
      ...chunk,
      score: 0,
    }));

  return {
    selectedChunks: fallbackChunks,
    fallbackUsed: true,
  };
}

export function buildRetrievedContext(chunks: RankedChunk[]) {
  return chunks
    .map(
      (chunk) => `<repo_chunk path="${chunk.filePath}" lines="${chunk.startLine}-${chunk.endLine}" score="${chunk.score}">
${chunk.content}
</repo_chunk>`
    )
    .join("\n\n---\n\n");
}