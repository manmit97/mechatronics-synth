'use client';

import { ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useBOMStore } from '@/stores/bom-store';

export default function BOMPage() {
  const { entries, costBreakdown } = useBOMStore();

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 px-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-center">
            <ClipboardList className="w-10 h-10 text-[var(--color-accent-amber)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Bill of Materials</h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-md">
            Generate a design first, then view the full BOM with costs and sourcing.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent-cyan)] hover:border-[var(--color-accent-cyan)] transition-all">
            ← Start a Design
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-[var(--color-accent-amber)]" />
            Bill of Materials
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{entries.length} components • ${costBreakdown.grandTotal.toFixed(2)} total</p>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Manufactured', value: costBreakdown.manufacturedPartsTotal, color: 'var(--color-manufactured)' },
          { label: 'Sourced', value: costBreakdown.sourcedPartsTotal, color: 'var(--color-sourced)' },
          { label: 'Labor', value: costBreakdown.assemblyLabor, color: 'var(--color-accent-violet)' },
          { label: 'Grand Total', value: costBreakdown.grandTotal, color: 'var(--color-accent-cyan)' },
        ].map((item) => (
          <div key={item.label} className="glass-panel p-4">
            <div className="text-xs text-[var(--color-text-muted)]">{item.label}</div>
            <div className="text-xl font-mono font-bold mt-1" style={{ color: item.color }}>${item.value.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">Part</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">Source</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">Qty</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">Unit</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">Total</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.partId} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)] transition-colors">
                <td className="px-4 py-3 text-[var(--color-text-primary)]">{entry.partName}</td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">{entry.category}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${entry.sourceType === 'manufactured' ? 'border-[var(--color-manufactured)] text-[var(--color-manufactured)]' : 'border-[var(--color-sourced)] text-[var(--color-sourced)]'}`}>
                    {entry.sourceType}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-[var(--color-text-primary)]">{entry.quantity}</td>
                <td className="px-4 py-3 text-right font-mono text-[var(--color-text-secondary)]">${entry.unitCost.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-mono text-[var(--color-accent-lime)]">${entry.totalCost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
