'use client';

import { create } from 'zustand';
import type { DesignGraph, DependencyEdge, GraphNode, PartDomain } from '@/types/design-graph';
import type { PartCategory } from '@/types/parts';

interface DesignGraphState {
  graph: DesignGraph;

  addNode: (partId: string, category: PartCategory, domain: PartDomain) => void;
  addEdge: (edge: DependencyEdge) => void;
  removeNode: (partId: string) => void;
  clearGraph: () => void;

  // Queries
  getDependents: (partId: string) => string[];
  getDependencies: (partId: string) => string[];
  getCascadeImpact: (partId: string) => string[];
  getPartsByDomain: (domain: PartDomain) => string[];
}

export const useDesignGraphStore = create<DesignGraphState>((set, get) => ({
  graph: { nodes: [], edges: [] },

  addNode: (partId, category, domain) =>
    set((state) => ({
      graph: {
        ...state.graph,
        nodes: [...state.graph.nodes, { partId, category, domain }],
      },
    })),

  addEdge: (edge) =>
    set((state) => ({
      graph: {
        ...state.graph,
        edges: [...state.graph.edges, edge],
      },
    })),

  removeNode: (partId) =>
    set((state) => ({
      graph: {
        nodes: state.graph.nodes.filter((n) => n.partId !== partId),
        edges: state.graph.edges.filter(
          (e) => e.from !== partId && e.to !== partId
        ),
      },
    })),

  clearGraph: () => set({ graph: { nodes: [], edges: [] } }),

  getDependents: (partId) => {
    const { graph } = get();
    return graph.edges
      .filter((e) => e.to === partId || (e.bidirectional && e.from === partId))
      .map((e) => (e.to === partId ? e.from : e.to));
  },

  getDependencies: (partId) => {
    const { graph } = get();
    return graph.edges
      .filter((e) => e.from === partId || (e.bidirectional && e.to === partId))
      .map((e) => (e.from === partId ? e.to : e.from));
  },

  getCascadeImpact: (partId) => {
    const { graph } = get();
    const visited = new Set<string>();
    const queue = [partId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const connected = graph.edges
        .filter((e) => e.from === current || e.to === current)
        .map((e) => (e.from === current ? e.to : e.from));

      for (const next of connected) {
        if (!visited.has(next)) queue.push(next);
      }
    }

    visited.delete(partId);
    return Array.from(visited);
  },

  getPartsByDomain: (domain) => {
    const { graph } = get();
    return graph.nodes.filter((n) => n.domain === domain).map((n) => n.partId);
  },
}));
