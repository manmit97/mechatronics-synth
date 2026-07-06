'use client';

import { Library } from 'lucide-react';
import { useConceptLibraryStore } from '@/stores/concept-library-store';
import { useComponentLibraryStore } from '@/stores/component-library-store';
import { playClickSound } from '@/utils/audio';

export function ConceptLibraryToggle() {
  const { isOpen, toggleLibrary } = useConceptLibraryStore();

  return (
    <button
      onClick={() => {
        playClickSound(true);
        if (!isOpen) {
          useComponentLibraryStore.getState().closeLibrary();
        }
        toggleLibrary();
      }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold tracking-wide transition-all ${
        isOpen
          ? 'bg-[#60a5fa]/20 text-[#60a5fa] border border-[#60a5fa]/40'
          : 'text-[#9ca3af] hover:text-[#f3f4f6] border border-[#374151] hover:border-[#4b5563]'
      }`}
      title="Open Concepts Catalogue"
    >
      <Library className="w-3 h-3" />
      CONCEPTS CATALOGUE
      {!isOpen && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#60a5fa] opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#60a5fa]" />
        </span>
      )}
    </button>
  );
}
