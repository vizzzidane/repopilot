export type UsageLogEvent = {
  route: string;
  model: string;
  latencyMs: number;
  inputChars: number;
  outputChars: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  success: boolean;
  errorType?: string;
};

export function estimateTokensFromChars(charCount: number) {
  return Math.ceil(charCount / 4);
}

export function logUsage(event: UsageLogEvent) {
  console.info({
    event: "openai_usage",
    ...event,
  });
}