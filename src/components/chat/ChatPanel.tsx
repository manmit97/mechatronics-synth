'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, MessageSquare, Send, Sparkles, ArrowRight, AlertTriangle, Zap, Cog, Cpu, Wifi, WifiOff } from 'lucide-react';
import { useChat, type UseChatHelpers } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useChatStore } from '@/stores/chat-store';
import { useProjectStore } from '@/stores/project-store';
import { PILLAR_CONFIGS } from '@/types/pillar';
import { useConfiguratorStore } from '@/stores/configurator-store';
import { useBOMStore } from '@/stores/bom-store';
import { useDesignHistoryStore } from '@/stores/design-history-store';
import { useTokenStore } from '@/stores/token-store';
import { useComponentLibraryStore } from '@/stores/component-library-store';
import { getMockGreeting, getMockResponse } from '@/ai/mock/mock-agent-responses';
import { processRefinementRequest, formatCrossDomainImpacts } from '@/ai/mock/mock-refinement-engine';
import { parseGenerateDesignResult, parseRefineDesignResult, type GenerateDesignResult, type RefineDesignResult } from '@/ai/engine/response-parser';
import { TokenGauge } from './TokenGauge';
import { ComponentLibraryToggle } from './ComponentLibraryToggle';
import { ComponentLibrary } from './ComponentLibrary';
import Link from 'next/link';
import { playClickSound, playKeyPressSound } from '@/utils/audio';

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isGenerating?: boolean;
  isDesignReady?: boolean;
  isRefinement?: boolean;
  impactCards?: ImpactCard[];
}

