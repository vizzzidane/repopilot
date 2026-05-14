import { afterEach, describe, expect, it } from "vitest";
import { buildEmbeddingIndex, type EmbeddingChunk } from "../embeddingIndex";

const originalEnv = process.env.ENABLE_SEMANTIC_RETRIEVAL;

afterEach(() => {
  process.env.ENABLE_SEMANTIC_RETRIEVAL = originalEnv;
});

function makeChunk(overrides?: Partial<EmbeddingChunk>): EmbeddingChunk {
  return {
    filePath: "src/app/page.tsx",
    content: "export default function Page() { return null; }",
    startLine: 1,
    endLine: 1,
    ...overrides,
  };
}

describe("embeddingIndex", () => {
  it("does nothing when semantic retrieval is disabled", async () => {
    process.env.ENABLE_SEMANTIC_RETRIEVAL = "false";

    const result = await buildEmbeddingIndex([makeChunk()]);

    expect(result.semanticRetrievalEnabled).toBe(false);
    expect(result.embeddedChunks).toEqual([]);
    expect(result.cacheHits).toBe(0);
    expect(result.cacheMisses).toBe(0);
  });

  it("does nothing when semantic retrieval flag is missing", async () => {
    delete process.env.ENABLE_SEMANTIC_RETRIEVAL;

    const result = await buildEmbeddingIndex([makeChunk()]);

    expect(result.semanticRetrievalEnabled).toBe(false);
    expect(result.embeddedChunks).toEqual([]);
  });

  it("returns placeholder embedded chunks when semantic retrieval is enabled", async () => {
    process.env.ENABLE_SEMANTIC_RETRIEVAL = "true";

    const result = await buildEmbeddingIndex([
      makeChunk({
        filePath: "src/lib/retrieval/hybridRetriever.ts",
        content: "retrieve relevant chunks",
        startLine: 10,
        endLine: 20,
      }),
    ]);

    expect(result.semanticRetrievalEnabled).toBe(true);
    expect(result.cacheHits).toBe(0);
    expect(result.cacheMisses).toBe(1);
    expect(result.embeddedChunks).toEqual([
      {
        filePath: "src/lib/retrieval/hybridRetriever.ts",
        content: "retrieve relevant chunks",
        startLine: 10,
        endLine: 20,
        embedding: [],
      },
    ]);
  });

  it("rejects too many chunks when semantic retrieval is enabled", async () => {
    process.env.ENABLE_SEMANTIC_RETRIEVAL = "true";

    const chunks = Array.from({ length: 201 }, (_, index) =>
      makeChunk({
        filePath: `src/file${index}.ts`,
      }),
    );

    await expect(buildEmbeddingIndex(chunks)).rejects.toThrow(
      "Too many chunks",
    );
  });

  it("rejects chunks that exceed the per-chunk character limit", async () => {
    process.env.ENABLE_SEMANTIC_RETRIEVAL = "true";

    await expect(
      buildEmbeddingIndex([
        makeChunk({
          content: "a".repeat(4001),
        }),
      ]),
    ).rejects.toThrow("Chunk exceeds maximum size");
  });

  it("rejects total content above the aggregate character limit", async () => {
    process.env.ENABLE_SEMANTIC_RETRIEVAL = "true";

    const chunks = Array.from({ length: 51 }, (_, index) =>
      makeChunk({
        filePath: `src/file${index}.ts`,
        content: "a".repeat(4000),
      }),
    );

    await expect(buildEmbeddingIndex(chunks)).rejects.toThrow(
      "Total embedding content exceeds allowed limit",
    );
  });
});