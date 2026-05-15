import { describe, expect, it } from "vitest";
import { sanitizeMermaidDiagram } from "./mermaid";

describe("sanitizeMermaidDiagram", () => {
  it("allows valid graph TD diagrams", () => {
    const diagram = `
graph TD
A[Client] --> B[API]
B --> C[Database]
`.trim();

    expect(sanitizeMermaidDiagram(diagram)).toBe(diagram);
  });

  it("rejects non-string input", () => {
    expect(sanitizeMermaidDiagram(null)).toBe("");
    expect(sanitizeMermaidDiagram(undefined)).toBe("");
    expect(sanitizeMermaidDiagram(123)).toBe("");
    expect(sanitizeMermaidDiagram({})).toBe("");
  });

  it("rejects empty diagrams", () => {
    expect(sanitizeMermaidDiagram("")).toBe("");
    expect(sanitizeMermaidDiagram("   ")).toBe("");
  });

  it("rejects diagrams that do not start with graph TD", () => {
    expect(
      sanitizeMermaidDiagram(`
flowchart LR
A --> B
`),
    ).toBe("");

    expect(
      sanitizeMermaidDiagram(`
graph LR
A --> B
`),
    ).toBe("");
  });

  it("rejects diagrams containing script tags", () => {
    const malicious = `
graph TD
A --> B
<script>alert("xss")</script>
`;

    expect(sanitizeMermaidDiagram(malicious)).toBe("");
  });

  it("rejects diagrams containing HTML tags", () => {
    const malicious = `
graph TD
A --> B
<div>bad</div>
`;

    expect(sanitizeMermaidDiagram(malicious)).toBe("");
  });

  it("rejects diagrams containing javascript urls", () => {
    const malicious = `
graph TD
A[javascript:alert(1)] --> B
`;

    expect(sanitizeMermaidDiagram(malicious)).toBe("");
  });

  it("rejects diagrams exceeding max character limits", () => {
    const hugeDiagram = `graph TD\n${"A-->B\n".repeat(500)}`;

    expect(sanitizeMermaidDiagram(hugeDiagram)).toBe("");
  });

  it("rejects diagrams exceeding max line limits", () => {
    const manyLines = [
      "graph TD",
      ...Array.from({ length: 50 }, (_, i) => `A${i} --> B${i}`),
    ].join("\n");

    expect(sanitizeMermaidDiagram(manyLines)).toBe("");
  });

  it("trims surrounding whitespace from valid diagrams", () => {
    const result = sanitizeMermaidDiagram(`
      
graph TD
A --> B

`);

    expect(result).toBe("graph TD\nA --> B");
  });
});