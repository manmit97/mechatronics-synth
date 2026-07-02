// ─── Token Tracker ──────────────────────────────────────────────────────────
// Server-side token counting and cost calculation.
// Accumulates usage across a session and returns serializable summaries.

import { calculateCost, getModelName } from './llm-client';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  requestCount: number;
  searchCount: number;
  modelName: string;
}

/** Calculate token usage from a single response and return a cumulative snapshot */
export function computeTokenUsage(
  promptTokens: number,
  completionTokens: number,
  previousUsage?: TokenUsage,
  isSearchCall: boolean = false
): TokenUsage {
  const prev = previousUsage || {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
    requestCount: 0,
    searchCount: 0,
    modelName: getModelName(),
  };

  const newPrompt = prev.promptTokens + promptTokens;
  const newCompletion = prev.completionTokens + completionTokens;
  const newTotal = newPrompt + newCompletion;
  const newCost = calculateCost(newPrompt, newCompletion);

  return {
    promptTokens: newPrompt,
    completionTokens: newCompletion,
    totalTokens: newTotal,
    estimatedCostUsd: newCost,
    requestCount: prev.requestCount + 1,
    searchCount: prev.searchCount + (isSearchCall ? 1 : 0),
    modelName: getModelName(),
  };
}

/** Create an empty token usage object */
export function emptyTokenUsage(): TokenUsage {
  return {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
    requestCount: 0,
    searchCount: 0,
    modelName: getModelName(),
  };
}

/** Format cost as a human-readable string */
export function formatCost(costUsd: number): string {
  if (costUsd < 0.01) return `$${(costUsd * 100).toFixed(2)}¢`;
  return `$${costUsd.toFixed(4)}`;
}

/** Format token count in compact form */
export function formatTokenCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}
