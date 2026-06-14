'use client';

import { create } from 'zustand';
import type { UserIdea, RequirementsSpec } from '@/types/project';
import type { AgentPhase, GenerationProgress } from '@/types/ai';

interface ProjectState {
  idea: UserIdea | null;
  requirements: RequirementsSpec | null;
  agentPhase: AgentPhase;
  generationProgress: GenerationProgress;

  setIdea: (description: string) => void;
  setRequirements: (req: RequirementsSpec) => void;
  setAgentPhase: (phase: AgentPhase) => void;
  updateProgress: (completed: number, currentStep: string) => void;
  setTotalProgress: (total: number) => void;
  reset: () => void;
}

const initialProgress: GenerationProgress = {
  total: 0,
  completed: 0,
  currentStep: '',
};

export const useProjectStore = create<ProjectState>((set) => ({
  idea: null,
  requirements: null,
  agentPhase: 'idle',
  generationProgress: initialProgress,

  setIdea: (description) =>
    set({
      idea: {
        rawDescription: description,
        timestamp: new Date().toISOString(),
      },
      agentPhase: 'gathering',
    }),

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

  reset: () =>
    set({
      idea: null,
      requirements: null,
      agentPhase: 'idle',
      generationProgress: initialProgress,
    }),
}));
