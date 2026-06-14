'use client';

import { create } from 'zustand';
import type { PartDefinition, PartAsset } from '@/types/parts';
import type { PlacedPart, RobotConfiguration } from '@/types/configuration';
import type { RequirementsSpec } from '@/types/project';

interface ConfiguratorState {
  catalog: PartDefinition[];
  config: RobotConfiguration | null;
  selectedPartInstanceId: string | null;

  // Catalog management
  addToCatalog: (part: PartDefinition) => void;
  addMultipleToCatalog: (parts: PartDefinition[]) => void;
  updatePartAsset: (partId: string, asset: PartAsset) => void;
  clearCatalog: () => void;

  // Configuration management
  initializeConfig: (name: string, description: string, req: RequirementsSpec) => void;
  addPart: (partId: string, position?: [number, number, number]) => void;
  removePart: (instanceId: string) => void;
  updatePartTransform: (instanceId: string, updates: Partial<PlacedPart>) => void;
  updatePartColor: (instanceId: string, color: string) => void;
  selectPart: (instanceId: string | null) => void;
  setConfig: (config: RobotConfiguration) => void;
  setPlacedParts: (parts: PlacedPart[]) => void;
}

let instanceCounter = 0;
function generateInstanceId(): string {
  instanceCounter++;
  return `inst_${Date.now()}_${instanceCounter}`;
}

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  catalog: [],
  config: null,
  selectedPartInstanceId: null,

  addToCatalog: (part) =>
    set((state) => ({
      catalog: [...state.catalog, part],
    })),

  addMultipleToCatalog: (parts) =>
    set((state) => ({
      catalog: [...state.catalog, ...parts],
    })),

  updatePartAsset: (partId, asset) =>
    set((state) => ({
      catalog: state.catalog.map((p) =>
        p.id === partId ? { ...p, asset } : p
      ),
    })),

  clearCatalog: () => set({ catalog: [], config: null }),

  initializeConfig: (name, description, req) =>
    set({
      config: {
        id: `config_${Date.now()}`,
        name,
        description,
        parts: [],
        requirements: req,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }),

  addPart: (partId, position = [0, 0, 0]) => {
    const state = get();
    const partDef = state.catalog.find((p) => p.id === partId);
    if (!partDef || !state.config) return;

    const newPart: PlacedPart = {
      instanceId: generateInstanceId(),
      partId,
      position,
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: partDef.color,
    };

    set((state) => ({
      config: state.config
        ? {
            ...state.config,
            parts: [...state.config.parts, newPart],
            updatedAt: new Date().toISOString(),
          }
        : null,
    }));
  },

  removePart: (instanceId) =>
    set((state) => ({
      config: state.config
        ? {
            ...state.config,
            parts: state.config.parts.filter((p) => p.instanceId !== instanceId),
            updatedAt: new Date().toISOString(),
          }
        : null,
      selectedPartInstanceId:
        state.selectedPartInstanceId === instanceId
          ? null
          : state.selectedPartInstanceId,
    })),

  updatePartTransform: (instanceId, updates) =>
    set((state) => ({
      config: state.config
        ? {
            ...state.config,
            parts: state.config.parts.map((p) =>
              p.instanceId === instanceId ? { ...p, ...updates } : p
            ),
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  updatePartColor: (instanceId, color) =>
    set((state) => ({
      config: state.config
        ? {
            ...state.config,
            parts: state.config.parts.map((p) =>
              p.instanceId === instanceId ? { ...p, color } : p
            ),
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  selectPart: (instanceId) => set({ selectedPartInstanceId: instanceId }),

  setConfig: (config) => set({ config }),

  setPlacedParts: (parts) =>
    set((state) => ({
      config: state.config
        ? { ...state.config, parts, updatedAt: new Date().toISOString() }
        : null,
    })),
}));
