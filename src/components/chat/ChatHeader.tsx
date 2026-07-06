import { Cog, Wifi, WifiOff, X } from 'lucide-react';
import { ConceptLibraryToggle } from './ConceptLibraryToggle';
import { ComponentLibraryToggle } from './ComponentLibraryToggle';
import { playClickSound } from '@/utils/audio';
import { useChatStore } from '@/stores/chat-store';

interface ChatHeaderProps {
  isLandingPage: boolean;
  isMockMode: boolean;
  setIsMockMode: (mock: boolean) => void;
  setAIEnabled: (enabled: boolean) => void;
  currentContext: string;
}

export function ChatHeader({
  isLandingPage,
  isMockMode,
  setIsMockMode,
  setAIEnabled,
  currentContext,
}: ChatHeaderProps) {
  const contextLabels: Record<string, string> = {
    landing: '💬 LOG',
    configurator: '🔧 CONFIG',
    simulate: '⚡ SIM',
    bom: '📋 BOM',
    assembly: '🔩 ASSY',
    checkout: '🛒 OUT',
  };

  const handleToggleMode = () => {
    playClickSound(true);
    setIsMockMode(!isMockMode);
    setAIEnabled(isMockMode);
  };

  if (isLandingPage) {
    return (
      <div className="flex items-center justify-start px-6 py-1.5 border-b border-[#374151]/50 gap-2">
        <button
          onClick={handleToggleMode}
          className={`osc-button px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold ${
            isMockMode ? 'text-[#ef4444] border-t-[#ef4444]' : 'text-[#4ade80] border-t-[#4ade80]'
          }`}
        >
          {isMockMode ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
          {isMockMode ? 'OFFLINE' : 'ONLINE'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border-b border-[#374151] bg-[#1a1b1e]">
      <div className="flex items-center gap-2">
        <Cog className="w-4 h-4 text-[#9ca3af] animate-spin-slow" />
        <ConceptLibraryToggle />
        <ComponentLibraryToggle />
      </div>
      <span className={`text-sm font-semibold tracking-wide ${isMockMode ? 'text-[#ef4444]' : 'text-[#4ade80]'}`}>
        TERMINAL {isMockMode ? '// OFFLINE' : '// LIVE AI'} {'//'} {contextLabels[currentContext] || '💬 LOG'}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggleMode}
          className={`osc-button px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold ${
            isMockMode ? 'text-[#ef4444] border-t-[#ef4444]' : 'text-[#4ade80] border-t-[#4ade80]'
          }`}
        >
          {isMockMode ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
          {isMockMode ? 'OFFLINE' : 'ONLINE'}
        </button>
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
