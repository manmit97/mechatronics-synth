'use client';

import { create } from 'zustand';
import type { PartCategory } from '@/types/parts';

export interface PricingInfo {
  supplier: string;
  supplierUrl: string;
  price: number;
  currency: string;
  stockQty?: number;
  moq?: number;
  leadTimeDays?: number;
  inStock: boolean;
}

export interface ComponentEntry {
  id: string;
  name: string;
  category: PartCategory | string;
  description: string;
  specs: Record<string, string>;
  pricing: PricingInfo[];
  datasheetUrl?: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';
  popularity: number;
}

interface ComponentLibraryState {
  isOpen: boolean;
  searchQuery: string;
  activeCategory: PartCategory | 'all';
  components: ComponentEntry[];
  isSearching: boolean;
  favorites: string[];
  expandedCardId: string | null;

  toggleLibrary: () => void;
  openLibrary: () => void;
  closeLibrary: () => void;
  setSearchQuery: (q: string) => void;
  setCategory: (cat: PartCategory | 'all') => void;
  setComponents: (c: ComponentEntry[]) => void;
  setSearching: (s: boolean) => void;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setExpandedCard: (id: string | null) => void;
}

// Load favorites from localStorage
function loadFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('synth_component_favorites');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favs: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('synth_component_favorites', JSON.stringify(favs));
  } catch {
    // Fail silently
  }
}

export const useComponentLibraryStore = create<ComponentLibraryState>((set, get) => ({
  isOpen: false,
  searchQuery: '',
  activeCategory: 'all',
  components: [],
  isSearching: false,
  favorites: loadFavorites(),
  expandedCardId: null,

  toggleLibrary: () => set((s) => ({ isOpen: !s.isOpen })),
  openLibrary: () => set({ isOpen: true }),
  closeLibrary: () => set({ isOpen: false, expandedCardId: null }),

  setSearchQuery: (q) => set({ searchQuery: q }),
  setCategory: (cat) => set({ activeCategory: cat, expandedCardId: null }),
  setComponents: (c) => set({ components: c }),
  setSearching: (s) => set({ isSearching: s }),

  addFavorite: (id) => {
    const favs = [...get().favorites, id];
    saveFavorites(favs);
    set({ favorites: favs });
  },

  removeFavorite: (id) => {
    const favs = get().favorites.filter((f) => f !== id);
    saveFavorites(favs);
    set({ favorites: favs });
  },

  toggleFavorite: (id) => {
    const { favorites } = get();
    if (favorites.includes(id)) {
      get().removeFavorite(id);
    } else {
      get().addFavorite(id);
    }
  },

  setExpandedCard: (id) => set({ expandedCardId: id }),
}));
