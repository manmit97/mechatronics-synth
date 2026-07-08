// ─── Chat API Route ─────────────────────────────────────────────────────────
// Server-side endpoint for AI-powered chat with streaming, tool calls,
// and web search. Falls back to mock responses when no API key is set.

import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { computeTokenUsage, emptyTokenUsage } from '@/ai/engine/token-tracker';
import { appGraph } from '@/ai/engine/graph-workflow';

export const maxDuration = 60; // Allow up to 60s for complex generations

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      messages,
      context = {},
    } = body;

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
            versionHistory: context.versionHistory || [],
            currentDesignVersion: context.currentDesignVersion || 0,
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

