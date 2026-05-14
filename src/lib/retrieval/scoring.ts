import type { SourceChunk } from "./chunking";

export type RankedChunk = SourceChunk & {
  score: number;
};

const PATH_IMPORTANCE_PATTERNS = [
  /readme/i,
  /package\.json/i,
  /app\//i,
  /src\//i,
  /api/i,
  /service/i,
  /controller/i,
  /config/i,
  /index/i,
];

function normalizeText(value: string) {
  return value.toLowerCase();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/[^a-zA-Z0-9_]+/)
    .filter(Boolean);
}

function calculateKeywordOverlapScore(
  questionTokens: string[],
  chunkTokens: string[]
) {
  const chunkTokenSet = new Set(chunkTokens);

  let matches = 0;

  for (const token of questionTokens) {
    if (chunkTokenSet.has(token)) {
      matches += 1;
    }
  }

  return matches;
}

function calculatePathScore(filePath: string) {
  let score = 0;

  for (const pattern of PATH_IMPORTANCE_PATTERNS) {
    if (pattern.test(filePath)) {
      score += 2;
    }
  }

  return score;
}

function calculateExactPhraseBoost(
  question: string,
  content: string
) {
  const normalizedQuestion = normalizeText(question);
  const normalizedContent = normalizeText(content);

  if (
    normalizedQuestion.length > 8 &&
    normalizedContent.includes(normalizedQuestion)
  ) {
    return 15;
  }

  return 0;
}

export function rankChunksForQuestion(
  question: string,
  chunks: SourceChunk[],
  options?: {
    maxResults?: number;
  }
): RankedChunk[] {
  const maxResults = options?.maxResults ?? 12;

  const questionTokens = tokenize(question);

  const ranked = chunks.map((chunk) => {
    const chunkTokens = tokenize(chunk.content);

    const keywordScore = calculateKeywordOverlapScore(
      questionTokens,
      chunkTokens
    );

    const pathScore = calculatePathScore(chunk.filePath);

    const exactPhraseBoost = calculateExactPhraseBoost(
      question,
      chunk.content
    );

    const totalScore =
      keywordScore +
      pathScore +
      exactPhraseBoost;

    return {
      ...chunk,
      score: totalScore,
    };
  });

  return ranked
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}