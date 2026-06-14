// ─── Configuration Types ────────────────────────────────────────────────────
// Represents the current state of the user's design in 3D space.

import type { RequirementsSpec } from './project';

export interface PlacedPart {
  instanceId: string;
  partId: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  parentMountPoint?: string;
  parentInstanceId?: string;
}

export interface RobotConfiguration {
  id: string;
  name: string;
  description: string;
  parts: PlacedPart[];
  requirements: RequirementsSpec;
  createdAt: string;
  updatedAt: string;
}
