'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useConfiguratorStore } from '@/stores/configurator-store';
import { useProjectStore } from '@/stores/project-store';
import {
  Monitor,
  Cog,
  Workflow,
  Printer,
  Layers,
  ArrowRight,
  Activity,
  Cpu,
} from 'lucide-react';
import type { ServicePillar } from '@/types/pillar';
import { PILLAR_CONFIGS, getAllPillars } from '@/types/pillar';
import { playClickSound, playConnectSound } from '@/utils/audio';

const Scene3D = dynamic(
  () => import('@/components/three/Scene3D').then((m) => m.Scene3D),
  { ssr: false, loading: () => <SceneLoadingPlaceholder /> }
);

function SceneLoadingPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#000]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-[#4ade80] border-t-transparent rounded-full animate-spin-slow" />
        <span className="text-xs font-mono text-[#4ade80]">GRID-SYNCING...</span>
      </div>
    </div>
  );
}

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const iconMap = {
  Monitor,
  Cog,
  Workflow,
  Printer,
} as const;

// ─── Oscilloscope Screen Animation ───────────────────────────────────────────

function OscilloscopeTraces({ selectedPillar }: { selectedPillar: ServicePillar | null }) {
  // Generate a scrolling continuous SVG to simulate lively waveforms
  return (
    <div className="absolute inset-0 z-10 pointer-events-none opacity-80 mix-blend-screen overflow-hidden animate-crt">
      {/* Scanner Line */}
      <div className="absolute top-0 bottom-0 w-[3px] bg-[#4ade80] shadow-[0_0_20px_2px_#4ade80] mix-blend-screen animate-scanline z-20" />
      
      <svg className="h-full animate-wave-scroll" style={{ width: '200%' }} viewBox="0 0 200 100" preserveAspectRatio="none">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {getAllPillars().map((pillar, i) => {
          const config = PILLAR_CONFIGS[pillar.id];
          const isActive = selectedPillar === pillar.id || !selectedPillar;
          const opacity = isActive ? 1 : 0.2;
          const yOffset = 25 + (i * 16.6); // 4 traces distributed evenly
          
          // Double-length path so we can infinitely scroll 50% of the SVG width
          let pathD = '';
          if (pillar.id === 'digital') {
            // Square wave repeated
            pathD = `M 0 ${yOffset} L 10 ${yOffset} L 10 ${yOffset-5} L 30 ${yOffset-5} L 30 ${yOffset} L 50 ${yOffset} L 50 ${yOffset+5} L 70 ${yOffset+5} L 70 ${yOffset} L 90 ${yOffset} L 90 ${yOffset-5} L 110 ${yOffset-5} L 110 ${yOffset} L 130 ${yOffset} L 130 ${yOffset+5} L 150 ${yOffset+5} L 150 ${yOffset} L 170 ${yOffset} L 170 ${yOffset-5} L 190 ${yOffset-5} L 190 ${yOffset} L 200 ${yOffset}`;
          } else if (pillar.id === 'physical') {
            // Sine wave approx repeated
            pathD = `M 0 ${yOffset} Q 12.5 ${yOffset-10} 25 ${yOffset} T 50 ${yOffset} T 75 ${yOffset} T 100 ${yOffset} T 125 ${yOffset} T 150 ${yOffset} T 175 ${yOffset} T 200 ${yOffset}`;
          } else if (pillar.id === 'integrated') {
            // Eye diagram approx repeated
            pathD = `M 0 ${yOffset} L 15 ${yOffset-8} L 30 ${yOffset+8} L 45 ${yOffset-4} L 60 ${yOffset+6} L 75 ${yOffset-2} L 90 ${yOffset+5} L 100 ${yOffset} L 115 ${yOffset-8} L 130 ${yOffset+8} L 145 ${yOffset-4} L 160 ${yOffset+6} L 175 ${yOffset-2} L 190 ${yOffset+5} L 200 ${yOffset}`;
          } else {
            // Additive / Noise repeated
            pathD = `M 0 ${yOffset} L 5 ${yOffset-2} L 10 ${yOffset+3} L 15 ${yOffset-1} L 20 ${yOffset+4} L 25 ${yOffset-3} L 30 ${yOffset+2} L 35 ${yOffset-1} L 40 ${yOffset+3} L 45 ${yOffset-2} L 50 ${yOffset+1} L 55 ${yOffset-4} L 60 ${yOffset+2} L 65 ${yOffset-1} L 70 ${yOffset+4} L 75 ${yOffset-2} L 80 ${yOffset+1} L 85 ${yOffset-3} L 90 ${yOffset+2} L 95 ${yOffset-1} L 100 ${yOffset} L 105 ${yOffset-2} L 110 ${yOffset+3} L 115 ${yOffset-1} L 120 ${yOffset+4} L 125 ${yOffset-3} L 130 ${yOffset+2} L 135 ${yOffset-1} L 140 ${yOffset+3} L 145 ${yOffset-2} L 150 ${yOffset+1} L 155 ${yOffset-4} L 160 ${yOffset+2} L 165 ${yOffset-1} L 170 ${yOffset+4} L 175 ${yOffset-2} L 180 ${yOffset+1} L 185 ${yOffset-3} L 190 ${yOffset+2} L 195 ${yOffset-1} L 200 ${yOffset}`;
          }

          return (
            <path
              key={pillar.id}
              d={pathD}
              fill="none"
              stroke={config.accentColor}
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
              filter="url(#glow)"
              opacity={opacity}
              className="transition-opacity duration-300"
            />
          );
        })}
      </svg>
    </div>
  );
}

