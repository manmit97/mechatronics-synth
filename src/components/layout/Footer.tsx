'use client';

import { Cpu } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]">
      <div className="max-w-[1800px] mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Cpu className="w-4 h-4 text-[var(--color-accent-cyan)]" />
          <span>MechatronicsSynth — AI-Powered Mechatronics Design</span>
        </div>
        <div className="text-xs text-[var(--color-text-muted)]">
          Mechanics × Electronics × Software — Unified by AI
        </div>
      </div>
    </footer>
  );
}
