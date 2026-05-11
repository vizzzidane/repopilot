export type SecretFinding = {
  type: string;
  match: string;
};

const SECRET_PATTERNS: Array<{ type: string; pattern: RegExp }> = [
  { type: "OpenAI API key", pattern: /sk-[A-Za-z0-9_-]{20,}/g },
  { type: "GitHub token", pattern: /gh[pousr]_[A-Za-z0-9_]{20,}/g },
  { type: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/g },
  { type: "Private key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { type: "JWT", pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g },
  {
    type: "Likely secret assignment",
    pattern:
      /\b(API_KEY|SECRET|TOKEN|PASSWORD|PRIVATE_KEY|ACCESS_KEY)\b\s*=\s*["']?[^"'\s]{12,}/gi,
  },
];

export function scanSecrets(content: string): SecretFinding[] {
  const findings: SecretFinding[] = [];

  for (const { type, pattern } of SECRET_PATTERNS) {
    const matches = content.matchAll(pattern);

    for (const match of matches) {
      if (!match[0]) continue;

      findings.push({
        type,
        match: match[0],
      });
    }
  }

  return findings;
}

export function redactSecrets(content: string): {
  redactedContent: string;
  findings: SecretFinding[];
} {
  let redactedContent = content;
  const findings = scanSecrets(content);

  for (const finding of findings) {
    redactedContent = redactedContent.replaceAll(
      finding.match,
      `[REDACTED: ${finding.type}]`,
    );
  }

  return {
    redactedContent,
    findings,
  };
}