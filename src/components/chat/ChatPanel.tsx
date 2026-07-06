'use client';

import { useChatStore } from '@/stores/chat-store';
import { useChatEngine } from '@/hooks/useChatEngine';
import { ChatHeader } from './ChatHeader';
import { ChatFeed } from './ChatFeed';
import { ChatInput } from './ChatInput';
import { AlertTriangle } from 'lucide-react';
import { ChatHistorySidebar } from './ChatHistorySidebar';

export function ChatPanel({ isLandingPage = false }: { isLandingPage?: boolean }) {
  const { currentContext } = useChatStore();
  const engine = useChatEngine();

  const getStatusText = (): string => {
    if (engine.aiStatus === 'submitted') return 'ACQUIRING SIGNAL PARAMETERS...';
    if (engine.aiStatus === 'streaming') return 'RECEIVING AI TELEMETRY...';
    return 'ACQUIRING SIGNAL PARAMETERS...';
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative">
      <ChatHistorySidebar isMockMode={engine.isMockMode} />
      
      {/* Recessed cabinet chassis screws */}
      <div className="absolute top-2 left-2"><span className="screw" /></div>
      <div className="absolute top-2 right-2"><span className="screw" /></div>

      <ChatHeader 
        isLandingPage={isLandingPage}
        isMockMode={engine.isMockMode}
        setIsMockMode={engine.setIsMockMode}
        setAIEnabled={engine.setAIEnabled}
        currentContext={currentContext}
      />

      {/* AI Error Banner */}
      {engine.aiError && !engine.isMockMode && (
        <div className="px-4 py-2 bg-[#ef4444]/10 border-b border-[#ef4444]/30 text-sm font-medium text-[#ef4444] flex items-center gap-2">
          <AlertTriangle className="w-3 h-3" />
          AI Error: {engine.aiError.message}. Falling back to offline mode.
        </div>
      )}

      <ChatFeed 
        displayMessages={engine.displayMessages}
        isTyping={engine.isTyping}
        isMockMode={engine.isMockMode}
        getStatusText={getStatusText}
        messagesEndRef={engine.messagesEndRef}
      />

      <ChatInput 
        currentInput={engine.currentInput}
        isTyping={engine.isTyping}
        isLandingPage={isLandingPage}
        inputRef={engine.inputRef}
        handleInputChange={engine.handleInputChange}
        handleKeyDown={engine.handleKeyDown}
        handleSend={engine.handleSend}
        handleQuickAction={engine.handleQuickAction}
      />
    </div>
  );
}
