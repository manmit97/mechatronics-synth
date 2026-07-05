'use client';

import { create } from 'zustand';

interface ConceptLibraryStoreState {
  isOpen: boolean;
  toggleLibrary: () => void;
  openLibrary: () => void;
  closeLibrary: () => void;
}

export const useConceptLibraryStore = create<ConceptLibraryStoreState>((set) => ({
  isOpen: false,
  toggleLibrary: () => set((state) => ({ isOpen: !state.isOpen })),
  openLibrary: () => set({ isOpen: true }),
  closeLibrary: () => set({ isOpen: false }),
}));
