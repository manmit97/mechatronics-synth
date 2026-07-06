import React, { RefObject } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { useProjectStore } from '@/stores/project-store';
import { PILLAR_CONFIGS } from '@/types/pillar';
import { TokenGauge } from './TokenGauge';

interface ChatInputProps {
  currentInput: string;
  isTyping: boolean;
  isLandingPage: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSend: () => void;
  handleQuickAction: (prompt: string) => void;
}

export function ChatInput({
  currentInput,
  isTyping,
  isLandingPage,
  inputRef,
  handleInputChange,
  handleKeyDown,
  handleSend,
  handleQuickAction,
}: ChatInputProps) {
  const { quickActions } = useChatStore();
  const agentPhase = useProjectStore((s) => s.agentPhase);

  const getPlaceholder = () => {
    if (agentPhase === 'complete') return 'INJECT REFINEMENT PARAMETERS...';
    const pillar = useProjectStore.getState().pillar;
    if (!pillar) return 'PROVIDE SYSTEM SPECIFICATIONS...';
    return `DESCRIBE ${PILLAR_CONFIGS[pillar].name.toUpperCase()} PARAMETERS...`;
  };

  return (
    <>
      {/* Quick Action Push-Buttons */}
      {quickActions.length > 0 && !isLandingPage && (
        <div className="px-6 py-2 flex gap-2 overflow-x-auto border-t border-[#374151] bg-[#1a1b1e] items-center relative min-h-[48px]">
          {quickActions.map((action) => (
            <button 
              key={action.id} 
              onClick={() => handleQuickAction(action.prompt)}
              className="osc-button px-4 py-2 shrink-0 flex items-center gap-1.5 text-xs font-semibold"
            >
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
            id="chat-input"
            ref={inputRef}
            value={currentInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            rows={1}
            className="flex-1 resize-none bg-[#111] border border-[#374151] rounded px-3 py-2 text-sm font-sans text-[#f3f4f6] placeholder:text-[#6b7280] focus:outline-none focus:border-[#60a5fa] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
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

        {/* Token Gauge */}
        <div className="flex flex-wrap items-center justify-between border-t border-[#374151] pt-2 select-none gap-y-2">
          <div className="flex items-center">
            {/* Audio settings moved to the global Navbar */}
          </div>
          <TokenGauge isTyping={isTyping} />
        </div>
      </div>
    </>
  );
}
