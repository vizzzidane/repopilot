import { describe, expect, it } from "vitest";
import { redactSecrets, scanSecrets } from "../secretScan";

describe("secretScan security helper", () => {
  it("detects common secret formats", () => {
    const content = `
OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456
GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz123456
AWS_ACCESS_KEY_ID=AKIA1234567890ABCDEF
JWT=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature123
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----"
API_KEY=very-secret-value-12345
`;

    const findings = scanSecrets(content);
    const types = findings.map((finding) => finding.type);

    expect(types).toContain("OpenAI API key");
    expect(types).toContain("GitHub token");
    expect(types).toContain("AWS access key");
    expect(types).toContain("JWT");
    expect(types).toContain("Private key");
    expect(types).toContain("Likely secret assignment");
  });

  it("does not flag ordinary config or documentation text", () => {
    const content = `
const apiBaseUrl = "https://example.com";
const tokenBudget = 4000;
const passwordMinLength = 12;
README: Set API_KEY in your local .env file.
`;

    expect(scanSecrets(content)).toEqual([]);
  });

  it("redacts secrets while preserving surrounding useful content", () => {
    const content = `
export const model = "gpt-4.1-mini";
OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456
export const timeoutMs = 30000;
`;

    const result = redactSecrets(content);

    expect(result.redactedContent).toContain(
      'export const model = "gpt-4.1-mini"',
    );
    expect(result.redactedContent).toContain("export const timeoutMs = 30000");
    expect(result.redactedContent).toContain("[REDACTED: OpenAI API key]");
    expect(result.redactedContent).not.toContain(
      "sk-abcdefghijklmnopqrstuvwxyz123456",
    );
    expect(result.findings).toHaveLength(1);
  });

  it("redacts repeated matching secrets everywhere they appear", () => {
    const secret = "ghp_abcdefghijklmnopqrstuvwxyz123456";
    const content = `
tokenOne="${secret}"
tokenTwo="${secret}"
`;

    const result = redactSecrets(content);

    expect(result.redactedContent).not.toContain(secret);
    expect(
      result.redactedContent.match(/\[REDACTED: GitHub token\]/g),
    ).toHaveLength(2);
  });

  it("returns unchanged content and no findings when no secrets exist", () => {
    const content = "function add(a: number, b: number) { return a + b; }";

    const result = redactSecrets(content);

    expect(result.redactedContent).toBe(content);
    expect(result.findings).toEqual([]);
  });
});