interface ImpactCard {
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

export function ChatPanel({ isLandingPage = false }: { isLandingPage?: boolean }) {
  const [isMockMode, setIsMockMode] = useState(false);
  const [mockMessages, setMockMessages] = useState<LocalMessage[]>(() => [
    { id: '0', role: 'assistant', content: getMockGreeting(), timestamp: new Date() },
  ]);
  const [mockInput, setMockInput] = useState('');
  const [isMockTyping, setIsMockTyping] = useState(false);
  const [mockTurnCount, setMockTurnCount] = useState(0);
  // Managed input for AI mode (v6 useChat doesn't manage input)
  const [aiInput, setAIInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { quickActions, currentContext } = useChatStore();
  const { setIdea, setRequirements, setAgentPhase, agentPhase } = useProjectStore();
  const { catalog, addMultipleToCatalog, initializeConfig, addPart, clearCatalog } = useConfiguratorStore();
  const { recalculate } = useBOMStore();
  const { createSnapshot } = useDesignHistoryStore();
  const { incrementSearches, setAIEnabled } = useTokenStore();

  // Decorative rotating knobs
  const [knobRotations, setKnobRotations] = useState([45, -30, 90]);
  const handleKnobClick = useCallback((index: number) => {
    setKnobRotations(prev => {
      const next = [...prev];
      next[index] = (next[index] + 45) % 360;
      return next;
    });
    playClickSound(false);
  }, []);

  // ─── Map Rotations to Reading Styles ─────────────────────────────────────────

  const getFontSizeClass = () => {
    const rot = knobRotations[0];
    if (rot < 90) return 'text-[10px] [&_h2]:text-[11px] [&_h3]:text-[10px]';
    if (rot < 180) return 'text-[12px] [&_h2]:text-[13px] [&_h3]:text-[12px]';
    if (rot < 270) return 'text-[14px] [&_h2]:text-[15px] [&_h3]:text-[14px]';
    return 'text-[16px] [&_h2]:text-[17px] [&_h3]:text-[16px]';
  };

  const getLineHeightClass = () => {
    const rot = knobRotations[1];
    if (rot < 120) return '[&_p]:leading-tight';
    if (rot < 240) return '[&_p]:leading-relaxed';
    return '[&_p]:leading-loose';
  };

  const getBrightnessClass = () => {
    const rot = knobRotations[2];
    if (rot < 120) return 'opacity-70 drop-shadow-none';
    if (rot < 240) return 'opacity-90 drop-shadow-[0_0_1px_rgba(74,222,128,0.2)]';
    return 'opacity-100 drop-shadow-[0_0_4px_rgba(74,222,128,0.8)]';
  };

  // ─── AI Streaming Chat (Vercel AI SDK v6) ───────────────────────────

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
      // Process tool results from the finished message
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

  // ─── Session Persistence ────────────────────────────────────────────────
  useEffect(() => {
    try {
      const savedAi = localStorage.getItem('ai-chat-messages');
      if (savedAi) {
        setMessages(JSON.parse(savedAi));
      }
      const savedMock = localStorage.getItem('mock-chat-messages');
      if (savedMock) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMockMessages(JSON.parse(savedMock));
      }
    } catch (e) {
      console.error('Failed to restore chat session', e);
    }
  }, [setMessages]);

  useEffect(() => {
    if (aiMessages.length > 0) {
      localStorage.setItem('ai-chat-messages', JSON.stringify(aiMessages));
    }
  }, [aiMessages]);

  useEffect(() => {
    if (mockMessages.length > 1 || (mockMessages.length === 1 && mockMessages[0].id !== '0')) {
      localStorage.setItem('mock-chat-messages', JSON.stringify(mockMessages));
    }
  }, [mockMessages]);

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

      // Apply removals
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

      // Apply additions
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

      // Apply modifications
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

      // Recalculate BOM
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

    // REFINEMENT MODE (mock)
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

    // INITIAL DESIGN MODE (mock)
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

  const handleQuickAction = (prompt: string) => {
    playClickSound(true);
    if (isMockMode) {
      setMockInput(prompt);
    } else {
      setAIInput(prompt);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Component library "Add to Chat" handler
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

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Build display messages from either mock or AI
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

  // Status text
  const getStatusText = (): string => {
    if (aiStatus === 'submitted') return 'ACQUIRING SIGNAL PARAMETERS...';
    if (aiStatus === 'streaming') return 'RECEIVING AI TELEMETRY...';
    return 'ACQUIRING SIGNAL PARAMETERS...';
  };

  const contextLabels: Record<string, string> = {
    landing: '💬 LOG', configurator: '🔧 CONFIG', simulate: '⚡ SIM',
    bom: '📋 BOM', assembly: '🔩 ASSY', checkout: '🛒 OUT',
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative">
      {/* Recessed cabinet chassis screws */}
      <div className="absolute top-2 left-2"><span className="screw" /></div>
      <div className="absolute top-2 right-2"><span className="screw" /></div>

      {/* Screen Header */}
      {!isLandingPage && (
        <div className="flex items-center justify-between px-6 py-2 border-b border-[#374151] bg-[#1a1b1e]">
          <div className="flex items-center gap-2">
            <span className={`osc-led active animate-pulse-dot`} style={{ '--led-color': isMockMode ? '#ef4444' : '#4ade80' } as React.CSSProperties} />
            <span className={`text-[10px] font-mono font-bold tracking-wider ${isMockMode ? 'text-[#ef4444]' : 'text-[#4ade80]'}`}>
              TERMINAL {isMockMode ? '// OFFLINE' : '// LIVE AI'} {'//'} {contextLabels[currentContext]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playClickSound(true);
                setIsMockMode(!isMockMode);
                setAIEnabled(isMockMode);
              }}
              className={`osc-button px-2 py-1 flex items-center gap-1.5 text-[9px] ${
                isMockMode ? 'text-[#ef4444] border-t-[#ef4444]' : 'text-[#4ade80] border-t-[#4ade80]'
              }`}
            >
              {isMockMode ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
              {isMockMode ? 'OFFLINE' : 'ONLINE'}
            </button>
            <ComponentLibraryToggle />
            <button onClick={() => { playClickSound(false); useChatStore.getState().closeDrawer(); }} className="text-[#9ca3af] hover:text-[#f3f4f6] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Landing Page Header with Parts Toggle */}
      {isLandingPage && (
        <div className="flex items-center justify-start px-6 py-1.5 border-b border-[#374151]/50 gap-2">
          <button
            onClick={() => {
              playClickSound(true);
              setIsMockMode(!isMockMode);
              setAIEnabled(isMockMode);
            }}
            className={`osc-button px-2 py-1 flex items-center gap-1.5 text-[9px] ${
              isMockMode ? 'text-[#ef4444] border-t-[#ef4444]' : 'text-[#4ade80] border-t-[#4ade80]'
            }`}
          >
            {isMockMode ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
            {isMockMode ? 'OFFLINE' : 'ONLINE'}
          </button>
          <ComponentLibraryToggle />
        </div>
      )}

      {/* Component Library Overlay */}
      <ComponentLibrary onAddToChat={handleAddToChat} />

      {/* AI Error Banner */}
      {aiError && !isMockMode && (
        <div className="px-4 py-2 bg-[#ef4444]/10 border-b border-[#ef4444]/30 text-[9px] font-mono text-[#ef4444] flex items-center gap-2">
          <AlertTriangle className="w-3 h-3" />
          AI Error: {aiError.message}. Falling back to offline mode.
        </div>
      )}

      {/* Oscilloscope Screen Message Feed */}
      <div className="flex-1 !overflow-y-auto px-6 py-4 space-y-4 osc-screen">
        <div className="osc-grid" />
        <div className="relative z-10">
          {displayMessages.map((msg) => (
            <div key={msg.id} className="animate-fade-in text-[11px] font-mono mb-4">
              {msg.role === 'user' ? (
                <div className="text-[#9ca3af] mb-1">
                  <span>&gt; USER REQUEST INPUT:</span>
                  <p className="text-[#f3f4f6] mt-1 border-l-2 border-[#60a5fa] pl-2 py-0.5 leading-relaxed bg-[#60a5fa]/10">
                    {msg.content}
                  </p>
                </div>
              ) : (
                <div className="text-[#4ade80] space-y-2 leading-relaxed">
                  <div className="text-[9px] text-[#4ade80]/60 tracking-widest uppercase border-b border-[#4ade80]/20 pb-1">
                    {isMockMode ? 'SYSTEM OUTPUT // OFFLINE MODE' : 'SYSTEM OUTPUT // AI TELEMETRY'}
                  </div>
                  <div
                    className={`prose prose-sm prose-invert max-w-none text-[#4ade80] [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-[#4ade80] [&_h2]:mt-2 [&_h2]:border-b [&_h2]:border-[#4ade80]/20 [&_strong]:text-[#f3f4f6] [&_strong]:font-bold [&_code]:text-[#facc15] [&_code]:bg-[#111] [&_code]:px-1 [&_code]:rounded [&_code]:border [&_code]:border-[#374151] ${getFontSizeClass()} ${getLineHeightClass()} ${getBrightnessClass()} transition-all duration-300`}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />

                  {msg.isDesignReady && (
                    <div className="mt-3 pt-2">
                      <button 
                        onClick={() => {
                          playClickSound(true);
                          const store = useProjectStore.getState();
                          if (!store.pillar) store.setPillar('physical');
                          store.setShowWorkspace(true);
                        }}
                        className="osc-button px-4 py-2 flex items-center gap-2 osc-button-primary w-fit text-[#facc15]"
                        style={{ borderTopColor: '#facc15' }}>
                        ENGAGE CONFIGURATOR
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {msg.impactCards && msg.impactCards.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-[#4ade80]/20 pt-2">
                      <div className="text-[9px] text-[#ef4444] font-bold uppercase tracking-widest">
                        CRITICAL DIAGNOSTIC SUMMARY:
                      </div>
                      {msg.impactCards.map((card, i) => (
                        <ImpactCardComponent key={i} {...card} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-2 text-[10px] text-[#4ade80]/60 font-mono animate-pulse">
              <span className="osc-led active animate-pulse-dot" style={{ '--led-color': '#4ade80' } as React.CSSProperties} />
              <span>{isMockMode ? 'ACQUIRING SIGNAL PARAMETERS...' : getStatusText()}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Action Push-Buttons */}
      {quickActions.length > 0 && !isLandingPage && (
        <div className="px-6 py-2 flex gap-2 overflow-x-auto border-t border-[#374151] bg-[#1a1b1e] items-center relative min-h-[48px]">
          {quickActions.map((action) => (
            <button key={action.id} onClick={() => handleQuickAction(action.prompt)}
              className="osc-button px-3 py-1.5 shrink-0 flex items-center gap-1 text-[9px]">
              <Sparkles className="w-2.5 h-2.5 text-[#facc15]" />
              {action.label.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Lower Hardware Control Panel */}
      <div className="px-6 py-3 border-t border-[#374151] bg-[#1e1f22] flex flex-col gap-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <textarea
            ref={inputRef}
            value={currentInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={agentPhase === 'complete' ? 'INJECT REFINEMENT PARAMETERS...' : (() => {
              const pillar = useProjectStore.getState().pillar;
              if (!pillar) return 'PROVIDE SYSTEM SPECIFICATIONS...';
              return `DESCRIBE ${PILLAR_CONFIGS[pillar].name.toUpperCase()} PARAMETERS...`;
            })()}
            rows={1}
            className="flex-1 resize-none bg-[#111] border border-[#374151] rounded px-3 py-2 text-xs font-mono text-[#f3f4f6] placeholder:text-[#6b7280] focus:outline-none focus:border-[#60a5fa] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
            style={{ minHeight: '36px', maxHeight: '100px' }}
          />
          <button
            onClick={handleSend}
            disabled={!currentInput.trim() || isTyping}
            className="shrink-0 w-9 h-9 rounded bg-[#111] border border-[#374151] text-[#f3f4f6] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1a1b1e] hover:text-[#60a5fa] active:translate-y-0.5 shadow-md border-t-[#60a5fa]"
            style={{ borderTopWidth: currentInput.trim() && !isTyping ? '2px' : '1px' }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Token Gauge + Decorative Knobs */}
        <div className="flex flex-wrap items-center justify-between border-t border-[#374151] pt-2 select-none gap-y-2">
          <div className="flex items-center gap-3 sm:gap-5">
            {['TEXT SIZE', 'LINE SPACING', 'BRIGHTNESS'].map((label, idx) => (
              <div key={label} className="flex items-center gap-1.5 cursor-pointer group" onClick={() => handleKnobClick(idx)}>
                <div className="osc-knob osc-knob-sm transition-transform duration-200" style={{ transform: `rotate(${knobRotations[idx]}deg)` }}>
                  <div className="osc-knob-indicator" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] sm:text-[8px] font-mono font-bold text-[#9ca3af] tracking-widest leading-none whitespace-nowrap">{label}</span>
                  <span className="text-[6px] sm:text-[7px] font-mono text-[#60a5fa] mt-0.5 leading-none">{knobRotations[idx]}°</span>
                </div>
              </div>
            ))}
          </div>
          <TokenGauge isTyping={isTyping} />
        </div>
      </div>
    </div>
  );
}

// ─── Impact Card Component ────────────────────────────────────────────────

function ImpactCardComponent({ domain, severity, description, recommendation }: ImpactCard) {
  const domainIcons: Record<string, typeof Cog> = { mechanics: Cog, electronics: Zap, software: Cpu };
  const severityColors: Record<string, string> = { info: '#facc15', warning: '#f97316', critical: '#ef4444' };
  const Icon = domainIcons[domain] || AlertTriangle;
  const color = severityColors[severity] || '#facc15';

  return (
    <div className="rounded border p-2.5 text-[10px] font-mono space-y-1 bg-[#1a1b1e]/80" style={{ borderColor: color }}>
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="font-bold uppercase tracking-wider" style={{ color }}>
          {severity.toUpperCase() + " // " + domain.toUpperCase()}
        </span>
      </div>
      <p className="text-[#d1d5db]">{description}</p>
      <p className="text-[#60a5fa] font-bold">→ RECOMMEND: {recommendation}</p>
    </div>
  );
}

// Minimal markdown renderer for chat messages
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/✅/g, '<span style="color: #4ade80">✅</span>')
    .replace(/🔧|🤖|🎉|→|⚠️|💡|🔄|⚡|➕|💰|📐|🧱|🗑️|🔗/g, (m) => `<span>${m}</span>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}

// Drawer wrapper for non-landing pages
export function ChatDrawer() {
  const { isOpen, closeDrawer } = useChatStore();
  const [drawerWidth, setDrawerWidth] = useState(450);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 320 && newWidth <= 800) {
        setDrawerWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => { playClickSound(false); closeDrawer(); }} />
      <div 
        className="fixed top-0 right-0 z-50 h-full osc-chassis animate-slide-in-right shadow-2xl flex flex-col border-l border-[#374151]"
        style={{ width: `${drawerWidth}px`, maxWidth: '100vw' }}
      >
        {/* Resize Handle */}
        <div 
          className="absolute top-0 left-0 w-2 h-full cursor-col-resize z-50 hover:bg-[#60a5fa]/20 transition-colors hidden md:block"
          onMouseDown={() => {
            isDragging.current = true;
            document.body.style.cursor = 'col-resize';
          }}
        />
        <div className="absolute top-2 left-4"><span className="screw" /></div>
        <div className="absolute top-2 right-2"><span className="screw" /></div>
        <ChatPanel />
      </div>
    </>
  );
}

// Floating toggle button
export function ChatToggle() {
  const { toggleDrawer, isOpen } = useChatStore();
  const agentPhase = useProjectStore((s) => s.agentPhase);
  if (isOpen) return null;
  return (
    <button
      onClick={() => { playClickSound(true); toggleDrawer(); }}
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded osc-button text-[#facc15] shadow-lg border-t-2 border-[#facc15] transition-all flex items-center justify-center group">
      <MessageSquare className="w-5 h-5 group-hover:scale-105 transition-transform" />
      {agentPhase === 'generating' && (
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#4ade80] animate-pulse-dot" />
      )}
    </button>
  );
}
