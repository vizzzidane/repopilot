import { describe, expect, it } from "vitest";
import { rankChunksForQuestion } from "./scoring";
import type { SourceChunk } from "./chunking";

const chunks: SourceChunk[] = [
  {
    id: "1",
    filePath: "src/api/auth.ts",
    content: "Handles JWT authentication and login sessions",
    startLine: 1,
    endLine: 10,
  },
  {
    id: "2",
    filePath: "README.md",
    content: "Project setup and installation guide",
    startLine: 1,
    endLine: 10,
  },
  {
    id: "3",
    filePath: "src/services/payment.ts",
    content: "Processes Stripe payments and invoices",
    startLine: 1,
    endLine: 10,
  },
];

describe("rankChunksForQuestion", () => {
  it("returns relevant chunks", () => {
    const ranked = rankChunksForQuestion(
      "How does authentication work?",
      chunks
    );

    expect(ranked.length).toBeGreaterThan(0);
  });

  it("ranks authentication chunk highest", () => {
    const ranked = rankChunksForQuestion(
      "authentication login jwt",
      chunks
    );

    expect(ranked[0]?.filePath).toBe("src/api/auth.ts");
  });

  it("boosts important paths", () => {
    const ranked = rankChunksForQuestion(
      "project setup",
      chunks
    );

    expect(ranked[0]?.filePath).toBe("README.md");
  });

  it("limits result count", () => {
    const ranked = rankChunksForQuestion(
      "project",
      chunks,
      {
        maxResults: 1,
      }
    );

    expect(ranked.length).toBe(1);
  });

  it("filters chunks with no keyword or path relevance", () => {
  const irrelevantChunks: SourceChunk[] = [
    {
      id: "irrelevant",
      filePath: "misc/notes.txt",
      content: "banana orange pineapple",
      startLine: 1,
      endLine: 1,
    },
  ];

  const ranked = rankChunksForQuestion(
    "quantum physics black holes",
    irrelevantChunks
  );

  expect(ranked.length).toBe(0);
});
});