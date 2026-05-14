export type SourceChunk = {
  id: string;
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
};

const DEFAULT_MAX_CHUNK_LINES = 80;
const DEFAULT_OVERLAP_LINES = 12;
const MAX_CHUNK_CHAR_LENGTH = 6000;

function sanitizeChunkText(value: string) {
  return value.replace(/\u0000/g, "");
}

export function chunkSourceFile(
  filePath: string,
  content: string,
  options?: {
    maxChunkLines?: number;
    overlapLines?: number;
  }
): SourceChunk[] {
  const maxChunkLines =
    options?.maxChunkLines ?? DEFAULT_MAX_CHUNK_LINES;

  const overlapLines =
    options?.overlapLines ?? DEFAULT_OVERLAP_LINES;

  const normalizedContent = sanitizeChunkText(content);

  const lines = normalizedContent.split("\n");

  if (lines.length === 0) {
    return [];
  }

  const chunks: SourceChunk[] = [];

  let startIndex = 0;

  while (startIndex < lines.length) {
    const endIndex = Math.min(
      startIndex + maxChunkLines,
      lines.length
    );

    const chunkLines = lines.slice(startIndex, endIndex);

    const chunkContent = chunkLines
      .join("\n")
      .slice(0, MAX_CHUNK_CHAR_LENGTH);

    chunks.push({
      id: `${filePath}:${startIndex + 1}-${endIndex}`,
      filePath,
      content: chunkContent,
      startLine: startIndex + 1,
      endLine: endIndex,
    });

    if (endIndex >= lines.length) {
      break;
    }

    startIndex += Math.max(1, maxChunkLines - overlapLines);
  }

  return chunks;
}

export function chunkRepositoryFiles(
  files: {
    path: string;
    content: string;
  }[]
) {
  return files.flatMap((file) =>
    chunkSourceFile(file.path, file.content)
  );
}