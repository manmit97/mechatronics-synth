'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, MessageSquare, Send, Sparkles, ArrowRight, AlertTriangle, Zap, Cog, Cpu } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { useProjectStore } from '@/stores/project-store';
import { PILLAR_CONFIGS } from '@/types/pillar';
import { useConfiguratorStore } from '@/stores/configurator-store';
import { useBOMStore } from '@/stores/bom-store';
import { useDesignHistoryStore } from '@/stores/design-history-store';
import { getMockGreeting, getMockResponse } from '@/ai/mock/mock-agent-responses';
import { processRefinementRequest, formatCrossDomainImpacts } from '@/ai/mock/mock-refinement-engine';
import Link from 'next/link';
import { playClickSound, playKeyPressSound } from '@/utils/audio';

interface Message {
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

export function ChatPanel({ isLandingPage = false }: { isLandingPage?: boolean }) {
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: '0', role: 'assistant', content: getMockGreeting(), timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { quickActions, currentContext } = useChatStore();
  const { setIdea, setRequirements, setAgentPhase, agentPhase } = useProjectStore();
  const { catalog, addMultipleToCatalog, initializeConfig, addPart, clearCatalog } = useConfiguratorStore();
  const { recalculate } = useBOMStore();
  const { createSnapshot } = useDesignHistoryStore();

  // Decorative rotating knobs for diagnostic screen
  const [knobRotations, setKnobRotations] = useState([45, -30, 90]);

  const handleKnobClick = (index: number) => {
    playClickSound(true);
    setKnobRotations((prev) => {
      const next = [...prev];
      next[index] = (next[index] + 45) % 360;
      return next;
    });
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    playKeyPressSound();
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setInput('');
    setTurnCount((t) => t + 1);
    playClickSound(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsg,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    if (turnCount === 0) {
      setIdea(userMsg);
    }

    // ─── REFINEMENT MODE ──────────────────────────────────────────────────────
    if (agentPhase === 'complete' && catalog.length > 0) {
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

      const result = processRefinementRequest(userMsg, catalog);
      const impactText = formatCrossDomainImpacts(result.crossDomainImpacts);

      // Apply changes to stores
      if (result.partsRemoved.length > 0) {
        const config = useConfiguratorStore.getState().config;
        if (config) {
          const newParts = config.parts.filter(
            (p) => !result.partsRemoved.includes(p.partId)
          );
          useConfiguratorStore.getState().setPlacedParts(newParts);
        }
        const currentCatalog = useConfiguratorStore.getState().catalog;
        const filteredCatalog = currentCatalog.filter(
          (p) => !result.partsRemoved.includes(p.id)
        );
        clearCatalog();
        const projectStore = useProjectStore.getState();
        if (projectStore.requirements) {
          initializeConfig(
            projectStore.requirements.projectName,
            projectStore.requirements.description,
            projectStore.requirements
          );
        }
        addMultipleToCatalog(filteredCatalog);
        const spacing = 0.8;
        filteredCatalog.forEach((part, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          addPart(part.id, [(col - 1.5) * spacing, 0, (row - 1) * spacing]);
        });
      }

      if (result.partsAdded.length > 0) {
        addMultipleToCatalog(result.partsAdded);
        const currentConfig = useConfiguratorStore.getState().config;
        if (currentConfig) {
          const spacing = 0.8;
          const existingCount = currentConfig.parts.length;
          result.partsAdded.forEach((part, i) => {
            const idx = existingCount + i;
            const col = idx % 4;
            const row = Math.floor(idx / 4);
            addPart(part.id, [(col - 1.5) * spacing, 0, (row - 1) * spacing]);
          });
        }
      }

      if (result.partsModified.length > 0) {
        const updatedCatalog = useConfiguratorStore.getState().catalog.map((p) => {
          const mod = result.partsModified.find((m) => m.partId === p.id);
          return mod ? { ...p, ...mod.updates } : p;
        });
        clearCatalog();
        const projectStore = useProjectStore.getState();
        if (projectStore.requirements) {
          initializeConfig(
            projectStore.requirements.projectName,
            projectStore.requirements.description,
            projectStore.requirements
          );
        }
        addMultipleToCatalog(updatedCatalog);
        const spacing = 0.8;
        updatedCatalog.forEach((part, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          addPart(part.id, [(col - 1.5) * spacing, 0, (row - 1) * spacing]);
        });
      }

      const updatedCatalog = useConfiguratorStore.getState().catalog;
      const bomEntries = updatedCatalog.map((p) => ({
        partId: p.id,
        partName: p.name,
        category: p.category,
        sourceType: p.sourceType,
        quantity: p.category === 'actuator' || p.category === 'wheel' ? 4 : 1,
        unitCost: p.unitCost,
        totalCost: p.unitCost * (p.category === 'actuator' || p.category === 'wheel' ? 4 : 1),
        manufacturingMethod: p.manufacturingMethod,
        sourcingUrl: p.sourcingUrl,
        supplierName: p.supplierName,
        leadTimeDays: p.leadTimeDays,
      }));
      recalculate(bomEntries);

      const config = useConfiguratorStore.getState().config;
      const costBreakdown = useBOMStore.getState().costBreakdown;
      if (config) {
        createSnapshot(`Refinement: ${result.intent}`, 'refinement', {
          config,
          catalog: updatedCatalog,
          bom: bomEntries,
          costBreakdown,
        });
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.explanation + impactText,
        timestamp: new Date(),
        isRefinement: true,
        impactCards: result.crossDomainImpacts.map((impact) => ({
          domain: impact.domain,
          severity: impact.severity,
          description: impact.description,
          recommendation: impact.recommendation,
        })),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
      return;
    }

    // ─── INITIAL DESIGN MODE ──────────────────────────────────────────────────
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 800));

    const response = getMockResponse(userMsg, turnCount);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      isGenerating: response.isGenerating,
      isDesignReady: response.isComplete,
    };
    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);

