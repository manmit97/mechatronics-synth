'use client';

import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, ArrowLeft, Plus, Minus, Edit3 } from 'lucide-react';
import { useDesignHistoryStore } from '@/stores/design-history-store';
import { useConfiguratorStore } from '@/stores/configurator-store';
import { useBOMStore } from '@/stores/bom-store';
import { useProjectStore } from '@/stores/project-store';

export function VersionHistoryPanel() {
  const { versions, currentVersion, restoreVersion } = useDesignHistoryStore();
  const { clearCatalog, addMultipleToCatalog, setConfig, initializeConfig, addPart } = useConfiguratorStore();
  const { recalculate } = useBOMStore();
  const requirements = useProjectStore((s) => s.requirements);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  if (versions.length === 0) return null;

  const handleRestore = (version: number) => {
    const snapshot = restoreVersion(version);
    if (!snapshot) return;

    clearCatalog();
    if (requirements) {
      initializeConfig(
        requirements.projectName,
        requirements.description,
        requirements
      );
    }
    addMultipleToCatalog(snapshot.catalog);
    setConfig(snapshot.config);

    const spacing = 0.8;
    snapshot.catalog.forEach((part, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      addPart(part.id, [(col - 1.5) * spacing, 0, (row - 1) * spacing]);
    });

    recalculate(snapshot.bom);
  };

  const triggerLabels: Record<string, string> = {
    ai_generation: '🤖 AI Generation',
    user_edit: '✏️ Manual Edit',
    refinement: '🔄 Refinement',
    rollback: '⏪ Rollback',
  };

  return (
    <div className="absolute top-4 right-4 z-10">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-surface-elevated)]/90 backdrop-blur-md border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent-cyan)] hover:border-[var(--color-accent-cyan)] transition-all shadow-lg"
      >
        <Clock className="w-4 h-4" />
        <span className="font-mono">v{currentVersion}</span>
        <span className="text-xs text-[var(--color-text-muted)]">•</span>
        <span className="text-xs text-[var(--color-text-muted)]">{versions.length} versions</span>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="mt-2 w-80 max-h-96 overflow-y-auto rounded-xl bg-[var(--color-surface-elevated)]/95 backdrop-blur-md border border-[var(--color-border-subtle)] shadow-2xl animate-fade-in">
          <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
            <div className="text-xs font-medium text-[var(--color-text-primary)]">Design History</div>
            <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Click to restore a previous version</div>
          </div>

          <div className="divide-y divide-[var(--color-border-subtle)]">
            {[...versions].reverse().map((version) => {
              const isCurrent = version.version === currentVersion;
              const isDetailExpanded = expandedVersion === version.version;

              return (
                <div key={version.version} className={`${isCurrent ? 'bg-[var(--color-accent-cyan)]/5' : ''}`}>
                  <button
                    onClick={() => setExpandedVersion(isDetailExpanded ? null : version.version)}
                    className="w-full text-left px-4 py-3 hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono font-medium ${isCurrent ? 'text-[var(--color-accent-cyan)]' : 'text-[var(--color-text-secondary)]'}`}>
                          v{version.version}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent-cyan)]/15 text-[var(--color-accent-cyan)] border border-[var(--color-accent-cyan)]/30">
                            current
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {triggerLabels[version.trigger] || version.trigger}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1 truncate">
                      {version.description}
                    </div>
                    {version.diff && (
                      <div className="flex items-center gap-3 mt-1.5">
                        {version.diff.partsAdded.length > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--color-accent-lime)]">
                            <Plus className="w-3 h-3" />{version.diff.partsAdded.length}
                          </span>
                        )}
                        {version.diff.partsRemoved.length > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--color-accent-rose)]">
                            <Minus className="w-3 h-3" />{version.diff.partsRemoved.length}
                          </span>
                        )}
                        {version.diff.partsModified.length > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--color-accent-amber)]">
                            <Edit3 className="w-3 h-3" />{version.diff.partsModified.length}
                          </span>
                        )}
                        {version.diff.costDelta !== 0 && (
                          <span className={`text-[10px] font-mono ${version.diff.costDelta > 0 ? 'text-[var(--color-accent-rose)]' : 'text-[var(--color-accent-lime)]'}`}>
                            {version.diff.costDelta > 0 ? '+' : ''}${version.diff.costDelta.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </button>

                  {/* Detail + restore */}
                  {isDetailExpanded && !isCurrent && (
                    <div className="px-4 pb-3">
                      <button
                        onClick={() => handleRestore(version.version)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)] border border-[var(--color-accent-cyan)]/30 hover:bg-[var(--color-accent-cyan)]/20 transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Restore this version
                      </button>
                    </div>
                  )}

                  {isDetailExpanded && isCurrent && (
                    <div className="px-4 pb-3">
                      <div className="text-[10px] text-[var(--color-text-muted)] italic">This is the current version</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
