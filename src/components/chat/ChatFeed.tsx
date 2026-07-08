import React, { RefObject } from 'react';
import { ArrowRight } from 'lucide-react';
import { type LocalMessage } from '@/hooks/useChatEngine';
import { renderMarkdown } from '@/utils/markdown';
import { ImpactCardComponent } from './ImpactCard';
import { playClickSound } from '@/utils/audio';
import { useProjectStore } from '@/stores/project-store';
import { useChatStore } from '@/stores/chat-store';

interface ChatFeedProps {
  displayMessages: LocalMessage[];
  isTyping: boolean;
  getStatusText: () => string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function ChatFeed({
  displayMessages,
  isTyping,
  getStatusText,
  messagesEndRef,
}: ChatFeedProps) {
  const { knobRotations } = useChatStore();

  const getFontSizeClass = () => {
    const rot = knobRotations[0] || 0;
    if (rot <= 25) return 'text-sm [&_h2]:text-base [&_h3]:text-sm font-sans';
    if (rot <= 50) return 'text-base [&_h2]:text-lg [&_h3]:text-base font-sans';
    if (rot <= 75) return 'text-lg [&_h2]:text-xl [&_h3]:text-lg font-sans';
    return 'text-xl [&_h2]:text-2xl [&_h3]:text-xl font-sans';
  };

  const getLineHeightClass = () => {
    const rot = knobRotations[1] || 0;
    if (rot <= 33) return '[&_p]:leading-tight';
    if (rot <= 66) return '[&_p]:leading-relaxed';
    return '[&_p]:leading-loose';
  };

  const getBrightnessClass = () => {
    const rot = knobRotations[2] || 0;
    if (rot <= 33) return 'opacity-70 drop-shadow-none';
    if (rot <= 66) return 'opacity-90 drop-shadow-[0_0_1px_rgba(74,222,128,0.2)]';
    return 'opacity-100 drop-shadow-[0_0_4px_rgba(74,222,128,0.8)]';
  };

  return (
    <div className="flex-1 !overflow-y-auto px-6 py-4 space-y-4 osc-screen">
      <div className="osc-grid" />
      <div className="relative z-10">
        {displayMessages.map((msg) => (
          <div key={msg.id} className="animate-fade-in text-base font-sans mb-4">
            {msg.role === 'user' ? (
              <div className="text-[#9ca3af] mb-1">
                <span className="text-xs font-semibold tracking-wide">&gt; USER REQUEST INPUT:</span>
                <p className="text-[#f3f4f6] mt-1 border-l-2 border-[#60a5fa] pl-3 py-1.5 leading-relaxed bg-[#60a5fa]/10 rounded-r">
                  {msg.content}
                </p>
              </div>
            ) : (
              <div className="text-[#4ade80] space-y-2 leading-relaxed">
                <div className="text-xs text-[#4ade80]/60 font-semibold tracking-widest uppercase border-b border-[#4ade80]/20 pb-1">
                  SYSTEM OUTPUT // AI TELEMETRY
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
                      style={{ borderTopColor: '#facc15' }}
                    >
                      ENGAGE CONFIGURATOR
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {msg.impactCards && msg.impactCards.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-[#4ade80]/20 pt-2">
                    <div className="text-xs text-[#ef4444] font-bold uppercase tracking-widest">
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
          <div className="flex items-center gap-2 text-xs text-[#4ade80]/60 font-sans font-semibold animate-pulse">
            <span className="osc-led active animate-pulse-dot" style={{ '--led-color': '#4ade80' } as React.CSSProperties} />
            <span>{getStatusText()}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
