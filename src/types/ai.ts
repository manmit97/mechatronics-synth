// ─── AI Agent Types ─────────────────────────────────────────────────────────

import type { PartCategory, PartDefinition } from './parts';
import type { SimulationResult } from './simulation';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolInvocations?: ToolInvocation[];
  timestamp: string;
}

export interface ToolInvocation {
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'running' | 'complete' | 'error';
}

export type AgentPhase = 'idle' | 'greeting' | 'gathering' | 'clarifying' | 'generating' | 'complete';

export type PageContext = 'landing' | 'configurator' | 'simulate' | 'bom' | 'assembly' | 'checkout';

export interface AgentContext {
  currentPage: PageContext;
  selectedPartInstanceId?: string;
  selectedPartDefinition?: PartDefinition;

  designSummary: {
    projectName: string;
    totalParts: number;
    totalCost: number;
    totalWeight: number;
    partCategories: Record<string, number>;
  };

  simulationState?: {
    isRunning: boolean;
    terrain: string;
    lastResult?: SimulationResult;
  };

  currentVersion: number;
  totalVersions: number;
  recentChanges: import('./design-history').DesignDiff | null;
}

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: string;
  contexts: PageContext[];
}

export interface GenerationProgress {
  total: number;
  completed: number;
  currentStep: string;
}

export interface CrossDomainImpact {
  trigger: {
    action: string;
    partId: string;
    description: string;
  };

  mechanical: {
    affectedParts: string[];
    structuralChanges: string[];
    weightDelta: number;
  };

  electrical: {
    affectedParts: string[];
    currentDraw: { before: number; after: number };
    driverCompatibility: boolean;
    batteryLifeImpact: string;
  };

  software: {
    controlChanges: string[];
    firmwareUpdate: boolean;
    calibrationRequired: boolean;
  };

  cost: {
    partsCostDelta: number;
    manufacturingDelta: number;
    totalDelta: number;
  };

  risks: {
    level: 'low' | 'medium' | 'high';
    items: string[];
  };
}
