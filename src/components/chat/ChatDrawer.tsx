import { useState, useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { useProjectStore } from '@/stores/project-store';
import { playClickSound } from '@/utils/audio';
import { ChatPanel } from './ChatPanel';

export function ChatDrawer() {
  const { isOpen, closeDrawer } = useChatStore();

  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => { playClickSound(false); closeDrawer(); }} />
      <div 
        className="fixed top-20 right-6 z-50 osc-chassis animate-slide-in-right shadow-2xl flex flex-col border border-[#374151] rounded-xl overflow-hidden"
        style={{ 
          width: '500px', 
          height: '700px',
          minWidth: '320px',
          minHeight: '400px',
          maxWidth: '90vw',
          maxHeight: '85vh',
          resize: 'both',
          overflow: 'auto'
        }}
      >
        <div className="absolute top-2 left-4"><span className="screw" /></div>
        <div className="absolute top-2 right-2"><span className="screw" /></div>
        <ChatPanel />
      </div>
    </>
  );
}

export function ChatToggle() {
  const { toggleDrawer, isOpen } = useChatStore();
  const agentPhase = useProjectStore((s) => s.agentPhase);
  
  if (isOpen) return null;
  
  return (
    <button
      onClick={() => { playClickSound(true); toggleDrawer(); }}
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded osc-button text-[#facc15] shadow-lg border-t-2 border-[#facc15] transition-all flex items-center justify-center group"
    >
      <MessageSquare className="w-5 h-5 group-hover:scale-105 transition-transform" />
      {agentPhase === 'generating' && (
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#4ade80] animate-pulse-dot" />
      )}
    </button>
  );
}