// ─── Hardware Channel Strip (Replaces PillarCard) ──────────────────────────

function ChannelStrip({
  pillarId,
  index,
  isSelected,
  onSelect,
}: {
  pillarId: ServicePillar;
  index: number;
  isSelected: boolean;
  onSelect: (id: ServicePillar) => void;
}) {
  const config = PILLAR_CONFIGS[pillarId];

  return (
    <div 
      className={`flex flex-col items-center rounded-lg p-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] transition-all duration-300 cursor-pointer group hover:bg-[#25262a]`}
      style={{
        backgroundColor: '#1e1f22',
        borderColor: isSelected ? config.accentColor : '#374151',
        borderWidth: 1,
        borderStyle: 'solid',
        boxShadow: isSelected ? `0 0 20px ${config.accentColor}33, inset 0 2px 4px rgba(0,0,0,0.5)` : undefined
      }}
      onClick={() => onSelect(pillarId)}
    >
      
      {/* Channel Header */}
      <div className="w-full text-center border-b border-[#374151] pb-2 mb-4 group-hover:border-[#4b5563] transition-colors">
        <span className="text-[10px] font-mono font-bold tracking-widest text-[#9ca3af]">
          CH {index + 1}
        </span>
        <h3 className="text-xs font-bold font-sans mt-1 uppercase transition-all duration-300 group-hover:brightness-125" style={{ color: config.accentColor }}>
          {config.name}
        </h3>
      </div>

      {/* BNC Connector */}
      <div className="mb-6 relative transition-transform duration-300 group-hover:scale-105">
        <div className="bnc-connector">
          <div className="bnc-inner">
            <div className="bnc-pin" />
          </div>
        </div>
        {/* Color coded ring */}
        <div 
          className="bnc-ring transition-opacity duration-300" 
          style={{ borderColor: config.accentColor, opacity: isSelected ? 1 : 0.6 }} 
        />
      </div>

      {/* Vertical Scale Knob */}
      <div className="osc-knob-container mb-6">
        <div className="osc-knob osc-knob-sm transition-transform duration-500 ease-out group-hover:rotate-12" style={{ transform: `rotate(${-45 + index * 30}deg)` }}>
          <div className="osc-knob-indicator" />
        </div>
        <span className="text-[8px] font-mono text-[#6b7280] uppercase tracking-widest mt-1">SCALE</span>
      </div>

      {/* Activation Button */}
      <button 
        className={`w-full osc-button py-2 text-[10px] flex items-center justify-center gap-1.5 ${isSelected ? 'active' : ''}`}
        style={{ borderTopColor: isSelected ? config.accentColor : '#4b5563' }}
      >
        <span 
          className={`osc-led ${isSelected ? 'active animate-pulse-dot' : ''}`}
          style={{ '--led-color': config.accentColor } as React.CSSProperties}
        />
        {isSelected ? 'ACTIVE' : 'SELECT'}
      </button>

    </div>
  );
}

// ─── Stats Overlay (Oscilloscope Subpanel) ────────────────────────────────────

