const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(the\s+)?above\s+instructions/i,
  /disregard\s+(all\s+)?previous\s+instructions/i,
  /reveal\s+(the\s+)?system\s+prompt/i,
  /show\s+(the\s+)?system\s+prompt/i,
  /print\s+(the\s+)?system\s+prompt/i,
  /developer\s+message/i,
  /system\s+message/i,
  /hidden\s+instructions/i,
  /you\s+are\s+now/i,
  /act\s+as\s+if/i,
  /do\s+not\s+follow/i,
  /exfiltrate/i,
  /send\s+secrets/i,
  /api\s+key/i,
  /environment\s+variables/i,
];

export function redactPromptInjectionText(content: string) {
  let redacted = content;

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    redacted = redacted.replace(pattern, "[REDACTED_PROMPT_INJECTION]");
  }

  return redacted;
}

export function hasPromptInjectionSignal(content: string) {
  return PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(content));
}