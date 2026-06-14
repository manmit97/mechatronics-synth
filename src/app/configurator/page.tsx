'use client';

import dynamic from 'next/dynamic';
import { useConfiguratorStore } from '@/stores/configurator-store';
import { useProjectStore } from '@/stores/project-store';
import { useBOMStore } from '@/stores/bom-store';
import { useDesignHistoryStore } from '@/stores/design-history-store';
import { Box, Palette, Ruler, Trash2, RotateCcw, Layers, DollarSign, Weight, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { VersionHistoryPanel } from '@/components/configurator/VersionHistory';

const Scene3D = dynamic(
  () => import('@/components/three/Scene3D').then((m) => m.Scene3D),
  { ssr: false, loading: () => <div className="w-full h-full bg-[var(--color-surface-primary)] flex items-center justify-center"><span className="text-sm text-[var(--color-text-muted)]">Loading 3D...</span></div> }
);

function PartCard({ part, isPlaced, onAdd }: {
  part: import('@/types/parts').PartDefinition;
  isPlaced: boolean;
  onAdd: () => void;
}) {
  const sourceColor = part.sourceType === 'manufactured' ? 'var(--color-manufactured)' : 'var(--color-sourced)';

  return (
    <div className="group p-3 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-medium)] transition-all cursor-pointer" onClick={onAdd}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">{part.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border" style={{ borderColor: sourceColor, color: sourceColor }}>
              {part.sourceType === 'manufactured' ? '🏭' : '📦'} {part.sourceType}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">{part.category}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-mono font-medium text-[var(--color-accent-lime)]">${part.unitCost.toFixed(2)}</div>
          <div className="text-[10px] text-[var(--color-text-muted)]">{part.weight}g</div>
        </div>
      </div>
    </div>
  );
}

function ConfigSidebar() {
  const catalog = useConfiguratorStore((s) => s.catalog);
  const addPart = useConfiguratorStore((s) => s.addPart);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const categories = [...new Set(catalog.map((p) => p.category))];

  const categoryLabels: Record<string, string> = {
    chassis: '🏗️ Chassis',
    actuator: '⚙️ Actuators',
    sensor: '📡 Sensors',
    controller: '🧠 Controllers',
    power: '🔋 Power',
    structural: '🔩 Structural',
    fastener: '🔧 Fasteners',
    wheel: '🛞 Wheels',
    transmission: '⛓️ Transmission',
    end_effector: '🤏 End Effectors',
    wiring: '🔌 Wiring',
  };

  return (
    <div className="w-72 shrink-0 border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)] flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
          <Layers className="w-4 h-4 text-[var(--color-accent-cyan)]" />
          Parts Catalog
        </div>
        <div className="text-xs text-[var(--color-text-muted)] mt-1">{catalog.length} AI-generated components</div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {categories.map((cat) => {
          const parts = catalog.filter((p) => p.category === cat);
          const isExpanded = expandedCategory === cat || expandedCategory === null;
          return (
            <div key={cat}>
              <button
                onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <span>{categoryLabels[cat] || cat} ({parts.length})</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
              {isExpanded && (
                <div className="space-y-1.5 mt-1">
                  {parts.map((part) => (
                    <PartCard key={part.id} part={part} isPlaced={false} onAdd={() => addPart(part.id)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PartInspector() {
  const selectedId = useConfiguratorStore((s) => s.selectedPartInstanceId);
  const config = useConfiguratorStore((s) => s.config);
  const catalog = useConfiguratorStore((s) => s.catalog);
  const removePart = useConfiguratorStore((s) => s.removePart);
  const updatePartColor = useConfiguratorStore((s) => s.updatePartColor);

  if (!selectedId || !config) {
    return (
      <div className="w-72 shrink-0 border-l border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)] flex items-center justify-center">
        <div className="text-center px-6">
          <Box className="w-8 h-8 mx-auto text-[var(--color-text-muted)] mb-2" />
          <p className="text-sm text-[var(--color-text-muted)]">Select a part in the 3D view to inspect</p>
        </div>
      </div>
    );
  }

  const placed = config.parts.find((p) => p.instanceId === selectedId);
  const partDef = placed ? catalog.find((p) => p.id === placed.partId) : null;
  if (!placed || !partDef) return null;

  const colors = ['#b0b8c4', '#2a2a2a', '#1a1a2e', '#ff6f00', '#1b5e20', '#e65100', '#0d47a1', '#4a148c', '#b71c1c', '#ffffff'];

  return (
    <div className="w-72 shrink-0 border-l border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)] flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">{partDef.name}</div>
        <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{partDef.category} • {partDef.sourceType}</div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Specs */}
        <div>
          <div className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5" /> Specifications
          </div>
          <div className="space-y-1">
            {Object.entries(partDef.specs).map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-[var(--color-text-muted)]">{key}</span>
                <span className="font-mono text-[var(--color-text-primary)]">{value}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs">
              <span className="text-[var(--color-text-muted)]">Dimensions</span>
              <span className="font-mono text-[var(--color-text-primary)]">{partDef.dimensions.x}×{partDef.dimensions.y}×{partDef.dimensions.z}mm</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--color-text-muted)]">Weight</span>
              <span className="font-mono text-[var(--color-text-primary)]">{partDef.weight}g</span>
            </div>
          </div>
        </div>

        {/* Color picker */}
        <div>
          <div className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" /> Color
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => updatePartColor(selectedId, c)}
                className={`w-7 h-7 rounded-lg border-2 transition-all ${placed.color === c ? 'border-[var(--color-accent-cyan)] scale-110' : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-medium)]'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Cost */}
        <div>
          <div className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" /> Cost & Sourcing
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Unit Cost</span>
              <span className="font-mono text-[var(--color-accent-lime)]">${partDef.unitCost.toFixed(2)}</span>
            </div>
            {partDef.supplierName && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Supplier</span>
                <span className="text-[var(--color-text-primary)]">{partDef.supplierName}</span>
              </div>
            )}
            {partDef.sourcingUrl && (
              <a href={partDef.sourcingUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent-cyan)] hover:underline inline-block mt-1">
                View on {partDef.supplierName || 'supplier'} →
              </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-[var(--color-border-subtle)]">
          <button
            onClick={() => removePart(selectedId)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-accent-rose)] bg-[var(--color-surface-elevated)] hover:bg-red-950/30 border border-[var(--color-border-subtle)] transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Remove Part
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4 px-8">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-center">
          <Box className="w-10 h-10 text-[var(--color-text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">No Design Yet</h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          Head to the landing page and describe your mechatronic system idea to the AI agent. Your design will appear here once generated.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] text-white text-sm font-medium hover:shadow-[0_0_20px_var(--color-accent-cyan-glow)] transition-shadow">
          <RotateCcw className="w-4 h-4" />
          Start New Design
        </Link>
      </div>
    </div>
  );
}

export default function ConfiguratorPage() {
  const catalog = useConfiguratorStore((s) => s.catalog);

  if (catalog.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex-1 flex min-h-0 h-[calc(100vh-57px)]">
      <ConfigSidebar />
      <div className="flex-1 relative">
        <Scene3D />
        <VersionHistoryPanel />
      </div>
      <PartInspector />
    </div>
  );
}
