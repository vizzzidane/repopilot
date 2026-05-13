const ALLOWED_HOSTS = new Set(["github.com"]);

export function validateGithubRepoUrl(input: string): {
  owner: string;
  repo: string;
  normalizedUrl: string;
} {
  let url: URL;

  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Invalid URL.");
  }

  if (url.protocol !== "https:") {
    throw new Error("Only HTTPS GitHub URLs are allowed.");
  }

  if (!ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error("Only github.com repository URLs are allowed.");
  }

  if (url.username || url.password) {
    throw new Error("URLs with credentials are not allowed.");
  }

  const parts = url.pathname.split("/").filter(Boolean);

  if (parts.length < 2) {
    throw new Error("Please provide a GitHub repository URL.");
  }

  const [owner, repoRaw] = parts;

  if (!/^[A-Za-z0-9_.-]+$/.test(owner)) {
    throw new Error("Invalid GitHub owner.");
  }

  if (!/^[A-Za-z0-9_.-]+$/.test(repoRaw)) {
    throw new Error("Invalid GitHub repo name.");
  }

  const repo = repoRaw.replace(/\.git$/, "");

  return {
    owner,
    repo,
    normalizedUrl: `https://github.com/${owner}/${repo}`,
  };
}