function StatsOverlay() {
  const catalog = useConfiguratorStore((s) => s.catalog);
  const totalCost = catalog.reduce((s, p) => s + p.unitCost, 0);
  const totalWeight = catalog.reduce((s, p) => s + p.weight, 0);

  if (catalog.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 border border-[#374151] bg-[#1a1b1e]/90 backdrop-blur px-4 py-3 rounded-md shadow-lg space-y-1.5 z-10">
      <div className="flex items-center gap-2 text-xs font-bold font-mono text-[#f3f4f6] uppercase tracking-wider">
        <Layers className="w-3.5 h-3.5 text-[#4ade80]" />
        OUTPUT DIAGNOSTIC
      </div>
      <div className="grid grid-cols-3 gap-5 text-[10px] font-mono">
        <div>
          <div className="text-[#6b7280]">UNITS</div>
          <div className="font-bold text-[#f3f4f6]">{catalog.length}</div>
        </div>
        <div>
          <div className="text-[#6b7280]">VAL-COST</div>
          <div className="font-bold text-[#4ade80]">${totalCost.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-[#6b7280]">LOAD-WGT</div>
          <div className="font-bold text-[#f3f4f6]">{(totalWeight / 1000).toFixed(2)}kg</div>
        </div>
      </div>
    </div>
  );
}

function EmptyCanvasOverlay() {
  const catalog = useConfiguratorStore((s) => s.catalog);
  const pillar = useProjectStore((s) => s.pillar);

  if (catalog.length > 0) return null;

  const pillarConfig = pillar ? PILLAR_CONFIGS[pillar] : null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="text-center space-y-3 bg-[#000]/60 p-6 rounded border border-[#374151] backdrop-blur-sm">
        <div className="w-12 h-12 mx-auto rounded bg-[#111] border border-[#374151] flex items-center justify-center">
          <Activity className="w-6 h-6 text-[#facc15] animate-pulse-glow" />
        </div>
        <div>
          <p className="text-xs font-mono text-[#facc15] uppercase tracking-wider">AWAITING INPUT SIGNAL</p>
          <p className="text-[10px] font-mono text-[#9ca3af] max-w-[200px] mx-auto mt-1 leading-normal">
            {pillarConfig
              ? `${pillarConfig.name.toUpperCase()} DATA STREAM WILL RENDER HERE`
              : 'SELECT HARDWARE CHANNEL'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const setPillar = useProjectStore((s) => s.setPillar);
  const currentPillar = useProjectStore((s) => s.pillar);
  const catalog = useConfiguratorStore((s) => s.catalog);

  const hasDesign = catalog.length > 0 && currentPillar;

  const [selectedPillar, setSelectedPillar] = useState<ServicePillar | null>(currentPillar || null);
  const [showWorkspace, setShowWorkspace] = useState(!!hasDesign);

  // Apply pillar theme to <html> for global CSS variables if needed
  useEffect(() => {
    if (selectedPillar) {
      document.documentElement.setAttribute('data-pillar', selectedPillar);
    } else {
      document.documentElement.removeAttribute('data-pillar');
    }
  }, [selectedPillar]);

  const handlePillarSelect = (pillarId: ServicePillar) => {
    playConnectSound();
    setSelectedPillar(pillarId);
    setPillar(pillarId);

    // Transition to workspace after a brief delay
    setTimeout(() => {
      setShowWorkspace(true);
    }, 600);
  };

  const handleBackToSelection = () => {
    playClickSound(false);
    setShowWorkspace(false);
    setSelectedPillar(null);
  };

  // ─── Workspace View (Configurator / Sim) ───────────────────────────────────
  if (showWorkspace && selectedPillar) {
    const pillarConfig = PILLAR_CONFIGS[selectedPillar];

    return (
      <div className="flex-1 flex flex-col p-4 bg-[#121212] relative min-h-0 overflow-hidden">

        {/* Workspace Control Strip Header */}
        <div className="flex items-center gap-3 px-6 py-2.5 osc-faceplate rounded shadow-md mb-3 justify-between relative border border-[#374151]">
          {/* Sockets for decoration */}
          <div className="absolute top-1/2 left-32 -translate-y-1/2 hidden xl:flex gap-1">
            <span className="screw" />
            <span className="screw" />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToSelection}
              className="osc-button px-3 py-1.5 text-[10px]"
            >
              ← SYSTEM BYPASS
            </button>
            <div className="w-px h-5 bg-[#374151]" />
            <div className="flex items-center gap-2">
              <span className="osc-led active animate-pulse-dot" style={{ '--led-color': pillarConfig.accentColor } as React.CSSProperties} />
              <span className="text-xs font-mono font-bold text-[#f3f4f6] tracking-wider">
                CH ACTIVE: {pillarConfig.name.toUpperCase()}
              </span>
            </div>
          </div>

          <span
            className="text-[9px] font-bold font-mono tracking-widest uppercase border border-[#374151] bg-[#1a1b1e] px-2 py-0.5 rounded"
            style={{ color: pillarConfig.accentColor }}
          >
            {pillarConfig.tagline}
          </span>
        </div>

        {/* Split View Console Frame */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-4 mb-3">
          {/* Oscilloscope Chat Terminal (left) */}
          <div className="flex-1 lg:flex-none w-full lg:w-[460px] xl:w-[500px] shrink-0 osc-screen flex flex-col min-h-[300px] lg:min-h-0">
            <div className="absolute top-2 right-4 text-[9px] font-mono text-[#374151] pointer-events-none select-none">
              TERMINAL // TELEMETRY
            </div>
            <ChatPanel isLandingPage />
          </div>

          {/* Oscilloscope 3D Simulator (right) */}
          <div className="flex-1 osc-chassis relative min-h-[300px] lg:min-h-0 flex flex-col">
            <div className="absolute inset-0 border-[8px] border-[#1e1f22] rounded-xl z-20 pointer-events-none" />
            <div className="absolute top-2 left-2 z-20"><span className="screw" /></div>
            <div className="absolute top-2 right-2 z-20"><span className="screw" /></div>
            
            <div className="flex-1 relative z-10 bg-[#000]">
               {/* 3D Scene Viewport */}
              <Scene3D />
            </div>

            <StatsOverlay />
            <EmptyCanvasOverlay />
          </div>
        </div>

        {/* Modular Console Footplate */}
        <footer className="border border-[#374151] bg-[#1e1f22] py-3 px-6 rounded shadow-sm">
          <div className="max-w-[1800px] mx-auto flex items-center justify-between text-[10px] font-mono text-[#6b7280]">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5" style={{ color: pillarConfig.accentColor }} />
              INSTRUMENT CHASSIS SPEC // 2026
            </div>
            <div>MECHANICAL × ELECTRONICS × SOFTWARE</div>
          </div>
        </footer>
      </div>
    );
  }

  // ─── Landing Page / Oscilloscope Dashboard ──────────────────────────────────
  return (
    <div className="flex-1 flex flex-col p-6 bg-[#121212] relative select-none items-center overflow-y-auto min-h-0">
      
      {/* Main Console Faceplate */}
      <div className="osc-chassis w-full max-w-6xl flex flex-col p-8 relative">
        
        {/* Screws around faceplate edges */}
        <div className="absolute top-4 left-4"><span className="screw" /></div>
        <div className="absolute top-4 right-4"><span className="screw" /></div>
        <div className="absolute bottom-4 left-4"><span className="screw" /></div>
        <div className="absolute bottom-4 right-4"><span className="screw" /></div>

        {/* Header Board / Brand decal */}
        <div className="relative text-center mb-6 pt-4">
          <div className="inline-flex items-center gap-1.5 border border-[#374151] bg-[#1a1b1e] px-3 py-1 rounded text-[10px] font-mono font-bold text-[#9ca3af] mb-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
            <Activity className="w-3 h-3 text-[#4ade80] animate-pulse-dot" />
            UXR-SERIES OSCILLOSCOPE ENGINE
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-wider silkscreen-header mb-3 text-[#f3f4f6]">
            Mechatronics <span className="text-[#9ca3af] font-normal">Lab</span>
          </h1>

          <p className="text-xs font-mono text-[#6b7280] max-w-2xl mx-auto mb-2 uppercase tracking-wider leading-relaxed">
            Monitor, analyze, and synthesize physical automation systems across four diagnostic channels.
            <br />
            <span className="text-[#f3f4f6] font-bold">Select hardware channel below to acquire signal.</span>
          </p>
        </div>

        {/* Central Oscilloscope Screen */}
        <div className="w-full h-[320px] osc-screen mb-8">
           <div className="osc-grid" />
           <div className="absolute top-2 left-2 text-[10px] font-mono text-[#f3f4f6] z-20">
              <span className="bg-[#111] px-1 border border-[#374151]">20.0 GS/s</span>
           </div>
           <OscilloscopeTraces selectedPillar={selectedPillar} />
        </div>

        {/* 4 Hardware Channel Strips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {getAllPillars().map((pillar, i) => (
            <ChannelStrip
              key={pillar.id}
              pillarId={pillar.id}
              index={i}
              isSelected={selectedPillar === pillar.id}
              onSelect={handlePillarSelect}
            />
          ))}
        </div>

        {/* Technical spec footnotes */}
        <footer className="mt-8 border-t border-[#374151] pt-4 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] font-mono text-[#6b7280] uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#60a5fa]" />
              <span>TEST INSTRUMENT // MODEL M-500</span>
            </div>
            <div>PRECISION MEASUREMENT SYSTEMS © 2026</div>
          </div>
        </footer>

      </div>
    </div>
  );
}
