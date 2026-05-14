import OpenAI from "openai";
import { estimateTokensFromChars, logUsage } from "@/lib/usageLog";

const EMBEDDING_MODEL = "text-embedding-3-small";
const MAX_EMBEDDING_INPUTS = 64;
const MAX_EMBEDDING_INPUT_CHARS = 6000;
const MAX_TOTAL_EMBEDDING_CHARS = 120000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function embedTexts(texts: string[]) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  const boundedTexts = texts
    .slice(0, MAX_EMBEDDING_INPUTS)
    .map((text) => text.replace(/\u0000/g, "").slice(0, MAX_EMBEDDING_INPUT_CHARS));

  const totalChars = boundedTexts.reduce((sum, text) => sum + text.length, 0);

  if (totalChars > MAX_TOTAL_EMBEDDING_CHARS) {
    throw new Error("Embedding input is too large.");
  }

  const start = Date.now();

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: boundedTexts,
    });

    logUsage({
      route: "embeddingProvider",
      model: EMBEDDING_MODEL,
      latencyMs: Date.now() - start,
      inputChars: totalChars,
      outputChars: 0,
      estimatedInputTokens: estimateTokensFromChars(totalChars),
      estimatedOutputTokens: 0,
      success: true,
    });

    return response.data.map((item) => item.embedding);
  } catch (error) {
    logUsage({
      route: "embeddingProvider",
      model: EMBEDDING_MODEL,
      latencyMs: Date.now() - start,
      inputChars: totalChars,
      outputChars: 0,
      estimatedInputTokens: estimateTokensFromChars(totalChars),
      estimatedOutputTokens: 0,
      success: false,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });

    throw error;
  }
}