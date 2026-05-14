import { describe, expect, it } from "vitest";
import { isBlockedFilePath } from "../blockedFiles";

describe("blockedFiles security helper", () => {
  it("blocks environment and package credential files", () => {
    const blockedPaths = [
      ".env",
      ".env.local",
      ".env.production",
      "apps/web/.env",
      "apps/api/.env.local",
      ".npmrc",
      "frontend/.npmrc",
      ".pypirc",
      "backend/.pypirc",
    ];

    for (const path of blockedPaths) {
      expect(isBlockedFilePath(path)).toBe(true);
    }
  });

  it("blocks key and certificate file extensions", () => {
    const blockedPaths = [
      "server.pem",
      "certs/private.key",
      "secrets/client.p12",
      "secrets/client.pfx",
    ];

    for (const path of blockedPaths) {
      expect(isBlockedFilePath(path)).toBe(true);
    }
  });

  it("blocks common SSH private key filenames", () => {
    expect(isBlockedFilePath("id_rsa")).toBe(true);
    expect(isBlockedFilePath("keys/id_rsa")).toBe(true);
    expect(isBlockedFilePath("id_ed25519")).toBe(true);
    expect(isBlockedFilePath("keys/id_ed25519")).toBe(true);
  });

  it("blocks cloud credential JSON files", () => {
    const blockedPaths = [
      "credentials.json",
      "config/credentials.json",
      "service-account.json",
      "prod-service-account-key.json",
      "firebase-adminsdk.json",
      "google-credentials-prod.json",
    ];

    for (const path of blockedPaths) {
      expect(isBlockedFilePath(path)).toBe(true);
    }
  });

  it("handles Windows path separators safely", () => {
    expect(isBlockedFilePath("apps\\api\\.env.local")).toBe(true);
    expect(isBlockedFilePath("secrets\\private.key")).toBe(true);
    expect(isBlockedFilePath("config\\credentials.json")).toBe(true);
  });

  it("matches blocked paths case-insensitively", () => {
    expect(isBlockedFilePath(".ENV")).toBe(true);
    expect(isBlockedFilePath("CERTS/PRIVATE.KEY")).toBe(true);
    expect(isBlockedFilePath("CONFIG/CREDENTIALS.JSON")).toBe(true);
  });

  it("does not block ordinary source and documentation files", () => {
    const allowedPaths = [
      "src/app/page.tsx",
      "src/lib/security/blockedFiles.ts",
      "README.md",
      "docs/architecture.md",
      "package.json",
      "package-lock.json",
      "public/example.env.md",
      "src/env.example.ts",
    ];

    for (const path of allowedPaths) {
      expect(isBlockedFilePath(path)).toBe(false);
    }
  });
});