'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useConfiguratorStore } from '@/stores/configurator-store';
import { Box, Palette, Ruler, Trash2, RotateCcw, Layers, DollarSign, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { VersionHistoryPanel } from '@/components/configurator/VersionHistory';
import { playClickSound } from '@/utils/audio';

const Scene3D = dynamic(
  () => import('@/components/three/Scene3D').then((m) => m.Scene3D),
  { ssr: false, loading: () => (
    <div className="w-full h-full bg-[#000] flex items-center justify-center">
      <span className="text-xs font-mono text-[#facc15] animate-pulse">ACQUIRING 3D SIGNAL...</span>
    </div>
  ) }
);

function PartCard({ part, onAdd }: {
  part: import('@/types/parts').PartDefinition;
  onAdd: () => void;
}) {
  const sourceColor = part.sourceType === 'manufactured' ? '#60a5fa' : '#4ade80';

  return (
    <div 
      className="group p-2.5 rounded border border-[#374151] bg-[#1a1b1e] hover:border-[#60a5fa] hover:shadow-[0_2px_8px_rgba(96,165,250,0.15)] transition-all cursor-pointer relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
      onClick={() => {
        playClickSound(true);
        onAdd();
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-[#f3f4f6] truncate font-mono uppercase tracking-wider">{part.name}</div>
          <div className="flex items-center gap-2 mt-1 font-mono text-[9px]">
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-[#111] border border-[#374151]" style={{ color: sourceColor }}>
              {part.sourceType === 'manufactured' ? '🏭' : '📦'} {part.sourceType.toUpperCase()}
            </span>
            <span className="text-[#9ca3af]">{part.category.toUpperCase()}</span>
          </div>
        </div>
        <div className="text-right shrink-0 font-mono">
          <div className="text-xs font-bold text-[#60a5fa]">${part.unitCost.toFixed(2)}</div>
          <div className="text-[8px] text-[#6b7280]">{part.weight}G</div>
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
    chassis: '🏗️ CHASSIS',
    actuator: '⚙️ ACTUATORS',
    sensor: '📡 SENSORS',
    controller: '🧠 CONTROLLERS',
    power: '🔋 POWER',
    structural: '🔩 STRUCTURAL',
    fastener: '🔧 FASTENERS',
    wheel: '🛞 WHEELS',
    transmission: '⛓️ TRANSMISSION',
    end_effector: '🤏 END EFFECTORS',
    wiring: '🔌 WIRING',
  };

  const handleCategoryToggle = (cat: string) => {
    playClickSound(true);
    setExpandedCategory(expandedCategory === cat ? null : cat);
  };

  return (
    <div className="w-72 shrink-0 border-r border-[#374151] bg-[#1e1f22] flex flex-col h-full overflow-hidden relative shadow-[2px_0_10px_rgba(0,0,0,0.5)] z-10">
      
      {/* Structural metal panel screws */}
      <div className="absolute top-2 left-2"><span className="screw" /></div>
      <div className="absolute top-2 right-2"><span className="screw" /></div>

      <div className="px-4 py-3.5 border-b border-[#374151] pt-6 bg-[#1a1b1e]">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#f3f4f6] tracking-wider uppercase">
          <Layers className="w-4 h-4 text-[#60a5fa]" />
          PARTS CATALOGUE
        </div>
        <div className="text-[9px] font-mono text-[#9ca3af] mt-1 uppercase tracking-widest">
          {catalog.length} SIGNAL NODES LOADED
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {categories.map((cat) => {
          const parts = catalog.filter((p) => p.category === cat);
          const isExpanded = expandedCategory === cat || expandedCategory === null;
          return (
            <div key={cat} className="border-b border-[#374151] pb-1.5">
              <button
                onClick={() => handleCategoryToggle(cat)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-mono font-bold text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"
              >
                <span>{categoryLabels[cat] || cat.toUpperCase()} ({parts.length})</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
              {isExpanded && (
                <div className="space-y-1.5 mt-1.5 px-1.5">
                  {parts.map((part) => (
                    <PartCard key={part.id} part={part} onAdd={() => addPart(part.id)} />
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

  const [tweakDial, setTweakDial] = useState(0);

  const handleDialClick = () => {
    playClickSound(true);
    setTweakDial((d) => (d + 60) % 360);
  };

  if (!selectedId || !config) {
    return (
      <div className="w-72 shrink-0 border-l border-[#374151] bg-[#1e1f22] flex items-center justify-center relative shadow-[-2px_0_10px_rgba(0,0,0,0.5)] z-10">
        <div className="absolute top-2 left-2"><span className="screw" /></div>
        <div className="absolute top-2 right-2"><span className="screw" /></div>
        <div className="text-center px-6">
          <Box className="w-8 h-8 mx-auto text-[#6b7280] mb-2 animate-float" />
          <p className="text-[10px] font-mono font-bold text-[#9ca3af] uppercase tracking-widest">NO SIGNAL DETECTED</p>
          <p className="text-[9px] font-mono text-[#6b7280] mt-1 uppercase max-w-[160px] mx-auto leading-relaxed">
            TAP GRID NODE TO INSPECT SIGNAL VALUES
          </p>
        </div>
      </div>
    );
  }

  const placed = config.parts.find((p) => p.instanceId === selectedId);
  const partDef = placed ? catalog.find((p) => p.id === placed.partId) : null;
  if (!placed || !partDef) return null;

  const colors = ['#b0b8c4', '#2a2a2a', '#1a1a2e', '#ff6f00', '#1b5e20', '#e65100', '#0d47a1', '#4a148c', '#b71c1c', '#ffffff'];

  return (
    <div className="w-72 shrink-0 border-l border-[#374151] bg-[#1e1f22] flex flex-col h-full overflow-hidden relative shadow-[-2px_0_10px_rgba(0,0,0,0.5)] z-10">
      
      {/* Hardware metal panels screws */}
      <div className="absolute top-2 left-2"><span className="screw" /></div>
      <div className="absolute top-2 right-2"><span className="screw" /></div>

      <div className="px-4 py-3.5 border-b border-[#374151] pt-6 bg-[#1a1b1e]">
        <div className="text-xs font-mono font-bold text-[#f3f4f6] truncate uppercase tracking-wider">{partDef.name}</div>
        <div className="text-[8px] font-mono text-[#9ca3af] mt-0.5 uppercase tracking-widest">
          {partDef.category + " // " + partDef.sourceType}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        
        {/* Specs - Styled as an LCD Screen on a multimeter */}
        <div>
          <div className="text-[9px] font-mono font-bold text-[#9ca3af] mb-2 flex items-center gap-1.5 uppercase tracking-widest">
            <Ruler className="w-3.5 h-3.5 text-[#facc15]" /> READOUT DIAGNOSTICS
          </div>
          
          {/* LCD Screen container */}
          <div 
            className="rounded border-2 border-[#111] p-3 text-[10px] font-mono leading-normal shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] text-[#facc15]"
            style={{
              backgroundColor: '#1a1b1e',
              textShadow: '0 0 4px rgba(250,204,21,0.4)',
            }}
          >
            <div className="space-y-1">
              {Object.entries(partDef.specs).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="opacity-75 uppercase text-[9px] text-[#6b7280]">{key}</span>
                  <span className="font-bold">{value}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-[#374151] pt-1 mt-1">
                <span className="opacity-75 text-[9px] text-[#6b7280]">DIMENSIONS</span>
                <span className="font-bold">{partDef.dimensions.x}×{partDef.dimensions.y}×{partDef.dimensions.z}MM</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-75 text-[9px] text-[#6b7280]">WEIGHT</span>
                <span className="font-bold">{partDef.weight}G</span>
              </div>
            </div>
          </div>
        </div>

        {/* Color picker - Styled as physical push buttons */}
        <div>
          <div className="text-[9px] font-mono font-bold text-[#9ca3af] mb-2 flex items-center gap-1.5 uppercase tracking-widest">
            <Palette className="w-3.5 h-3.5 text-[#60a5fa]" /> COLOR SCHEMATIC
          </div>
          <div className="flex flex-wrap gap-2 bg-[#1a1b1e] p-2 border border-[#374151] rounded shadow-inner">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => {
                  playClickSound(true);
                  updatePartColor(selectedId, c);
                }}
                className={`w-7 h-7 rounded border transition-all relative ${placed.color === c ? 'border-[#f3f4f6] scale-110 shadow-[0_0_8px_rgba(255,255,255,0.4)] translate-y-0.5' : 'border-[#374151] hover:scale-105 hover:border-[#6b7280]'}`}
                style={{ 
                  backgroundColor: c,
                  boxShadow: placed.color === c ? 'inset 0 2px 4px rgba(0,0,0,0.6)' : '0 2px 3px rgba(0,0,0,0.4)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Cost & Sourcing readout */}
        <div>
          <div className="text-[9px] font-mono font-bold text-[#9ca3af] mb-2 flex items-center gap-1.5 uppercase tracking-widest">
            <DollarSign className="w-3.5 h-3.5 text-[#4ade80]" /> SOURCING LOGISTICS
          </div>
          <div className="space-y-1.5 text-[10px] font-mono bg-[#111] p-2.5 border border-[#374151] rounded shadow-inner">
            <div className="flex justify-between border-b border-[#374151] pb-1">
              <span className="text-[#6b7280]">UNIT COST</span>
              <span className="font-bold text-[#4ade80]">${partDef.unitCost.toFixed(2)}</span>
            </div>
            {partDef.supplierName && (
              <div className="flex justify-between mt-1">
                <span className="text-[#6b7280]">SUPPLIER</span>
                <span className="font-bold text-[#f3f4f6]">{partDef.supplierName.toUpperCase()}</span>
            </div>
            )}
            {partDef.sourcingUrl && (
              <a 
                href={partDef.sourcingUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={() => playClickSound(true)}
                className="osc-button px-2.5 py-1 text-[9px] flex items-center gap-1 mt-2 w-fit bg-[#1e1f22] text-[#f3f4f6]"
              >
                ACCESS SOURCE FEED →
              </a>
            )}
          </div>
        </div>

        {/* Decorative Rotary Dial inside inspector */}
        <div className="border-t border-[#374151] pt-3 flex items-center gap-3 select-none">
          <div 
            className="osc-knob osc-knob-sm transition-transform duration-200"
            style={{ transform: `rotate(${tweakDial}deg)` }}
            onClick={handleDialClick}
          >
            <div className="osc-knob-indicator" />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-mono font-bold text-[#9ca3af] tracking-widest leading-none">SIGNAL ADJ</span>
            <span className="text-[7px] font-mono text-[#60a5fa] mt-0.5 leading-none">{tweakDial}°</span>
          </div>
        </div>

        {/* Actions - Bypass / Remove Part button */}
        <div className="pt-2 border-t border-[#374151]">
          <button
            onClick={() => {
              playClickSound(false);
              removePart(selectedId);
            }}
            className="w-full osc-button py-2 text-[10px] flex items-center justify-center gap-2 text-[#ef4444]"
            style={{ borderTopColor: '#ef4444' }}
          >
            <Trash2 className="w-3.5 h-3.5" /> BYPASS GRID NODE
          </button>
        </div>

      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#121212] relative">
      <div className="text-center space-y-4 px-8 py-10 bg-[#1e1f22] border border-[#374151] rounded shadow-xl max-w-md relative osc-chassis">
        <div className="absolute top-2 left-2"><span className="screw" /></div>
        <div className="absolute top-2 right-2"><span className="screw" /></div>
        <div className="absolute bottom-2 left-2"><span className="screw" /></div>
        <div className="absolute bottom-2 right-2"><span className="screw" /></div>

        <div className="w-16 h-16 mx-auto rounded bg-[#111] border border-[#374151] flex items-center justify-center shadow-inner">
          <Box className="w-8 h-8 text-[#facc15] animate-pulse-glow" />
        </div>
        <h2 className="text-md font-bold tracking-tight text-[#f3f4f6] font-sans uppercase">NO SIGNAL DETECTED</h2>
        <p className="text-xs font-mono text-[#9ca3af] leading-relaxed max-w-sm uppercase">
          Describe your compiler requirements to the active terminal. Systems schematic will generate coordinates here.
        </p>
        <Link 
          href="/" 
          onClick={() => playClickSound(true)}
          className="osc-button px-4 py-2 flex items-center justify-center gap-2 mx-auto w-fit text-[#60a5fa]"
          style={{ borderTopColor: '#60a5fa' }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          ACTIVATE MAIN BOARD
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
    <div className="flex-1 flex min-h-0 h-[calc(100vh-57px)] relative bg-[#121212]">
      <ConfigSidebar />
      <div className="flex-1 relative border-x border-[#111]">
        <Scene3D />
        <VersionHistoryPanel />
      </div>
      <PartInspector />
    </div>
  );
}
