// ─── Chat API Route ─────────────────────────────────────────────────────────
// Server-side endpoint for AI-powered chat with streaming, tool calls,
// and web search. Falls back to mock responses when no API key is set.

import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { isAIEnabled } from '@/ai/engine/llm-client';
import { computeTokenUsage, emptyTokenUsage } from '@/ai/engine/token-tracker';
import { getMockGreeting, getMockResponse } from '@/ai/mock/mock-agent-responses';
import { appGraph } from '@/ai/engine/graph-workflow';

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

    // ─── Stream Response via LangGraph Orchestration ──────────────────────
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        try {
          const initialState = {
            messages: messages,
            catalog: context.catalog || [],
            requirements: context.requirements || null,
            currentPage: context.currentPage || 'landing',
            selectedPartId: context.selectedPartId || null,
            pillar: context.pillar || null,
            feedback: null,
          };

          // Invoke the LangGraph workflow, passing the writer for real-time streaming
          await appGraph.invoke(initialState, {
            configurable: { writer }
          });
          
        } catch (err) {
          console.error('[LangGraph Execution Error]', err);
          // writer doesn't have an error annotation in the same way, but it throws or we ignore
        }
      }
    });
    return createUIMessageStreamResponse({ stream });
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
