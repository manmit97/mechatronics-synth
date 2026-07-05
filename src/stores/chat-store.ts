'use client';

import { create } from 'zustand';
import type { PageContext, QuickAction } from '@/types/ai';

export type { QuickAction };

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'suggest', label: 'Suggest improvements', prompt: 'Analyze my current design and suggest improvements for performance and cost.', icon: 'Sparkles', contexts: ['configurator'] },
  { id: 'add-sensor', label: 'Add a sensor', prompt: 'I need to add a sensor to my design. What would you recommend based on my requirements?', icon: 'Radio', contexts: ['configurator'] },
  { id: 'reduce-weight', label: 'Reduce weight', prompt: 'Help me reduce the total weight of my design while maintaining structural integrity.', icon: 'ArrowDown', contexts: ['configurator'] },
  { id: 'why-fail', label: 'Why did it fail?', prompt: 'Analyze the simulation results and explain why the design failed.', icon: 'HelpCircle', contexts: ['simulate'] },
  { id: 'increase-stability', label: 'Increase stability', prompt: 'Suggest modifications to improve the mechanical stability of my design.', icon: 'Shield', contexts: ['simulate'] },
  { id: 'test-ramp', label: 'Test on ramp', prompt: 'Configure a ramp terrain simulation to test my design on inclines.', icon: 'TrendingUp', contexts: ['simulate'] },
  { id: 'cheaper', label: 'Find cheaper parts', prompt: 'Find cheaper alternatives for the most expensive components without significantly impacting performance.', icon: 'DollarSign', contexts: ['bom'] },
  { id: 'local-source', label: 'Source locally', prompt: 'Find locally available alternatives to reduce shipping time and cost.', icon: 'MapPin', contexts: ['bom'] },
  { id: 'reduce-lead', label: 'Reduce lead time', prompt: 'Suggest changes to reduce the overall manufacturing lead time.', icon: 'Clock', contexts: ['bom'] },
  { id: 'simplify-step', label: 'Simplify this step', prompt: 'Can you simplify the currently selected assembly step?', icon: 'Minimize2', contexts: ['assembly'] },
  { id: 'tools-needed', label: 'What tools needed?', prompt: 'List all tools I need for the complete assembly.', icon: 'Wrench', contexts: ['assembly'] },
];

interface ChatStoreState {
  isOpen: boolean;
  currentContext: PageContext;
  quickActions: QuickAction[];
  pendingPrompt: string | null;

  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  setContext: (page: PageContext) => void;
  setCurrentContext: (page: PageContext) => void;
  setQuickActions: (actions: QuickAction[]) => void;
  setPendingPrompt: (prompt: string | null) => void;
}

export const useChatStore = create<ChatStoreState>((set) => ({
  isOpen: false,
  currentContext: 'landing',
  quickActions: QUICK_ACTIONS.filter((a) => a.contexts.includes('landing')),
  pendingPrompt: null,

  toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),

  setContext: (page) =>
    set({
      currentContext: page,
      quickActions: QUICK_ACTIONS.filter((a) => a.contexts.includes(page)),
    }),

  setCurrentContext: (page) => set({ currentContext: page }),
  setQuickActions: (actions) => set({ quickActions: actions }),
  setPendingPrompt: (prompt) => set({ pendingPrompt: prompt }),
}));
