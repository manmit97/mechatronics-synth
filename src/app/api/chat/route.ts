// ─── Chat API Route ─────────────────────────────────────────────────────────
// Server-side endpoint for AI-powered chat with streaming, tool calls,
// and web search. Falls back to mock responses when no API key is set.

import { streamText, stepCountIs, convertToModelMessages } from 'ai';
import { isAIEnabled, getModel } from '@/ai/engine/llm-client';
import { buildSystemPrompt } from '@/ai/engine/system-prompt';
import { allTools } from '@/ai/engine/tools';
import { computeTokenUsage, emptyTokenUsage } from '@/ai/engine/token-tracker';
import { getMockGreeting, getMockResponse } from '@/ai/mock/mock-agent-responses';

export const maxDuration = 60; // Allow up to 60s for complex generations

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      messages,
      context = {},
    } = body;

    // ─── Fallback: Mock Mode ──────────────────────────────────────────────
    if (!isAIEnabled()) {
      return handleMockFallback(messages, context);
    }

    // ─── Build System Prompt with Dynamic Context ─────────────────────────
    const systemPrompt = buildSystemPrompt({
      currentCatalog: context.catalog || [],
      currentRequirements: context.requirements || null,
      currentPage: context.currentPage || 'landing',
      selectedPartId: context.selectedPartId || null,
      pillar: context.pillar || null,
    });

    // ─── Stream Response with Tools ───────────────────────────────────────
    const result = streamText({
      model: getModel(),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: allTools,
      stopWhen: stepCountIs(5), // Allow multi-step tool usage
      temperature: 0.7,
      onFinish: async ({ usage }) => {
        // Token tracking — compute and log
        if (usage) {
          const tokenUsage = computeTokenUsage(
            usage.inputTokens || 0,
            usage.outputTokens || 0,
            context.previousTokenUsage || undefined
          );
          console.log(`[AI Chat] Tokens: ${tokenUsage.totalTokens} | Cost: $${tokenUsage.estimatedCostUsd.toFixed(6)}`);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[Chat API Error]', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process chat request',
      },
      { status: 500 }
    );
  }
}

// ─── Mock Fallback Handler ──────────────────────────────────────────────────

function handleMockFallback(
  messages: Array<{ role: string; content: string }>,
  context: Record<string, unknown>
) {
  const turnCount = messages?.filter((m: { role: string }) => m.role === 'user').length || 0;
  const lastUserMessage = messages
    ?.filter((m: { role: string }) => m.role === 'user')
    .pop()?.content || '';

  // If no messages, return greeting
  if (turnCount === 0 || !lastUserMessage) {
    return Response.json({
      role: 'assistant',
      content: getMockGreeting(),
      isMockMode: true,
      tokenUsage: emptyTokenUsage(),
    });
  }

  // Use the existing mock response system
  const response = getMockResponse(lastUserMessage, turnCount);

  return Response.json({
    role: 'assistant',
    content: response.content,
    parts: response.parts || null,
    requirements: response.requirements || null,
    isGenerating: response.isGenerating || false,
    isComplete: response.isComplete || false,
    isMockMode: true,
    tokenUsage: {
      ...emptyTokenUsage(),
      requestCount: turnCount,
    },
    _catalogSize: (context.catalog as unknown[])?.length || 0,
  });
}
