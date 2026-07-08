import { streamText, generateText, tool, UIMessage, stepCountIs, convertToModelMessages } from 'ai';
import { getModel } from './llm-client';
import { buildSystemPrompt } from './system-prompt';
import { allTools } from './tools';
import { GraphStateData } from './graph-state';
import { RunnableConfig } from '@langchain/core/runnables';
import { z } from 'zod';

// Helper to convert messages
async function toCoreMessages(messages: any[]): Promise<any[]> {
  const mapped = messages.map((m) => {
    if (m.role) return m;
    const role = m.getType() === 'human' ? 'user' : m.getType() === 'ai' ? 'assistant' : m.getType() === 'system' ? 'system' : 'user';
    return { role, content: m.content as string };
  });
  return convertToModelMessages(mapped);
}

export async function supervisorNode(state: GraphStateData, config?: RunnableConfig) {
  const writer = config?.configurable?.writer;
  const coreMessages = await toCoreMessages(state.messages);
  
  const systemPrompt = buildSystemPrompt({
    currentCatalog: state.catalog,
    currentRequirements: state.requirements,
    currentPage: state.currentPage,
    selectedPartId: state.selectedPartId,
    pillar: state.pillar,
    versionHistory: state.versionHistory || [],
    currentDesignVersion: state.currentDesignVersion || 0,
  });

  const augmentedPrompt = systemPrompt + '\\n\\n[SUPERVISOR] You are the main orchestrator. You have access to all tools. Analyze the user request. ' + (state.feedback ? `\\n\\n[FEEDBACK FROM EVALUATOR]: ${state.feedback}` : '');

  const result = streamText({
    model: getModel(),
    system: augmentedPrompt,
    messages: coreMessages,
    tools: allTools,
    stopWhen: stepCountIs(5),
  });

  if (writer) {
    writer.merge(result.toUIMessageStream());
  }

  const finalResponse = await result.response;
  const finalMessages = finalResponse.messages;
  
  return { 
    messages: finalMessages,
    feedback: null
  };
}

export async function evaluatorNode(state: GraphStateData) {
  const reqs = state.requirements;
  if (!reqs || !reqs.constraints || !reqs.constraints.budgetUsd) {
    return { feedback: null };
  }
  
  const totalCost = state.catalog.reduce((sum, p) => sum + p.unitCost, 0);
  
  if (totalCost > reqs.constraints.budgetUsd) {
    return { 
      feedback: `The current design cost ($${totalCost.toFixed(2)}) exceeds the user budget ($${reqs.constraints.budgetUsd}). Please revise the design by substituting cheaper components.` 
    };
  }
  
  return { feedback: null };
}
