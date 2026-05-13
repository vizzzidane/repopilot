export const REPO_LIMITS = {
  maxFiles: 150,
  maxFileSizeBytes: 80_000,
  maxTotalChars: 250_000,
};

const SKIP_DIRS = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  "vendor",
  ".turbo",
  ".vercel",
];

const SKIP_FILES = [
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
];

const SKIP_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
  ".mp4",
  ".mov",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".map",
  ".min.js",
];

export function shouldSkipRepoFile(path: string): boolean {
  const normalized = path.replaceAll("\\", "/");
  const parts = normalized.split("/");

  if (parts.some((part) => SKIP_DIRS.includes(part))) {
    return true;
  }

  const filename = parts.at(-1) ?? "";

  if (SKIP_FILES.includes(filename)) {
    return true;
  }

  return SKIP_EXTENSIONS.some((ext) => filename.endsWith(ext));
}