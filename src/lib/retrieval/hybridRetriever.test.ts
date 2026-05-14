import { describe, expect, it } from "vitest";
import {
  buildRetrievedContext,
  retrieveRelevantChunks,
} from "./hybridRetriever";

const files = [
  {
    path: "src/auth.ts",
    content: `
      export function login() {
        return "jwt auth";
      }
    `,
  },
  {
    path: "README.md",
    content: `
      Installation instructions and setup guide.
    `,
  },
];

describe("retrieveRelevantChunks", () => {
  it("retrieves relevant chunks", () => {
    const result = retrieveRelevantChunks(
      "authentication jwt login",
      files
    );

    expect(result.selectedChunks.length).toBeGreaterThan(0);
    expect(result.fallbackUsed).toBe(false);
  });

  it("returns fallback chunks when no matches exist", () => {
    const irrelevantFiles = [
      {
        path: "misc/notes.txt",
        content: "banana orange pineapple",
      },
    ];

    const result = retrieveRelevantChunks(
      "quantum mechanics black holes",
      irrelevantFiles
    );

    expect(result.selectedChunks.length).toBeGreaterThan(0);
    expect(result.fallbackUsed).toBe(true);
  });

  it("limits retrieval results", () => {
    const result = retrieveRelevantChunks(
      "setup auth",
      files,
      {
        maxResults: 1,
      }
    );

    expect(result.selectedChunks.length).toBe(1);
  });
});

describe("buildRetrievedContext", () => {
  it("builds repo chunk context blocks", () => {
    const result = retrieveRelevantChunks(
      "authentication",
      files
    );

    const context = buildRetrievedContext(
      result.selectedChunks
    );

    expect(context).toContain("<repo_chunk");
    expect(context).toContain("src/auth.ts");
  });
});