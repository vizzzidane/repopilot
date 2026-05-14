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

const ESTIMATED_COST_PER_1M_TOKENS: Record<
  string,
  {
    inputUsd: number;
    outputUsd: number;
  }
> = {
  "gpt-5.5": {
    inputUsd: 0,
    outputUsd: 0,
  },
};

export function estimateTokensFromChars(charCount: number) {
  return Math.ceil(charCount / 4);
}

function estimateCostUsd(event: UsageLogEvent) {
  const pricing = ESTIMATED_COST_PER_1M_TOKENS[event.model];

  if (!pricing) {
    return null;
  }

  const inputCost =
    (event.estimatedInputTokens / 1_000_000) * pricing.inputUsd;

  const outputCost =
    (event.estimatedOutputTokens / 1_000_000) * pricing.outputUsd;

  return Number((inputCost + outputCost).toFixed(6));
}

export function logUsage(event: UsageLogEvent) {
  const totalEstimatedTokens =
    event.estimatedInputTokens + event.estimatedOutputTokens;

  console.info({
    event: "openai_usage",
    route: event.route,
    model: event.model,
    success: event.success,
    latencyMs: event.latencyMs,
    estimatedInputTokens: event.estimatedInputTokens,
    estimatedOutputTokens: event.estimatedOutputTokens,
    totalEstimatedTokens,
    estimatedCostUsd: estimateCostUsd(event),
    errorType: event.errorType,
  });
}