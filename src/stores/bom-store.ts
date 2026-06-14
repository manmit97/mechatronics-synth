'use client';

import { create } from 'zustand';
import type { BOMEntry, CostBreakdown } from '@/types/bom';
import type { SourceType, PartCategory } from '@/types/parts';

interface BOMState {
  entries: BOMEntry[];
  costBreakdown: CostBreakdown;

  setEntries: (entries: BOMEntry[]) => void;
  setCostBreakdown: (breakdown: CostBreakdown) => void;
  recalculate: (entries: BOMEntry[]) => void;
  filterBySource: (source: SourceType | 'all') => BOMEntry[];
  filterByCategory: (category: PartCategory | 'all') => BOMEntry[];
  reset: () => void;
}

const emptyCostBreakdown: CostBreakdown = {
  manufacturedPartsTotal: 0,
  sourcedPartsTotal: 0,
  assemblyLabor: 0,
  shippingEstimate: 0,
  subtotal: 0,
  tax: 0,
  grandTotal: 0,
};

export const useBOMStore = create<BOMState>((set, get) => ({
  entries: [],
  costBreakdown: emptyCostBreakdown,

  setEntries: (entries) => set({ entries }),

  setCostBreakdown: (breakdown) => set({ costBreakdown: breakdown }),

  recalculate: (entries) => {
    const manufactured = entries
      .filter((e) => e.sourceType === 'manufactured')
      .reduce((sum, e) => sum + e.totalCost, 0);
    const sourced = entries
      .filter((e) => e.sourceType === 'sourced')
      .reduce((sum, e) => sum + e.totalCost, 0);
    const subtotal = manufactured + sourced;
    const labor = subtotal * 0.15; // 15% assembly labor estimate
    const shipping = 12.99; // flat rate estimate
    const tax = (subtotal + labor) * 0.08; // 8% tax estimate

    set({
      entries,
      costBreakdown: {
        manufacturedPartsTotal: manufactured,
        sourcedPartsTotal: sourced,
        assemblyLabor: Math.round(labor * 100) / 100,
        shippingEstimate: shipping,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        grandTotal: Math.round((subtotal + labor + shipping + tax) * 100) / 100,
      },
    });
  },

  filterBySource: (source) => {
    const { entries } = get();
    return source === 'all' ? entries : entries.filter((e) => e.sourceType === source);
  },

  filterByCategory: (category) => {
    const { entries } = get();
    return category === 'all' ? entries : entries.filter((e) => e.category === category);
  },

  reset: () => set({ entries: [], costBreakdown: emptyCostBreakdown }),
}));
