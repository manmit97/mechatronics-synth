import { useState, useCallback, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useChatStore } from '@/stores/chat-store';
import { useProjectStore } from '@/stores/project-store';
import { useConfiguratorStore } from '@/stores/configurator-store';
import { useBOMStore } from '@/stores/bom-store';
import { useDesignHistoryStore } from '@/stores/design-history-store';
import { useTokenStore } from '@/stores/token-store';
import { parseGenerateDesignResult, parseRefineDesignResult, type GenerateDesignResult, type RefineDesignResult } from '@/ai/engine/response-parser';
import { playClickSound, playKeyPressSound } from '@/utils/audio';
import { useConceptLibraryStore } from '@/stores/concept-library-store';
import { useComponentLibraryStore } from '@/stores/component-library-store';
import { useChatHistoryStore } from '@/stores/chat-history-store';
import { getMockGreeting } from '@/ai/mock/mock-agent-responses';

export interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isGenerating?: boolean;
  isDesignReady?: boolean;
  isRefinement?: boolean;
  impactCards?: ImpactCard[];
}

export interface ImpactCard {
  domain: string;
  severity: string;
  description: string;
  recommendation: string;
}

// ─── Helper: Extract text from UIMessage parts ──────────────────────────────
function getMessageText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

// ─── Helper: Check for tool results in message parts ────────────────────────
function hasToolResult(msg: UIMessage, toolName: string): boolean {
  return msg.parts.some(
    (p) => p.type === `tool-${toolName}` && 'output' in p && p.output
  );
}

function getToolOutput(msg: UIMessage, toolName: string): unknown | null {
  for (const p of msg.parts) {
    if (p.type === `tool-${toolName}` && 'output' in p) {
      return p.output;
    }
  }
  return null;
}

