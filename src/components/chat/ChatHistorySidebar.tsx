'use client';

import { useChatHistoryStore } from '@/stores/chat-history-store';
import { Plus, MessageSquare, Trash2, X } from 'lucide-react';
import { playClickSound } from '@/utils/audio';

export function ChatHistorySidebar() {
  const { 
    sessions, 
    currentSessionId, 
    isSidebarOpen, 
    createNewSession, 
    loadSession, 
    deleteSession,
    setSidebarOpen
  } = useChatHistoryStore();

  if (!isSidebarOpen) return null;

  const handleNewChat = () => {
    playClickSound(true);
    createNewSession(false);
  };

  const handleLoadSession = (id: string) => {
    if (id !== currentSessionId) {
      playClickSound(true);
      loadSession(id);
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    playClickSound(false);
    deleteSession(id);
  };

  return (
    <>
      <div 
        className="absolute inset-0 bg-black/40 z-10 backdrop-blur-sm"
        onClick={() => { playClickSound(false); setSidebarOpen(false); }}
      />
      <div className="w-64 border-l border-[#374151] bg-[#1a1b1e] h-full flex flex-col absolute right-0 top-0 bottom-0 z-20 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#374151]">
          <span className="text-sm font-semibold tracking-wide text-[#9ca3af]">
            CHAT HISTORY
          </span>
          <button 
            onClick={() => { playClickSound(false); setSidebarOpen(false); }} 
            className="text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-3 border-b border-[#374151]">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 justify-center py-2 px-4 rounded-md osc-button text-[#4ade80] border-t-[#4ade80] text-sm font-semibold hover:bg-[#4ade80]/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            NEW CHAT
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleLoadSession(session.id)}
              className={`group relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                currentSessionId === session.id
                  ? 'bg-[#374151] text-[#f3f4f6]'
                  : 'hover:bg-[#2d3748] text-[#9ca3af]'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare className={`w-4 h-4 shrink-0 ${currentSessionId === session.id ? 'text-[#4ade80]' : 'text-[#6b7280]'}`} />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm truncate">{session.title || 'New Chat'}</span>
                  <span className="text-[10px] text-[#6b7280]">
                    {new Date(session.updatedAt).toLocaleDateString()} {new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              
              <button
                onClick={(e) => handleDeleteSession(e, session.id)}
                className={`p-1.5 text-[#6b7280] hover:text-[#ef4444] rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                  currentSessionId === session.id ? 'opacity-100' : ''
                }`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-center p-4 text-sm text-[#6b7280]">
              No history found.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
