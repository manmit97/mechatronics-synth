// ─── Design Graph Types ─────────────────────────────────────────────────────

import type { PartCategory } from './parts';

export type PartDomain = 'mechanical' | 'electrical' | 'software' | 'structural';

export type EdgeType =
  | 'mounts_on'
  | 'powered_by'
  | 'driven_by'
  | 'controlled_by'
  | 'fastened_with'
  | 'communicates_with'
  | 'senses_for';

export interface GraphNode {
  partId: string;
  category: PartCategory;
  domain: PartDomain;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: EdgeType;
  constraint?: string;
  bidirectional?: boolean;
}

export interface DesignGraph {
  nodes: GraphNode[];
  edges: DependencyEdge[];
}
