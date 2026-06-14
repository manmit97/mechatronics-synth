// ─── Simulation Types ───────────────────────────────────────────────────────

export type TerrainPreset = 'flat' | 'ramp' | 'obstacle_course' | 'rough' | 'stairs';

export interface SimParams {
  gravity: [number, number, number];
  timeScale: number;
  terrain: TerrainPreset;
  duration: number; // seconds
}

export interface SimulationResult {
  stable: boolean;
  maxInclineDegrees: number;
  topSpeedMs: number;
  failureMode?: string;
  recommendations: string[];
  metrics: Record<string, number>;
}
