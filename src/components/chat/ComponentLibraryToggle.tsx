'use client';

import { Package } from 'lucide-react';
import { useComponentLibraryStore } from '@/stores/component-library-store';
import { playClickSound } from '@/utils/audio';

// ─── Component Library Toggle ───────────────────────────────────────────────
// Hardware-styled button in the chat panel header to open/close the library.

export function ComponentLibraryToggle() {
  const { isOpen, toggleLibrary } = useComponentLibraryStore();

  return (
    <button
      onClick={() => {
        playClickSound(true);
        toggleLibrary();
      }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold tracking-wide transition-all ${
        isOpen
          ? 'bg-[#facc15]/20 text-[#facc15] border border-[#facc15]/40'
          : 'text-[#9ca3af] hover:text-[#f3f4f6] border border-[#374151] hover:border-[#4b5563]'
      }`}
      title="Open Parts Catalog"
    >
      <Package className="w-3 h-3" />
      PARTS CATALOGUE
      {!isOpen && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#4ade80]" />
        </span>
      )}
    </button>
  );
}
