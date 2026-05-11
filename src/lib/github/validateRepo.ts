export type ValidatedGitHubRepo = {
  owner: string;
  repo: string;
  normalizedUrl: string;
};

const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const REPO_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

export function validateGitHubRepoUrl(input: string): ValidatedGitHubRepo {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    throw new Error("Repository URL is required.");
  }

  if (trimmed.length > 200) {
    throw new Error("Repository URL is too long.");
  }

  const withProtocol = trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;

  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error("Please enter a valid GitHub repository URL.");
  }

  if (url.protocol !== "https:") {
    throw new Error("Only HTTPS GitHub repository URLs are allowed.");
  }

  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
    throw new Error("Only github.com repository URLs are supported.");
  }

  if (url.search || url.hash) {
    throw new Error("GitHub URL must not contain query strings or fragments.");
  }

  const parts = url.pathname.split("/").filter(Boolean);

  if (parts.length !== 2) {
    throw new Error("Please enter the repository root URL only, for example: https://github.com/owner/repo");
  }

  const [owner, rawRepo] = parts;
  const repo = rawRepo.replace(/\.git$/, "");

  if (!OWNER_PATTERN.test(owner)) {
    throw new Error("Invalid GitHub owner name.");
  }

  if (!REPO_PATTERN.test(repo)) {
    throw new Error("Invalid GitHub repository name.");
  }

  return {
    owner,
    repo,
    normalizedUrl: `https://github.com/${owner}/${repo}`,
  };
}