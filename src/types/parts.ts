// ─── Parts System Types ─────────────────────────────────────────────────────
// All parts are AI-generated from user requirements. No static catalog.

export type PartCategory =
  | 'chassis'
  | 'actuator'
  | 'sensor'
  | 'controller'
  | 'power'
  | 'structural'
  | 'fastener'
  | 'wheel'
  | 'transmission'
  | 'end_effector'
  | 'wiring';

export type ManufacturingMethod =
  | '3d_printed_fdm'
  | '3d_printed_sla'
  | 'cnc_milled'
  | 'laser_cut'
  | 'off_the_shelf'
  | 'pcb_manufactured';

export type SourceType = 'manufactured' | 'sourced';

export type MaterialType = 'metallic' | 'plastic' | 'rubber' | 'pcb' | 'carbon_fiber' | 'wood';

export interface PartAsset {
  type: 'gltf' | 'procedural';
  glbUrl?: string;
  thumbnailUrl?: string;
  proceduralConfig?: ProceduralConfig;
  generationStatus: 'pending' | 'generating' | 'ready' | 'failed';
}

export interface ProceduralConfig {
  baseShape: 'box' | 'cylinder' | 'sphere' | 'custom';
  dimensions: [number, number, number]; // [width, height, depth] in scene units
  features: ProceduralFeature[];
  materialType: MaterialType;
  color?: string;
}

export interface ProceduralFeature {
  type: 'hole' | 'slot' | 'bevel' | 'fillet' | 'boss' | 'rib' | 'shaft';
  position: [number, number, number];
  dimensions: Record<string, number>;
}

export interface MountPoint {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  compatibleCategories: PartCategory[];
}

export interface PartDefinition {
  id: string;
  name: string;
  category: PartCategory;
  sourceType: SourceType;
  manufacturingMethod: ManufacturingMethod;
  description: string;

  // Physical properties
  dimensions: { x: number; y: number; z: number }; // mm
  weight: number; // grams
  material: string;
  color: string; // hex

  // Cost & sourcing
  unitCost: number; // USD
  sourcingUrl?: string;
  supplierName?: string;
  supplierSKU?: string;
  leadTimeDays: number;

  // Specs
  specs: Record<string, string>;

  // 3D Asset
  asset: PartAsset;

  // Assembly
  mountPoints: MountPoint[];
  assemblyNotes?: string;
}