export function useChatEngine() {
  const [aiInput, setAIInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { currentContext, pendingPrompt, setPendingPrompt } = useChatStore();
  const { setIdea, setRequirements, setAgentPhase, agentPhase } = useProjectStore();
  const { catalog, addMultipleToCatalog, initializeConfig, addPart, clearCatalog } = useConfiguratorStore();
  const { recalculate } = useBOMStore();
  const { createSnapshot } = useDesignHistoryStore();
  const { incrementSearches } = useTokenStore();

  // ─── AI Streaming Chat ───────────────────────────
  const {
    messages: aiMessages,
    sendMessage,
    status: aiStatus,
    error: aiError,
    setMessages,
  } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        context: {
          catalog,
          requirements: useProjectStore.getState().requirements,
          currentPage: currentContext,
          selectedPartId: null,
          pillar: useProjectStore.getState().pillar,
        },
      },
    }),
    onFinish: ({ message }) => {
      if (message && message.parts) {
        for (const part of message.parts) {
          if (part.type.startsWith('tool-search_components')) {
            incrementSearches();
          }
        }
        const genOutput = getToolOutput(message, 'generate_design');
        if (genOutput && typeof genOutput === 'object' && (genOutput as Record<string, unknown>).success) {
          handleDesignGenerated(genOutput as Record<string, unknown>);
        }
        const refOutput = getToolOutput(message, 'refine_design');
        if (refOutput && typeof refOutput === 'object' && (refOutput as Record<string, unknown>).success) {
          handleDesignRefined(refOutput as Record<string, unknown>);
        }
      }
    },
    onError: (error) => {
      console.error('[Chat Error]', error);
    },
  } as Parameters<typeof useChat>[0]);

  const isAITyping = aiStatus === 'submitted' || aiStatus === 'streaming';

  // ─── Chat History Store Integration ─────────────────────────────────────
  const { currentSessionId, sessions, createNewSession, updateCurrentSession } = useChatHistoryStore();

  // Create initial session if none exists
  useEffect(() => {
    if (!currentSessionId && sessions.length === 0) {
      createNewSession(false);
    }
  }, [currentSessionId, sessions.length, createNewSession]);

  // Load session when currentSessionId changes
  useEffect(() => {
    const session = sessions.find(s => s.id === currentSessionId);
    if (session) {
      setMessages(session.messages);
    }
  }, [currentSessionId]);

  // Save AI messages to current session
  useEffect(() => {
    if (aiMessages.length > 0) {
      updateCurrentSession(aiMessages, false);
    }
  }, [aiMessages, updateCurrentSession]);


  // ─── Design Generation Handler ────────────────────────────────────────
  const handleDesignGenerated = useCallback((result: Record<string, unknown>) => {
    try {
      const { parts, requirements } = parseGenerateDesignResult(result as unknown as GenerateDesignResult);

      setRequirements(requirements);
      addMultipleToCatalog(parts);
      initializeConfig(requirements.projectName, requirements.description, requirements);

      const spacing = 0.8;
      parts.forEach((part, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        addPart(part.id, [(col - 1.5) * spacing, 0, (row - 1) * spacing]);
      });

      const bomEntries = parts.map((p) => ({
        partId: p.id, partName: p.name, category: p.category, sourceType: p.sourceType,
        quantity: p.category === 'actuator' || p.category === 'wheel' ? 4 : 1,
        unitCost: p.unitCost,
        totalCost: p.unitCost * (p.category === 'actuator' || p.category === 'wheel' ? 4 : 1),
        manufacturingMethod: p.manufacturingMethod, sourcingUrl: p.sourcingUrl,
        supplierName: p.supplierName, leadTimeDays: p.leadTimeDays,
      }));
      recalculate(bomEntries);

      const config = useConfiguratorStore.getState().config;
      const costBreakdown = useBOMStore.getState().costBreakdown;
      if (config) {
        createSnapshot('AI-generated design', 'ai_generation', {
          config, catalog: parts, bom: bomEntries, costBreakdown,
        });
      }
      setAgentPhase('complete');
    } catch (err) {
      console.error('[Design Generation Error]', err);
    }
  }, [setRequirements, addMultipleToCatalog, initializeConfig, addPart, recalculate, createSnapshot, setAgentPhase]);

  // ─── Design Refinement Handler ────────────────────────────────────────
  const handleDesignRefined = useCallback((result: Record<string, unknown>) => {
    try {
      const currentCatalog = useConfiguratorStore.getState().catalog;
      const parsed = parseRefineDesignResult(result as unknown as RefineDesignResult, currentCatalog);

      if (parsed.partsRemoved.length > 0) {
        const config = useConfiguratorStore.getState().config;
        if (config) {
          const newParts = config.parts.filter((p) => !parsed.partsRemoved.includes(p.partId));
          useConfiguratorStore.getState().setPlacedParts(newParts);
        }
        const filteredCatalog = currentCatalog.filter((p) => !parsed.partsRemoved.includes(p.id));
        clearCatalog();
        const projectStore = useProjectStore.getState();
        if (projectStore.requirements) {
          initializeConfig(projectStore.requirements.projectName, projectStore.requirements.description, projectStore.requirements);
        }
        addMultipleToCatalog(filteredCatalog);
        const spacing = 0.8;
        filteredCatalog.forEach((part, i) => {
          addPart(part.id, [(i % 4 - 1.5) * spacing, 0, (Math.floor(i / 4) - 1) * spacing]);
        });
      }

      if (parsed.partsAdded.length > 0) {
        addMultipleToCatalog(parsed.partsAdded);
        const currentConfig = useConfiguratorStore.getState().config;
        if (currentConfig) {
          const spacing = 0.8;
          const existingCount = currentConfig.parts.length;
          parsed.partsAdded.forEach((part, i) => {
            const idx = existingCount + i;
            addPart(part.id, [(idx % 4 - 1.5) * spacing, 0, (Math.floor(idx / 4) - 1) * spacing]);
          });
        }
      }

      if (parsed.partsModified.length > 0) {
        const updatedCatalog = useConfiguratorStore.getState().catalog.map((p) => {
          const mod = parsed.partsModified.find((m) => m.partId === p.id);
          return mod ? { ...p, ...mod.updates } : p;
        });
        clearCatalog();
        const projectStore = useProjectStore.getState();
        if (projectStore.requirements) {
          initializeConfig(projectStore.requirements.projectName, projectStore.requirements.description, projectStore.requirements);
        }
        addMultipleToCatalog(updatedCatalog);
        const spacing = 0.8;
        updatedCatalog.forEach((part, i) => {
          addPart(part.id, [(i % 4 - 1.5) * spacing, 0, (Math.floor(i / 4) - 1) * spacing]);
        });
      }

      const updatedCatalog = useConfiguratorStore.getState().catalog;
      const bomEntries = updatedCatalog.map((p) => ({
        partId: p.id, partName: p.name, category: p.category, sourceType: p.sourceType,
        quantity: p.category === 'actuator' || p.category === 'wheel' ? 4 : 1,
        unitCost: p.unitCost,
        totalCost: p.unitCost * (p.category === 'actuator' || p.category === 'wheel' ? 4 : 1),
        manufacturingMethod: p.manufacturingMethod, sourcingUrl: p.sourcingUrl,
        supplierName: p.supplierName, leadTimeDays: p.leadTimeDays,
      }));
      recalculate(bomEntries);

      const config = useConfiguratorStore.getState().config;
      const costBreakdown = useBOMStore.getState().costBreakdown;
      if (config) {
        createSnapshot(`Refinement: ${parsed.intent}`, 'refinement', {
          config, catalog: updatedCatalog, bom: bomEntries, costBreakdown,
        });
      }
    } catch (err) {
      console.error('[Design Refinement Error]', err);
    }
  }, [clearCatalog, initializeConfig, addMultipleToCatalog, addPart, recalculate, createSnapshot]);

  // ─── Unified Interface ────────────────────────────────────────────────
  const currentInput = aiInput;
  const isTyping = isAITyping;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAIInput(e.target.value);
    playKeyPressSound();
  };

  const handleSend = useCallback(() => {
    const text = aiInput.trim();
    if (!text || isAITyping) return;
    playClickSound(true);
    setAIInput('');
    sendMessage({ text });
  }, [aiInput, isAITyping, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (pendingPrompt) {
      const prompt = pendingPrompt;
      setPendingPrompt(null);
      setAIInput('');
      sendMessage({ text: prompt });
    }
  }, [pendingPrompt, setPendingPrompt, sendMessage]);

  const handleQuickAction = (prompt: string) => {
    playClickSound(true);
    setAIInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleAddToChat = useCallback((componentName: string) => {
    const prompt = `I want to use a ${componentName} in my design`;
    setAIInput(prompt);
    useComponentLibraryStore.getState().closeLibrary();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleImportConcept = useCallback((prompt: string) => {
    setPendingPrompt(prompt);
    useConceptLibraryStore.getState().closeLibrary();
  }, [setPendingPrompt]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const displayMessages: LocalMessage[] = aiMessages.length > 0
    ? aiMessages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: getMessageText(m),
        timestamp: new Date(),
        isDesignReady: hasToolResult(m, 'generate_design'),
        isRefinement: hasToolResult(m, 'refine_design'),
        impactCards: (() => {
          const output = getToolOutput(m, 'refine_design');
          if (output && typeof output === 'object' && (output as Record<string, unknown>).crossDomainImpacts) {
            return (output as { crossDomainImpacts: ImpactCard[] }).crossDomainImpacts;
          }
          return undefined;
        })(),
      }))
    : [{ id: '0', role: 'assistant' as const, content: getMockGreeting(), timestamp: new Date() }];

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, scrollToBottom]);

  return {
    displayMessages,
    currentInput,
    isTyping,
    aiStatus,
    aiError,
    handleInputChange,
    handleSend,
    handleKeyDown,
    handleQuickAction,
    handleAddToChat,
    handleImportConcept,
    messagesEndRef,
    inputRef,
  };
}
