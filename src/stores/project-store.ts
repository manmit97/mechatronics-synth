'use client';

import { create } from 'zustand';
import type { UserIdea, RequirementsSpec } from '@/types/project';
import type { AgentPhase, GenerationProgress } from '@/types/ai';
import type { ServicePillar } from '@/types/pillar';

interface ProjectState {
  pillar: ServicePillar | null;
  idea: UserIdea | null;
  requirements: RequirementsSpec | null;
  agentPhase: AgentPhase;
  generationProgress: GenerationProgress;
  showWorkspace: boolean;
  show3DViewport: boolean;

  setPillar: (pillar: ServicePillar) => void;
  setIdea: (description: string) => void;
  setRequirements: (req: RequirementsSpec) => void;
  setAgentPhase: (phase: AgentPhase) => void;
  updateProgress: (completed: number, currentStep: string) => void;
  setTotalProgress: (total: number) => void;
  setShowWorkspace: (show: boolean) => void;
  setShow3DViewport: (show: boolean) => void;
  reset: () => void;
}

const initialProgress: GenerationProgress = {
  total: 0,
  completed: 0,
  currentStep: '',
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  pillar: null,
  idea: null,
  requirements: null,
  agentPhase: 'idle',
  generationProgress: initialProgress,
  showWorkspace: false,
  show3DViewport: true,

  setPillar: (pillar) => set({ pillar }),

  setIdea: (description) => {
    const pillar = get().pillar || 'physical';
    set({
      idea: {
        rawDescription: description,
        timestamp: new Date().toISOString(),
        pillar,
      },
      agentPhase: 'gathering',
    });
  },

  setRequirements: (req) =>
    set({ requirements: req, agentPhase: 'generating' }),

  setAgentPhase: (phase) => set({ agentPhase: phase }),

  updateProgress: (completed, currentStep) =>
    set((state) => ({
      generationProgress: {
        ...state.generationProgress,
        completed,
        currentStep,
      },
    })),

  setTotalProgress: (total) =>
    set((state) => ({
      generationProgress: { ...state.generationProgress, total },
    })),

  setShowWorkspace: (show) => set({ showWorkspace: show }),
  setShow3DViewport: (show) => set({ show3DViewport: show }),

  reset: () =>
    set({
      pillar: null,
      idea: null,
      requirements: null,
      agentPhase: 'idle',
      generationProgress: initialProgress,
    }),
}));

