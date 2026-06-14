'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, MessageSquare, Send, Sparkles, ArrowRight, AlertTriangle, Zap, Cog, Cpu } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { useProjectStore } from '@/stores/project-store';
import { useConfiguratorStore } from '@/stores/configurator-store';
import { useBOMStore } from '@/stores/bom-store';
import { useDesignHistoryStore } from '@/stores/design-history-store';
import { getMockGreeting, getMockResponse } from '@/ai/mock/mock-agent-responses';
import { processRefinementRequest, formatCrossDomainImpacts } from '@/ai/mock/mock-refinement-engine';
import Link from 'next/link';

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
  const [messages, setMessages] = useState<Message[]>([
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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setInput('');
    setTurnCount((t) => t + 1);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsg,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Store the idea on first user message
    if (turnCount === 0) {
      setIdea(userMsg);
    }

    // ─── REFINEMENT MODE (design already exists) ─────────────────────
    if (agentPhase === 'complete' && catalog.length > 0) {
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));

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
        // Remove from catalog
        const currentCatalog = useConfiguratorStore.getState().catalog;
        const filteredCatalog = currentCatalog.filter(
          (p) => !result.partsRemoved.includes(p.id)
        );
        // We need to replace catalog — clear and re-add
        clearCatalog();
        const config2 = useConfiguratorStore.getState().config;
        // Re-init config since clearCatalog nulls it
        const projectStore = useProjectStore.getState();
        if (projectStore.requirements) {
          initializeConfig(
            projectStore.requirements.projectName,
            projectStore.requirements.description,
            projectStore.requirements
          );
        }
        addMultipleToCatalog(filteredCatalog);
        // Re-place remaining parts
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
        // Apply cost/supplier updates to catalog
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

      // Recalculate BOM
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

      // Create design snapshot
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

    // ─── INITIAL DESIGN MODE ─────────────────────────────────────────
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

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

    // If the agent generated parts, populate the stores
    if (response.parts && response.requirements) {
      setRequirements(response.requirements);
      addMultipleToCatalog(response.parts);
      initializeConfig(
        response.requirements.projectName,
        response.requirements.description,
        response.requirements
      );

      // Auto-place parts with layout
      const spacing = 0.8;
      response.parts.forEach((part, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = (col - 1.5) * spacing;
        const z = (row - 1) * spacing;
        addPart(part.id, [x, 0, z]);
      });

      // Generate BOM
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

      // Create design snapshot
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
    setInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const contextLabels: Record<string, string> = {
    landing: '💬 Chat',
    configurator: '🔧 Configurator',
    simulate: '⚡ Simulation',
    bom: '📋 BOM',
    assembly: '🔩 Assembly',
    checkout: '🛒 Checkout',
  };

  return (
    <div className={`flex flex-col h-full ${isLandingPage ? '' : ''}`}>
      {/* Header */}
      {!isLandingPage && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--color-accent-cyan)]" />
            <span className="text-sm font-medium">AI Agent</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]">
              {contextLabels[currentContext]}
            </span>
          </div>
          <button onClick={useChatStore.getState().closeDrawer} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none [&_h2]:text-base [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:mt-2 [&_p]:my-1.5 [&_li]:my-0.5 [&_strong]:text-[var(--color-accent-cyan)] [&_code]:text-[var(--color-accent-lime)] [&_code]:bg-[var(--color-surface-primary)] [&_code]:px-1 [&_code]:rounded"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
              ) : (
                <p>{msg.content}</p>
              )}
              {msg.isDesignReady && (
                <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)]">
                  <Link href="/configurator"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] text-white text-sm font-medium hover:shadow-[0_0_20px_var(--color-accent-cyan-glow)] transition-shadow">
                    Open Configurator
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
              {/* Cross-domain impact cards */}
              {msg.impactCards && msg.impactCards.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.impactCards.map((card, i) => (
                    <ImpactCardComponent key={i} {...card} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="chat-bubble-assistant px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent-cyan)] animate-pulse-dot" style={{ animationDelay: '0s' }} />
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent-cyan)] animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent-cyan)] animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">
                {agentPhase === 'complete' ? 'Analyzing impact...' : 'Thinking...'}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {quickActions.length > 0 && !isLandingPage && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-[var(--color-border-subtle)]">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.prompt)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-cyan)] hover:border-[var(--color-accent-cyan)] transition-all"
            >
              <Sparkles className="w-3 h-3" />
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-[var(--color-border-subtle)]">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={agentPhase === 'complete' ? 'Refine your design...' : 'Describe your mechatronic system...'}
            rows={1}
            className="flex-1 resize-none bg-[var(--color-surface-input)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--color-accent-cyan)] to-[var(--color-accent-cyan-dim)] flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_20px_var(--color-accent-cyan-glow)] transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
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
    info: 'var(--color-accent-cyan)',
    warning: 'var(--color-accent-amber)',
    critical: 'var(--color-accent-rose)',
  };

  const Icon = domainIcons[domain] || AlertTriangle;
  const color = severityColors[severity] || 'var(--color-text-muted)';

  return (
    <div
      className="rounded-lg border px-3 py-2.5 text-xs space-y-1"
      style={{ borderColor: color, backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)` }}
    >
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="font-medium uppercase tracking-wide" style={{ color }}>
          {severity} — {domain}
        </span>
      </div>
      <p className="text-[var(--color-text-secondary)]">{description}</p>
      <p className="text-[var(--color-text-muted)] italic">→ {recommendation}</p>
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
    .replace(/✅/g, '<span style="color: var(--color-accent-lime)">✅</span>')
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
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={closeDrawer} />
      {/* Drawer */}
      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[var(--color-surface-secondary)] border-l border-[var(--color-border-subtle)] animate-slide-in-right shadow-2xl">
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
      onClick={toggleDrawer}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] text-white shadow-lg hover:shadow-[0_0_30px_var(--color-accent-cyan-glow)] transition-all flex items-center justify-center group"
    >
      <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
      {agentPhase === 'generating' && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-accent-lime)] animate-pulse-dot" />
      )}
    </button>
  );
}
