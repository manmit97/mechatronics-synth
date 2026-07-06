import { useState, useCallback, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useChatStore } from '@/stores/chat-store';
import { useProjectStore } from '@/stores/project-store';
import { useConfiguratorStore } from '@/stores/configurator-store';
import { useBOMStore } from '@/stores/bom-store';
import { useDesignHistoryStore } from '@/stores/design-history-store';
import { useTokenStore } from '@/stores/token-store';
import { getMockGreeting, getMockResponse } from '@/ai/mock/mock-agent-responses';
import { processRefinementRequest, formatCrossDomainImpacts } from '@/ai/mock/mock-refinement-engine';
import { parseGenerateDesignResult, parseRefineDesignResult, type GenerateDesignResult, type RefineDesignResult } from '@/ai/engine/response-parser';
import { playClickSound, playKeyPressSound } from '@/utils/audio';
import { useConceptLibraryStore } from '@/stores/concept-library-store';
import { useComponentLibraryStore } from '@/stores/component-library-store';
import { useChatHistoryStore } from '@/stores/chat-history-store';

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
  const [isMockMode, setIsMockMode] = useState(false);
  const [mockMessages, setMockMessages] = useState<LocalMessage[]>(() => [
    { id: '0', role: 'assistant', content: getMockGreeting(), timestamp: new Date() },
  ]);
  const [mockInput, setMockInput] = useState('');
  const [isMockTyping, setIsMockTyping] = useState(false);
  const [mockTurnCount, setMockTurnCount] = useState(0);
  const [aiInput, setAIInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { currentContext, pendingPrompt, setPendingPrompt } = useChatStore();
  const { setIdea, setRequirements, setAgentPhase, agentPhase } = useProjectStore();
  const { catalog, addMultipleToCatalog, initializeConfig, addPart, clearCatalog } = useConfiguratorStore();
  const { recalculate } = useBOMStore();
  const { createSnapshot } = useDesignHistoryStore();
  const { incrementSearches, setAIEnabled } = useTokenStore();

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
      if (error.message?.includes('OPENAI_API_KEY') || error.message?.includes('Failed to fetch')) {
        setIsMockMode(true);
        setAIEnabled(false);
      }
    },
  } as Parameters<typeof useChat>[0]);

  const isAITyping = aiStatus === 'submitted' || aiStatus === 'streaming';

  // ─── Chat History Store Integration ─────────────────────────────────────
  const { currentSessionId, sessions, createNewSession, updateCurrentSession } = useChatHistoryStore();

  // Create initial session if none exists
  useEffect(() => {
    if (!currentSessionId && sessions.length === 0) {
      createNewSession(isMockMode);
    }
  }, [currentSessionId, sessions.length, createNewSession, isMockMode]);

  // Load session when currentSessionId changes
  useEffect(() => {
    const session = sessions.find(s => s.id === currentSessionId);
    if (session) {
      if (session.isMockMode) {
        setMockMessages(session.messages.length > 0 ? session.messages : [{ id: '0', role: 'assistant', content: getMockGreeting(), timestamp: new Date() }]);
      } else {
        setMessages(session.messages);
      }
    }
  }, [currentSessionId]);

  // Save AI messages to current session
  useEffect(() => {
    if (aiMessages.length > 0 && !isMockMode) {
      updateCurrentSession(aiMessages, false);
    }
  }, [aiMessages, isMockMode, updateCurrentSession]);

  // Save Mock messages to current session
  useEffect(() => {
    if (isMockMode && (mockMessages.length > 1 || (mockMessages.length === 1 && mockMessages[0].id !== '0'))) {
      updateCurrentSession(mockMessages, true);
    }
  }, [mockMessages, isMockMode, updateCurrentSession]);

  // Detect mock mode on first load
  useEffect(() => {
    let cancelled = false;
    async function checkAI() {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [], context: {} }),
        });
        const data = await res.json();
        if (!cancelled && data.isMockMode) {
          setIsMockMode(true);
          setAIEnabled(false);
        }
      } catch {
        if (!cancelled) {
          setIsMockMode(true);
          setAIEnabled(false);
        }
      }
    }
    checkAI();
    return () => { cancelled = true; };
  }, [setAIEnabled]);

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

  // ─── Mock Mode Send Handler ───────────────────────────────────────────
  const handleMockSend = useCallback(async () => {
    if (!mockInput.trim() || isMockTyping) return;
    const userMsg = mockInput.trim();
    setMockInput('');
    setMockTurnCount((t) => t + 1);
    playClickSound(true);

    const userMessage: LocalMessage = {
      id: Date.now().toString(), role: 'user', content: userMsg, timestamp: new Date(),
    };
    setMockMessages((prev) => [...prev, userMessage]);
    setIsMockTyping(true);

    if (mockTurnCount === 0) setIdea(userMsg);

    if (agentPhase === 'complete' && catalog.length > 0) {
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
      const result = processRefinementRequest(userMsg, catalog);
      const impactText = formatCrossDomainImpacts(result.crossDomainImpacts);

      if (result.partsRemoved.length > 0) {
        const config = useConfiguratorStore.getState().config;
        if (config) {
          useConfiguratorStore.getState().setPlacedParts(config.parts.filter((p) => !result.partsRemoved.includes(p.partId)));
        }
        const filteredCatalog = useConfiguratorStore.getState().catalog.filter((p) => !result.partsRemoved.includes(p.id));
        clearCatalog();
        const ps = useProjectStore.getState();
        if (ps.requirements) initializeConfig(ps.requirements.projectName, ps.requirements.description, ps.requirements);
        addMultipleToCatalog(filteredCatalog);
        filteredCatalog.forEach((part, i) => addPart(part.id, [(i % 4 - 1.5) * 0.8, 0, (Math.floor(i / 4) - 1) * 0.8]));
      }

      if (result.partsAdded.length > 0) {
        addMultipleToCatalog(result.partsAdded);
        const cc = useConfiguratorStore.getState().config;
        if (cc) {
          const n = cc.parts.length;
          result.partsAdded.forEach((part, i) => addPart(part.id, [((n + i) % 4 - 1.5) * 0.8, 0, (Math.floor((n + i) / 4) - 1) * 0.8]));
        }
      }

      if (result.partsModified.length > 0) {
        const upd = useConfiguratorStore.getState().catalog.map((p) => {
          const mod = result.partsModified.find((m) => m.partId === p.id);
          return mod ? { ...p, ...mod.updates } : p;
        });
        clearCatalog();
        const ps = useProjectStore.getState();
        if (ps.requirements) initializeConfig(ps.requirements.projectName, ps.requirements.description, ps.requirements);
        addMultipleToCatalog(upd);
        upd.forEach((part, i) => addPart(part.id, [(i % 4 - 1.5) * 0.8, 0, (Math.floor(i / 4) - 1) * 0.8]));
      }

      const uc = useConfiguratorStore.getState().catalog;
      const be = uc.map((p) => ({
        partId: p.id, partName: p.name, category: p.category, sourceType: p.sourceType,
        quantity: p.category === 'actuator' || p.category === 'wheel' ? 4 : 1,
        unitCost: p.unitCost, totalCost: p.unitCost * (p.category === 'actuator' || p.category === 'wheel' ? 4 : 1),
        manufacturingMethod: p.manufacturingMethod, sourcingUrl: p.sourcingUrl, supplierName: p.supplierName, leadTimeDays: p.leadTimeDays,
      }));
      recalculate(be);
      const cfg = useConfiguratorStore.getState().config;
      if (cfg) createSnapshot(`Refinement: ${result.intent}`, 'refinement', { config: cfg, catalog: uc, bom: be, costBreakdown: useBOMStore.getState().costBreakdown });

      setMockMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant', content: result.explanation + impactText,
        timestamp: new Date(), isRefinement: true,
        impactCards: result.crossDomainImpacts.map((impact) => ({ domain: impact.domain, severity: impact.severity, description: impact.description, recommendation: impact.recommendation })),
      }]);
      setIsMockTyping(false);
      return;
    }

    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 800));
    const response = getMockResponse(userMsg, mockTurnCount);

    setMockMessages((prev) => [...prev, {
      id: (Date.now() + 1).toString(), role: 'assistant', content: response.content,
      timestamp: new Date(), isGenerating: response.isGenerating, isDesignReady: response.isComplete,
    }]);
    setIsMockTyping(false);

    if (response.parts && response.requirements) {
      setRequirements(response.requirements);
      addMultipleToCatalog(response.parts);
      initializeConfig(response.requirements.projectName, response.requirements.description, response.requirements);
      response.parts.forEach((part, i) => addPart(part.id, [(i % 4 - 1.5) * 0.8, 0, (Math.floor(i / 4) - 1) * 0.8]));
      const be = response.parts.map((p) => ({
        partId: p.id, partName: p.name, category: p.category, sourceType: p.sourceType,
        quantity: p.category === 'actuator' || p.category === 'wheel' ? 4 : 1,
        unitCost: p.unitCost, totalCost: p.unitCost * (p.category === 'actuator' || p.category === 'wheel' ? 4 : 1),
        manufacturingMethod: p.manufacturingMethod, sourcingUrl: p.sourcingUrl, supplierName: p.supplierName, leadTimeDays: p.leadTimeDays,
      }));
      recalculate(be);
      const cfg = useConfiguratorStore.getState().config;
      if (cfg) createSnapshot('Initial design generated by AI', 'ai_generation', { config: cfg, catalog: response.parts, bom: be, costBreakdown: useBOMStore.getState().costBreakdown });
      setAgentPhase('complete');
    }
  }, [mockInput, isMockTyping, mockTurnCount, agentPhase, catalog, setIdea, setRequirements, setAgentPhase, addMultipleToCatalog, initializeConfig, addPart, clearCatalog, recalculate, createSnapshot]);

  // ─── Unified Interface ────────────────────────────────────────────────
  const currentInput = isMockMode ? mockInput : aiInput;
  const isTyping = isMockMode ? isMockTyping : isAITyping;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isMockMode) {
      setMockInput(e.target.value);
    } else {
      setAIInput(e.target.value);
    }
    playKeyPressSound();
  };

  const handleSend = useCallback(() => {
    if (isMockMode) {
      handleMockSend();
    } else {
      const text = aiInput.trim();
      if (!text || isAITyping) return;
      playClickSound(true);
      setAIInput('');
      sendMessage({ text });
    }
  }, [isMockMode, handleMockSend, aiInput, isAITyping, sendMessage]);

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
      if (isMockMode) {
        setMockInput(prompt);
        setTimeout(() => {
          const submitEvent = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false });
          document.getElementById('chat-input')?.dispatchEvent(submitEvent);
        }, 100);
      } else {
        setAIInput('');
        sendMessage({ text: prompt });
      }
    }
  }, [pendingPrompt, isMockMode, setPendingPrompt, sendMessage]);

  const handleQuickAction = (prompt: string) => {
    playClickSound(true);
    if (isMockMode) {
      setMockInput(prompt);
    } else {
      setAIInput(prompt);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleAddToChat = useCallback((componentName: string) => {
    const prompt = `I want to use a ${componentName} in my design`;
    if (isMockMode) {
      setMockInput(prompt);
    } else {
      setAIInput(prompt);
    }
    useComponentLibraryStore.getState().closeLibrary();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isMockMode]);

  const handleImportConcept = useCallback((prompt: string) => {
    setPendingPrompt(prompt);
    useConceptLibraryStore.getState().closeLibrary();
  }, [setPendingPrompt]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const displayMessages: LocalMessage[] = isMockMode
    ? mockMessages
    : (aiMessages.length > 0
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
      : [{ id: '0', role: 'assistant' as const, content: getMockGreeting(), timestamp: new Date() }]
    );

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, scrollToBottom]);

  return {
    isMockMode,
    setIsMockMode,
    setAIEnabled,
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
