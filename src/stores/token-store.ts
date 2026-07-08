'use client';

import { create } from 'zustand';

interface TokenState {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  requestCount: number;
  searchCount: number;
  modelName: string;

  addUsage: (prompt: number, completion: number) => void;
  incrementSearches: () => void;
  setModelName: (name: string) => void;
  reset: () => void;
}

// GPT-4o pricing per 1M tokens
const PRICING = { input: 2.50, output: 10.00 };

export const useTokenStore = create<TokenState>((set) => ({
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  estimatedCostUsd: 0,
  requestCount: 0,
  searchCount: 0,
  modelName: 'gpt-4o',

  addUsage: (prompt, completion) =>
    set((state) => {
      const newPrompt = state.promptTokens + prompt;
      const newCompletion = state.completionTokens + completion;
      const newTotal = newPrompt + newCompletion;
      const inputCost = (newPrompt / 1_000_000) * PRICING.input;
      const outputCost = (newCompletion / 1_000_000) * PRICING.output;
      return {
        promptTokens: newPrompt,
        completionTokens: newCompletion,
        totalTokens: newTotal,
        estimatedCostUsd: Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000,
        requestCount: state.requestCount + 1,
      };
    }),

  incrementSearches: () =>
    set((state) => ({ searchCount: state.searchCount + 1 })),

  setModelName: (name) => set({ modelName: name }),

  reset: () =>
    set({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
      requestCount: 0,
      searchCount: 0,
    }),
}));
