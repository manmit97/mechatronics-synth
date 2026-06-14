'use client';

import { create } from 'zustand';
import type { TerrainPreset, SimulationResult } from '@/types/simulation';

interface SimulationState {
  isRunning: boolean;
  gravity: [number, number, number];
  timeScale: number;
  terrain: TerrainPreset;
  debugMode: boolean;
  lastResult: SimulationResult | null;

  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  setGravity: (g: [number, number, number]) => void;
  setTimeScale: (scale: number) => void;
  setTerrain: (terrain: TerrainPreset) => void;
  toggleDebug: () => void;
  setResult: (result: SimulationResult) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  isRunning: false,
  gravity: [0, -9.81, 0],
  timeScale: 1,
  terrain: 'flat',
  debugMode: false,
  lastResult: null,

  startSimulation: () => set({ isRunning: true }),
  pauseSimulation: () => set({ isRunning: false }),
  resetSimulation: () => set({ isRunning: false, lastResult: null }),
  setGravity: (g) => set({ gravity: g }),
  setTimeScale: (scale) => set({ timeScale: scale }),
  setTerrain: (terrain) => set({ terrain }),
  toggleDebug: () => set((state) => ({ debugMode: !state.debugMode })),
  setResult: (result) => set({ lastResult: result, isRunning: false }),
}));
