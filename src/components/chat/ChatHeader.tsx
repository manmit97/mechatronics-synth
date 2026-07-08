import { Cog, Wifi, X, List } from 'lucide-react';
import { ConceptLibraryToggle } from './ConceptLibraryToggle';
import { ComponentLibraryToggle } from './ComponentLibraryToggle';
import { playClickSound } from '@/utils/audio';
import { useChatStore } from '@/stores/chat-store';
import { useChatHistoryStore } from '@/stores/chat-history-store';

interface ChatHeaderProps {
  isLandingPage: boolean;
  currentContext: string;
}

export function ChatHeader({
  isLandingPage,
  currentContext,
}: ChatHeaderProps) {
  const { toggleSidebar } = useChatHistoryStore();

  const contextLabels: Record<string, string> = {
    landing: '💬 LOG',
    configurator: '🔧 CONFIG',
    simulate: '⚡ SIM',
    bom: '📋 BOM',
    assembly: '🔩 ASSY',
    checkout: '🛒 OUT',
  };


  if (isLandingPage) {
    return (
      <div className="flex items-center justify-start px-6 py-1.5 border-b border-[#374151]/50 gap-2">
        <button 
          onClick={() => { playClickSound(true); toggleSidebar(); }}
          className="text-[#9ca3af] hover:text-[#f3f4f6] transition-colors p-1.5 rounded hover:bg-[#374151]"
          title="Chat History"
        >
          <List className="w-4 h-4" />
        </button>
        <div className="osc-button px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#4ade80] border-t-[#4ade80]">
          <Wifi className="w-3 h-3" />
          ONLINE
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border-b border-[#374151] bg-[#1a1b1e]">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => { playClickSound(true); toggleSidebar(); }}
          className="text-[#9ca3af] hover:text-[#f3f4f6] transition-colors p-1 rounded hover:bg-[#374151]"
          title="Chat History"
        >
          <List className="w-4 h-4" />
        </button>
        <Cog className="w-4 h-4 text-[#9ca3af] animate-spin-slow" />
        <ConceptLibraryToggle />
        <ComponentLibraryToggle />
      </div>
      <span className="text-sm font-semibold tracking-wide text-[#4ade80]">
        TERMINAL // LIVE AI {'//'} {contextLabels[currentContext] || '💬 LOG'}
      </span>
      <div className="flex items-center gap-2">
        <div className="osc-button px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#4ade80] border-t-[#4ade80]">
          <Wifi className="w-3 h-3" />
          ONLINE
        </div>
        <button 
          onClick={() => { playClickSound(false); useChatStore.getState().closeDrawer(); }} 
          className="text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
