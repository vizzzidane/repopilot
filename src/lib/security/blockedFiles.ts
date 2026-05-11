export const BLOCKED_FILE_PATTERNS = [
  /(^|\/)\.env(\..*)?$/i,
  /(^|\/)\.npmrc$/i,
  /(^|\/)\.pypirc$/i,

  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,

  /(^|\/)id_rsa$/i,
  /(^|\/)id_ed25519$/i,

  /credentials\.json$/i,
  /service-account.*\.json$/i,
  /firebase.*\.json$/i,
  /google-credentials.*\.json$/i,
];

export function isBlockedFilePath(filePath: string): boolean {
  const normalized = filePath.replaceAll("\\", "/");

  return BLOCKED_FILE_PATTERNS.some((pattern) => pattern.test(normalized));
}