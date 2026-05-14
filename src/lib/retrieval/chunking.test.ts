import { describe, expect, it } from "vitest";
import {
  chunkRepositoryFiles,
  chunkSourceFile,
} from "./chunking";

describe("chunkSourceFile", () => {
  it("creates chunks from source files", () => {
    const content = Array.from(
      { length: 120 },
      (_, index) => `line-${index + 1}`
    ).join("\n");

    const chunks = chunkSourceFile("src/example.ts", content, {
      maxChunkLines: 50,
      overlapLines: 10,
    });

    expect(chunks.length).toBeGreaterThan(1);

    expect(chunks[0]).toMatchObject({
      filePath: "src/example.ts",
      startLine: 1,
      endLine: 50,
    });

    expect(chunks[1].startLine).toBe(41);
  });

  it("preserves file path information", () => {
    const chunks = chunkSourceFile(
      "app/page.tsx",
      "hello\nworld"
    );

    expect(chunks[0]?.filePath).toBe("app/page.tsx");
  });

  it("sanitizes null bytes", () => {
    const chunks = chunkSourceFile(
      "test.ts",
      "safe\u0000unsafe"
    );

    expect(chunks[0]?.content.includes("\u0000")).toBe(false);
  });

  it("limits chunk content length", () => {
    const hugeLine = "x".repeat(10000);

    const chunks = chunkSourceFile(
      "huge.ts",
      hugeLine
    );

    expect(chunks[0]?.content.length).toBeLessThanOrEqual(6000);
  });
});

describe("chunkRepositoryFiles", () => {
  it("chunks multiple repository files", () => {
    const chunks = chunkRepositoryFiles([
      {
        path: "a.ts",
        content: "const a = 1;",
      },
      {
        path: "b.ts",
        content: "const b = 2;",
      },
    ]);

    expect(chunks.length).toBe(2);

    expect(chunks.map((chunk) => chunk.filePath)).toEqual([
      "a.ts",
      "b.ts",
    ]);
  });
});