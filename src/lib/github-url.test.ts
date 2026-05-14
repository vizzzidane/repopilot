import { describe, expect, it } from "vitest";
import { validateGithubRepoUrl } from "./github-url";

describe("validateGithubRepoUrl", () => {
  it("accepts valid GitHub repository URLs", () => {
    expect(validateGithubRepoUrl("https://github.com/vercel/next.js")).toEqual({
      owner: "vercel",
      repo: "next.js",
      normalizedUrl: "https://github.com/vercel/next.js",
    });
  });

  it("normalizes .git suffixes", () => {
    expect(
      validateGithubRepoUrl("https://github.com/vercel/next.js.git")
    ).toEqual({
      owner: "vercel",
      repo: "next.js",
      normalizedUrl: "https://github.com/vercel/next.js",
    });
  });

  it("rejects non-HTTPS URLs", () => {
    expect(() =>
      validateGithubRepoUrl("http://github.com/vercel/next.js")
    ).toThrow("Only HTTPS GitHub URLs are allowed.");
  });

  it("rejects non-GitHub hosts", () => {
    expect(() =>
      validateGithubRepoUrl("https://evil.com/github.com/vercel/next.js")
    ).toThrow("Only github.com repository URLs are allowed.");
  });

  it("rejects localhost URLs", () => {
    expect(() =>
      validateGithubRepoUrl("https://localhost/vercel/next.js")
    ).toThrow("Only github.com repository URLs are allowed.");
  });

  it("rejects URLs with credentials", () => {
    expect(() =>
      validateGithubRepoUrl("https://user:pass@github.com/vercel/next.js")
    ).toThrow("URLs with credentials are not allowed.");
  });

  it("rejects malformed URLs", () => {
    expect(() => validateGithubRepoUrl("not-a-url")).toThrow("Invalid URL.");
  });
});