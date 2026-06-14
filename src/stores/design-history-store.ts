'use client';

import { create } from 'zustand';
import type { DesignVersion, DesignDiff, DesignSnapshot } from '@/types/design-history';
import type { RobotConfiguration } from '@/types/configuration';
import type { PartDefinition } from '@/types/parts';
import type { BOMEntry, CostBreakdown } from '@/types/bom';

interface DesignHistoryState {
  versions: DesignVersion[];
  currentVersion: number;

  createSnapshot: (
    description: string,
    trigger: DesignVersion['trigger'],
    snapshot: DesignSnapshot
  ) => void;
  restoreVersion: (version: number) => DesignSnapshot | null;
  getCurrentDiff: () => DesignDiff | null;
  reset: () => void;
}

function computeDiff(
  prev: DesignSnapshot | null,
  curr: DesignSnapshot
): DesignDiff {
  if (!prev) {
    return {
      partsAdded: curr.catalog.map((p) => ({ partId: p.id, name: p.name })),
      partsRemoved: [],
      partsModified: [],
      costDelta: curr.costBreakdown.grandTotal,
      weightDelta: curr.catalog.reduce((sum, p) => sum + p.weight, 0),
      performanceNotes: ['Initial design generated'],
    };
  }

  const prevIds = new Set(prev.catalog.map((p) => p.id));
  const currIds = new Set(curr.catalog.map((p) => p.id));

  const added = curr.catalog
    .filter((p) => !prevIds.has(p.id))
    .map((p) => ({ partId: p.id, name: p.name }));

  const removed = prev.catalog
    .filter((p) => !currIds.has(p.id))
    .map((p) => ({ partId: p.id, name: p.name }));

  const modified = curr.catalog
    .filter((p) => prevIds.has(p.id))
    .map((currPart) => {
      const prevPart = prev.catalog.find((pp) => pp.id === currPart.id)!;
      const changes: { field: string; before: string; after: string }[] = [];
      if (prevPart.unitCost !== currPart.unitCost) {
        changes.push({ field: 'unitCost', before: `$${prevPart.unitCost}`, after: `$${currPart.unitCost}` });
      }
      if (prevPart.weight !== currPart.weight) {
        changes.push({ field: 'weight', before: `${prevPart.weight}g`, after: `${currPart.weight}g` });
      }
      if (prevPart.name !== currPart.name) {
        changes.push({ field: 'name', before: prevPart.name, after: currPart.name });
      }
      return changes.length > 0
        ? { partId: currPart.id, name: currPart.name, changes }
        : null;
    })
    .filter(Boolean) as DesignDiff['partsModified'];

  return {
    partsAdded: added,
    partsRemoved: removed,
    partsModified: modified,
    costDelta: curr.costBreakdown.grandTotal - prev.costBreakdown.grandTotal,
    weightDelta:
      curr.catalog.reduce((s, p) => s + p.weight, 0) -
      prev.catalog.reduce((s, p) => s + p.weight, 0),
    performanceNotes: [],
  };
}

export const useDesignHistoryStore = create<DesignHistoryState>((set, get) => ({
  versions: [],
  currentVersion: 0,

  createSnapshot: (description, trigger, snapshot) => {
    const state = get();
    const prevSnapshot =
      state.versions.length > 0
        ? state.versions[state.versions.length - 1].snapshot
        : null;
    const diff = computeDiff(prevSnapshot, snapshot);
    const version = state.versions.length + 1;

    set({
      versions: [
        ...state.versions,
        {
          version,
          timestamp: new Date().toISOString(),
          description,
          trigger,
          snapshot,
          diff,
        },
      ],
      currentVersion: version,
    });
  },

  restoreVersion: (version) => {
    const state = get();
    const target = state.versions.find((v) => v.version === version);
    if (!target) return null;
    set({ currentVersion: version });
    return target.snapshot;
  },

  getCurrentDiff: () => {
    const state = get();
    if (state.versions.length === 0) return null;
    return state.versions[state.versions.length - 1].diff;
  },

  reset: () => set({ versions: [], currentVersion: 0 }),
}));