    if (response.parts && response.requirements) {
      setRequirements(response.requirements);
      addMultipleToCatalog(response.parts);
      initializeConfig(
        response.requirements.projectName,
        response.requirements.description,
        response.requirements
      );

      const spacing = 0.8;
      response.parts.forEach((part, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = (col - 1.5) * spacing;
        const z = (row - 1) * spacing;
        addPart(part.id, [x, 0, z]);
      });

      const bomEntries = response.parts.map((p) => ({
        partId: p.id,
        partName: p.name,
        category: p.category,
        sourceType: p.sourceType,
        quantity: p.category === 'actuator' || p.category === 'wheel' ? 4 : 1,
        unitCost: p.unitCost,
        totalCost: p.unitCost * (p.category === 'actuator' || p.category === 'wheel' ? 4 : 1),
        manufacturingMethod: p.manufacturingMethod,
        sourcingUrl: p.sourcingUrl,
        supplierName: p.supplierName,
        leadTimeDays: p.leadTimeDays,
      }));
      recalculate(bomEntries);

      const config = useConfiguratorStore.getState().config;
      const costBreakdown = useBOMStore.getState().costBreakdown;
      if (config) {
        createSnapshot('Initial design generated by AI', 'ai_generation', {
          config,
          catalog: response.parts,
          bom: bomEntries,
          costBreakdown,
        });
      }

      setAgentPhase('complete');
    }
  }, [input, isTyping, turnCount, agentPhase, catalog, setIdea, setRequirements, setAgentPhase, addMultipleToCatalog, initializeConfig, addPart, clearCatalog, recalculate, createSnapshot]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    playClickSound(true);
    setInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const contextLabels: Record<string, string> = {
    landing: '💬 LOG',
    configurator: '🔧 CONFIG',
    simulate: '⚡ SIM',
    bom: '📋 BOM',
    assembly: '🔩 ASSY',
    checkout: '🛒 OUT',
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      
      {/* Recessed cabinet chassis screws */}
      <div className="absolute top-2 left-2"><span className="screw" /></div>
      <div className="absolute top-2 right-2"><span className="screw" /></div>

      {/* Screen Header */}
      {!isLandingPage && (
        <div className="flex items-center justify-between px-6 py-2 border-b border-[#374151] bg-[#1a1b1e]">
          <div className="flex items-center gap-2">
            <span className="osc-led active animate-pulse-dot" style={{ '--led-color': '#facc15' } as React.CSSProperties} />
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#facc15]">
              TERMINAL ACTIVE // PHASE: {contextLabels[currentContext]}
            </span>
          </div>
          <button 
            onClick={() => {
              playClickSound(false);
              useChatStore.getState().closeDrawer();
            }} 
            className="text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Oscilloscope Screen Message Feed */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 osc-screen">
        <div className="osc-grid" />
        <div className="relative z-10">
          {messages.map((msg) => (
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
                    SYSTEM OUTPUT // TELEMETRY RECEIVED
                  </div>
                  <div 
                    className="prose prose-sm prose-invert max-w-none text-[#4ade80] [&_h2]:text-xs [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-[#4ade80] [&_h2]:mt-2 [&_h2]:border-b [&_h2]:border-[#4ade80]/20 [&_p]:leading-normal [&_strong]:text-[#f3f4f6] [&_strong]:font-bold [&_code]:text-[#facc15] [&_code]:bg-[#111] [&_code]:px-1 [&_code]:rounded [&_code]:border [&_code]:border-[#374151]"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                  
                  {msg.isDesignReady && (
                    <div className="mt-3 pt-2">
                      <Link 
                        href="/configurator"
                        onClick={() => playClickSound(true)}
                        className="osc-button px-4 py-2 flex items-center gap-2 osc-button-primary w-fit text-[#facc15]"
                        style={{ borderTopColor: '#facc15' }}
                      >
                        ENGAGE CONFIGURATOR
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
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
              <span>ACQUIRING SIGNAL PARAMETERS...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Action Push-Buttons */}
      {quickActions.length > 0 && !isLandingPage && (
        <div className="px-6 py-2 flex gap-2 overflow-x-auto border-t border-[#374151] bg-[#1a1b1e] items-center relative min-h-[48px]">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.prompt)}
              className="osc-button px-3 py-1.5 shrink-0 flex items-center gap-1 text-[9px]"
            >
              <Sparkles className="w-2.5 h-2.5 text-[#facc15]" />
              {action.label.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Lower Hardware Control Panel with Knobs */}
      <div className="px-6 py-3 border-t border-[#374151] bg-[#1e1f22] flex flex-col gap-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={agentPhase === 'complete' ? 'INJECT REFINEMENT PARAMETERS...' : (() => {
              const pillar = useProjectStore.getState().pillar;
              if (!pillar) return 'PROVIDE SYSTEM SPECIFICATIONS...';
              const cfg = PILLAR_CONFIGS[pillar];
              return `DESCRIBE ${cfg.name.toUpperCase()} PARAMETERS...`;
            })()}
            rows={1}
            className="flex-1 resize-none bg-[#111] border border-[#374151] rounded px-3 py-2 text-xs font-mono text-[#f3f4f6] placeholder:text-[#6b7280] focus:outline-none focus:border-[#60a5fa] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
            style={{ minHeight: '36px', maxHeight: '100px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="shrink-0 w-9 h-9 rounded bg-[#111] border border-[#374151] text-[#f3f4f6] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1a1b1e] hover:text-[#60a5fa] active:translate-y-0.5 shadow-md border-t-[#60a5fa]"
            style={{ borderTopWidth: input.trim() && !isTyping ? '2px' : '1px' }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dynamic Rotating Dials for Dialing Aesthetics */}
        <div className="flex items-center justify-between border-t border-[#374151] pt-2 select-none">
          <div className="flex items-center gap-5">
            {['HORIZONTAL', 'TRIGGER', 'VERTICAL'].map((label, idx) => (
              <div 
                key={label} 
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => handleKnobClick(idx)}
              >
                <div 
                  className="osc-knob osc-knob-sm transition-transform duration-200"
                  style={{ transform: `rotate(${knobRotations[idx]}deg)` }}
                >
                  <div className="osc-knob-indicator" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-mono font-bold text-[#9ca3af] tracking-widest leading-none">
                    {label}
                  </span>
                  <span className="text-[7px] font-mono text-[#60a5fa] mt-0.5 leading-none">
                    {knobRotations[idx]}°
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[8px] font-mono text-[#6b7280] tracking-wider">
            TECN-500 TERMINAL CORE
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── Impact Card Component ────────────────────────────────────────────────

function ImpactCardComponent({ domain, severity, description, recommendation }: ImpactCard) {
  const domainIcons: Record<string, typeof Cog> = {
    mechanics: Cog,
    electronics: Zap,
    software: Cpu,
  };
  
  const severityColors: Record<string, string> = {
    info: '#facc15',     // yellow
    warning: '#f97316',  // orange
    critical: '#ef4444', // red
  };

  const Icon = domainIcons[domain] || AlertTriangle;
  const color = severityColors[severity] || '#facc15';

  return (
    <div
      className="rounded border p-2.5 text-[10px] font-mono space-y-1 bg-[#1a1b1e]/80"
      style={{ borderColor: color }}
    >
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => { playClickSound(false); closeDrawer(); }} />
      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md osc-chassis animate-slide-in-right shadow-2xl flex flex-col border-l border-[#374151]">
        <div className="absolute top-2 left-2"><span className="screw" /></div>
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
      onClick={() => {
        playClickSound(true);
        toggleDrawer();
      }}
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded osc-button text-[#facc15] shadow-lg border-t-2 border-[#facc15] transition-all flex items-center justify-center group"
    >
      <MessageSquare className="w-5 h-5 group-hover:scale-105 transition-transform" />
      {agentPhase === 'generating' && (
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#4ade80] animate-pulse-dot" />
      )}
    </button>
  );
}
