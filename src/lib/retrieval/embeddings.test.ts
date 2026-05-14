import { describe, expect, it } from "vitest";
import {
  cosineSimilarity,
  rankEmbeddedChunks,
} from "./embeddings";
import type { EmbeddedChunk } from "./embeddings";

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(
      cosineSimilarity([1, 2, 3], [1, 2, 3])
    ).toBeCloseTo(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(
      cosineSimilarity([1, 0], [0, 1])
    ).toBeCloseTo(0);
  });

  it("returns 0 for mismatched vector lengths", () => {
    expect(
      cosineSimilarity([1, 2], [1, 2, 3])
    ).toBe(0);
  });

  it("returns 0 for empty vectors", () => {
    expect(cosineSimilarity([], [])).toBe(0);
  });
});

describe("rankEmbeddedChunks", () => {
  const chunks: EmbeddedChunk[] = [
    {
      id: "1",
      filePath: "auth.ts",
      content: "authentication",
      startLine: 1,
      endLine: 10,
      embedding: [1, 0],
    },
    {
      id: "2",
      filePath: "payments.ts",
      content: "payments",
      startLine: 1,
      endLine: 10,
      embedding: [0, 1],
    },
  ];

  it("ranks most similar chunks first", () => {
    const ranked = rankEmbeddedChunks([1, 0], chunks);

    expect(ranked[0]?.filePath).toBe("auth.ts");
  });

  it("limits max results", () => {
    const ranked = rankEmbeddedChunks([1, 0], chunks, {
      maxResults: 1,
    });

    expect(ranked.length).toBe(1);
  });

  it("filters zero-score chunks", () => {
    const ranked = rankEmbeddedChunks([1, 0], [
      {
        id: "3",
        filePath: "none.ts",
        content: "none",
        startLine: 1,
        endLine: 1,
        embedding: [0, 1],
      },
    ]);

    expect(ranked.length).toBe(0);
  });
});