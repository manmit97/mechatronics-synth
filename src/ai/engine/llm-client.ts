// ─── LLM Client Configuration ───────────────────────────────────────────────
// Configures the OpenAI provider via @ai-sdk/openai.
// Centralizes model configuration and provides fallback detection.

import { createOpenAI } from '@ai-sdk/openai';

/** Check if an OpenAI API key is configured */
export function isAIEnabled(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/** Get the configured model name (default: gpt-4o) */
export function getModelName(): string {
  return process.env.OPENAI_MODEL || 'gpt-4o';
}

/** Create and return the OpenAI provider instance */
function createProvider() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is not set. Add it to .env.local to enable AI features.'
    );
  }
  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/** Get the configured language model for chat */
export function getModel() {
  const provider = createProvider();
  return provider(getModelName());
}

/** Model pricing per 1M tokens (USD) — used for cost estimation */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
};

/** Calculate cost in USD for a given token usage */
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model?: string
): number {
  const pricing = MODEL_PRICING[model || getModelName()] || MODEL_PRICING['gpt-4o'];
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000; // 6 decimal precision
}
