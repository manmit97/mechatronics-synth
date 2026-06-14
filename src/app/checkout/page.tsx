'use client';

import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4 px-8">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-center">
          <ShoppingCart className="w-10 h-10 text-[var(--color-accent-lime)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Checkout & Logistics</h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          Complete order flow with delivery timeline and build tracking. Coming in Phase 3.
        </p>
        <Link href="/configurator" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent-cyan)] hover:border-[var(--color-accent-cyan)] transition-all">
          ← Back to Configurator
        </Link>
      </div>
    </div>
  );
}
