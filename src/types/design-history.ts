// ─── Design History Types ───────────────────────────────────────────────────

import type { RobotConfiguration } from './configuration';
import type { PartDefinition } from './parts';
import type { BOMEntry, CostBreakdown } from './bom';

export type DesignTrigger = 'ai_generation' | 'user_edit' | 'ai_refinement' | 'refinement' | 'simulation_driven' | 'rollback';

export interface DesignDiff {
  partsAdded: { partId: string; name: string }[];
  partsRemoved: { partId: string; name: string }[];
  partsModified: {
    partId: string;
    name: string;
    changes: { field: string; before: string; after: string }[];
  }[];
  costDelta: number;
  weightDelta: number;
  performanceNotes: string[];
}

export interface DesignSnapshot {
  config: RobotConfiguration;
  catalog: PartDefinition[];
  bom: BOMEntry[];
  costBreakdown: CostBreakdown;
}

export interface DesignVersion {
  version: number;
  timestamp: string;
  description: string;
  trigger: DesignTrigger;
  snapshot: DesignSnapshot;
  diff: DesignDiff;
}
