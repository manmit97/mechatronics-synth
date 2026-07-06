'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
  messages: any[];
  isMockMode: boolean;
}

interface ChatHistoryState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isSidebarOpen: boolean;

  createNewSession: (isMockMode: boolean) => string;
  loadSession: (id: string) => void;
  updateCurrentSession: (messages: any[], isMockMode: boolean) => void;
  deleteSession: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
}

export const useChatHistoryStore = create<ChatHistoryState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      isSidebarOpen: false,

      createNewSession: (isMockMode) => {
        const id = Date.now().toString();
        const newSession: ChatSession = {
          id,
          title: 'New Chat',
          updatedAt: Date.now(),
          messages: [],
          isMockMode,
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: id,
        }));
        return id;
      },

      loadSession: (id) => set({ currentSessionId: id, isSidebarOpen: false }),

      updateCurrentSession: (messages, isMockMode) => {
        const { currentSessionId } = get();
        if (!currentSessionId) return;

        let title = 'New Chat';
        if (messages.length > 0) {
          const firstUserMessage = messages.find((m: any) => m.role === 'user');
          if (firstUserMessage) {
            let text = firstUserMessage.content || '';
            if (!text && firstUserMessage.parts && firstUserMessage.parts[0]?.text) {
              text = firstUserMessage.parts[0].text;
            }
            if (text) {
              title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
            }
          }
        }

        set((state) => ({
          sessions: state.sessions.map((s) => 
            s.id === currentSessionId 
              ? { ...s, messages, isMockMode, updatedAt: Date.now(), title: title === 'New Chat' ? s.title : title } 
              : s
          ).sort((a, b) => b.updatedAt - a.updatedAt)
        }));
      },

      deleteSession: (id) => set((state) => {
        const remaining = state.sessions.filter(s => s.id !== id);
        return {
          sessions: remaining,
          currentSessionId: state.currentSessionId === id 
            ? (remaining.length > 0 ? remaining[0].id : null) 
            : state.currentSessionId
        };
      }),

      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
    }),
    {
      name: 'chat-history-storage',
    }
  )
);
