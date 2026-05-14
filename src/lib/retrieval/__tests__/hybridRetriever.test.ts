import { describe, expect, it } from "vitest";
import {
  buildRetrievedContext,
  retrieveRelevantChunks,
} from "../hybridRetriever";

describe("hybridRetriever", () => {
  it("returns ranked chunks when there is a query match", () => {
    const result = retrieveRelevantChunks("authentication route", [
      {
        path: "src/app/api/auth/route.ts",
        content: "export async function GET() { return auth(); }",
      },
      {
        path: "README.md",
        content: "Project documentation.",
      },
    ]);

    expect(result.fallbackUsed).toBe(false);
    expect(result.selectedChunks.length).toBeGreaterThan(0);
    expect(result.selectedChunks[0].filePath).toContain("auth");
  });

  it("returns no chunks for an empty repository", () => {
    const result = retrieveRelevantChunks("anything", []);

    expect(result.selectedChunks).toEqual([]);
  });

  it("respects maxResults during retrieval", () => {
    const files = Array.from({ length: 10 }, (_, index) => ({
      path: `src/file${index}.ts`,
      content: `authentication route handler ${index}`,
    }));

    const result = retrieveRelevantChunks("authentication route", files, {
      maxResults: 3,
    });

    expect(result.selectedChunks.length).toBeLessThanOrEqual(3);
  });

  it("handles empty file content safely", () => {
    const result = retrieveRelevantChunks("anything", [
      {
        path: "src/empty.ts",
        content: "",
      },
    ]);

    expect(Array.isArray(result.selectedChunks)).toBe(true);
  });

  it("handles very large files while still returning bounded results", () => {
    const result = retrieveRelevantChunks(
      "authentication",
      [
        {
          path: "src/large.ts",
          content: "authentication ".repeat(10_000),
        },
      ],
      {
        maxResults: 2,
      },
    );

    expect(result.selectedChunks.length).toBeLessThanOrEqual(2);
  });

  it("handles null-byte content without throwing", () => {
    const result = retrieveRelevantChunks("token", [
      {
        path: "src/weird.ts",
        content: "const token = 'abc';\u0000console.log(token);",
      },
    ]);

    expect(result.selectedChunks.length).toBeGreaterThan(0);
  });

  it("preserves weird file paths as metadata without executing or normalizing them", () => {
    const result = retrieveRelevantChunks("handler", [
      {
        path: 'src/<script>alert("xss")</script>.ts',
        content: "export function handler() { return true; }",
      },
    ]);

    expect(result.selectedChunks[0].filePath).toBe(
      'src/<script>alert("xss")</script>.ts',
    );
  });

  it("builds retrieved context with file paths and line ranges", () => {
    const result = retrieveRelevantChunks("authentication", [
      {
        path: "src/auth.ts",
        content: "export function authentication() {\n  return true;\n}",
      },
    ]);

    const context = buildRetrievedContext(result.selectedChunks);

    expect(context).toContain('<repo_chunk path="src/auth.ts"');
    expect(context).toContain('lines="1-3"');
    expect(context).toContain("authentication");
    expect(context).toContain("</repo_chunk>");
  });

  it("builds empty context for no selected chunks", () => {
    expect(buildRetrievedContext([])).toBe("");
  });
});