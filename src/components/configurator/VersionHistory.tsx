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
    <div className="absolute top-4 right-4 z-10 font-mono">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="osc-button flex items-center gap-2 px-3 py-2 rounded text-[10px] transition-all shadow-lg"
      >
        <Clock className="w-3.5 h-3.5" />
        <span className="font-bold text-[#facc15]">v{currentVersion}</span>
        <span className="text-[#6b7280]">•</span>
        <span className="text-[#9ca3af]">{versions.length} VERSIONS</span>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#9ca3af]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af]" />}
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="mt-2 w-80 max-h-96 overflow-y-auto rounded bg-[#1e1f22] border border-[#374151] shadow-2xl animate-fade-in relative osc-chassis text-[#f3f4f6]">
          <div className="absolute top-2 left-2"><span className="screw" /></div>
          <div className="absolute top-2 right-2"><span className="screw" /></div>
          
          <div className="px-4 py-3 border-b border-[#374151] pt-6">
            <div className="text-[10px] font-bold text-[#f3f4f6] uppercase tracking-wider">SYSTEM HISTORY LOG</div>
            <div className="text-[9px] text-[#9ca3af] mt-0.5 uppercase tracking-widest">Click to restore a previous state</div>
          </div>

          <div className="divide-y divide-[#374151]">
            {[...versions].reverse().map((version) => {
              const isCurrent = version.version === currentVersion;
              const isDetailExpanded = expandedVersion === version.version;

              return (
                <div key={version.version} className={`${isCurrent ? 'bg-[#60a5fa]/10' : ''}`}>
                  <button
                    onClick={() => setExpandedVersion(isDetailExpanded ? null : version.version)}
                    className="w-full text-left px-4 py-3 hover:bg-[#1a1b1e] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold ${isCurrent ? 'text-[#60a5fa]' : 'text-[#f3f4f6]'}`}>
                          v{version.version}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#60a5fa]/20 text-[#60a5fa] border border-[#60a5fa]/30 uppercase tracking-widest">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-[#9ca3af] uppercase tracking-widest">
                        {triggerLabels[version.trigger] || version.trigger}
                      </span>
                    </div>
                    <div className="text-[9px] text-[#d1d5db] mt-1.5 truncate">
                      {version.description}
                    </div>
                    {version.diff && (
                      <div className="flex items-center gap-3 mt-2">
                        {version.diff.partsAdded.length > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] text-[#4ade80]">
                            <Plus className="w-3 h-3" />{version.diff.partsAdded.length}
                          </span>
                        )}
                        {version.diff.partsRemoved.length > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] text-[#ef4444]">
                            <Minus className="w-3 h-3" />{version.diff.partsRemoved.length}
                          </span>
                        )}
                        {version.diff.partsModified.length > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] text-[#facc15]">
                            <Edit3 className="w-3 h-3" />{version.diff.partsModified.length}
                          </span>
                        )}
                        {version.diff.costDelta !== 0 && (
                          <span className={`text-[9px] font-mono ${version.diff.costDelta > 0 ? 'text-[#ef4444]' : 'text-[#4ade80]'}`}>
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
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-[10px] font-bold bg-[#111] text-[#60a5fa] border border-[#374151] hover:bg-[#1a1b1e] transition-colors border-t-[#60a5fa]"
                        style={{ borderTopWidth: '2px' }}
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        RESTORE THIS STATE
                      </button>
                    </div>
                  )}

                  {isDetailExpanded && isCurrent && (
                    <div className="px-4 pb-3">
                      <div className="text-[9px] text-[#6b7280] uppercase tracking-widest">ACTIVE STATE SELECTED</div>
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
