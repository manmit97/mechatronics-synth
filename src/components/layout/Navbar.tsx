'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  Cpu,
  FlaskConical,
  ClipboardList,
  Package,
  ShoppingCart,
  MessageSquare,
  LayoutDashboard,
  Layers,
  Workflow,
  Monitor,
  Cog,
  Printer,
  Volume2,
  VolumeX,
  Settings,
  Activity
} from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { useProjectStore } from '@/stores/project-store';
import { useDesignHistoryStore } from '@/stores/design-history-store';
import { PILLAR_CONFIGS } from '@/types/pillar';
import { isAudioMuted, toggleAudioMute, playClickSound, playConnectSound, getCurrentAudioTone, setCurrentAudioTone, type AudioTone } from '@/utils/audio';

// ─── Icon resolver for pillar nav links ──────────────────────────────────────

const navIconMap: Record<string, typeof Box> = {
  Box,
  FlaskConical,
  ClipboardList,
  Package,
  ShoppingCart,
  LayoutDashboard,
  Layers,
  Workflow,
  Monitor,
  Cog,
  Printer,
};

function resolveIcon(iconName: string) {
  return navIconMap[iconName] || Box;
}

// ─── Pillar icon map ─────────────────────────────────────────────────────────

const pillarIconMap: Record<string, typeof Cpu> = {
  Monitor,
  Cog,
  Workflow,
  Printer,
};

// ─── Default nav links (when no pillar is selected) ──────────────────────────

const defaultNavLinks = [
  { href: '/configurator', label: 'Configurator', icon: 'Box' },
  { href: '/simulate', label: 'Simulate', icon: 'FlaskConical' },
  { href: '/bom', label: 'BOM', icon: 'ClipboardList' },
  { href: '/assembly', label: 'Assembly', icon: 'Package' },
  { href: '/checkout', label: 'Checkout', icon: 'ShoppingCart' },
];

export function Navbar() {
  const pathname = usePathname();
  const toggleDrawer = useChatStore((s) => s.toggleDrawer);
  const { knobRotations, setKnobRotations } = useChatStore();
  const agentPhase = useProjectStore((s) => s.agentPhase);
  const pillar = useProjectStore((s) => s.pillar);
  const currentVersion = useDesignHistoryStore((s) => s.currentVersion);
  const isDesignReady = agentPhase === 'complete';

  const [muted, setMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTone, setCurrentTone] = useState<AudioTone>('synth');
  const [selectedTone, setSelectedTone] = useState<AudioTone>('synth');
  const [devPopup, setDevPopup] = useState<{ show: boolean, feature: string }>({ show: false, feature: '' });

  // Sync mute state and audio tone on client load
  useEffect(() => {
    const timer = setTimeout(() => {
      setMuted(isAudioMuted());
      const initialTone = getCurrentAudioTone();
      setCurrentTone(initialTone);
      setSelectedTone(initialTone);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleMuteToggle = () => {
    const nextMuted = toggleAudioMute();
    setMuted(nextMuted);
    playClickSound(!nextMuted);
  };

  const handleKnobClick = (index: number) => {
    setKnobRotations((prev: number[]) => {
      const next = [...prev];
      next[index] = (next[index] + 25) > 100 ? 0 : (next[index] + 25);
      return next;
    });
    playClickSound(false);
  };

  const handleOpenSettings = () => {
    const initialTone = getCurrentAudioTone();
    setSelectedTone(initialTone);
    setShowSettings(true);
    playClickSound(true);
  };

  const handleCancel = () => {
    // Restore the tone to what it was before opening the modal
    setCurrentAudioTone(currentTone);
    setShowSettings(false);
    playClickSound(false);
  };

  const handleSave = () => {
    // Formally apply and save the selected tone
    setCurrentAudioTone(selectedTone);
    setCurrentTone(selectedTone);
    setShowSettings(false);
    playConnectSound(); // Play confirm arpeggio chime
  };

  // Get pillar-specific nav links or fall back to defaults
  const pillarConfig = pillar ? PILLAR_CONFIGS[pillar] : null;
  const navLinks = pillarConfig ? pillarConfig.navLinks : defaultNavLinks;

  return (
    <>
      <nav className="sticky top-0 z-40 osc-faceplate px-8 py-3 relative overflow-hidden bg-[#2c2e33]">
        {/* Decorative metal screws */}
        <div className="absolute top-2 left-4"><span className="screw" /></div>
        <div className="absolute bottom-2 left-4"><span className="screw" /></div>
        <div className="absolute top-2 right-4"><span className="screw" /></div>
        <div className="absolute bottom-2 right-4"><span className="screw" /></div>

        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4 relative">
          {/* Logo / Brand Decal */}
          <Link 
            href="/" 
            onClick={() => playClickSound(true)}
            className="flex items-center gap-2.5 shrink-0 group select-none ml-2"
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center border border-[#111] bg-[#1e1f22] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),_0_1px_0_rgba(255,255,255,0.1)] transition-transform group-hover:scale-105 active:translate-y-0.5"
            >
              <Activity className="w-4 h-4 text-[#4ade80]" />
            </div>
            <span className="text-md font-bold tracking-widest silkscreen-header text-[#f3f4f6]">
              MECHAFORGE<span className="text-stone-500 font-normal"> LAB</span>
            </span>
          </Link>

          {/* Pillar Badge + Nav Links */}
          <div className="hidden md:flex items-center gap-3">
            {/* Nav links */}
            <div className="flex items-center gap-2.5">
              {navLinks.map(({ href, label, icon }) => {
                const isActive = pathname === href;
                const isDisabled = !isDesignReady && href !== '/';
                const Icon = resolveIcon(icon);

                return (
                  <div key={href} className="flex flex-col items-center gap-0.5 relative pt-1.5">
                    {/* Status Indicator LED above the pad button */}
                    <span 
                      className={`osc-led ${isActive ? 'active' : ''}`}
                      style={{ '--led-color': pillarConfig ? pillarConfig.accentColor : '#4ade80' } as React.CSSProperties}
                    />
                    <Link
                      href="#"
                      className={`osc-button px-3.5 py-1.5 flex items-center gap-2 ${isActive ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        playClickSound(false);
                        setDevPopup({ show: true, feature: label });
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right side controls panel */}
          <div className="flex items-center gap-3 mr-2">
            
            {/* Settings button */}
            <div className="flex items-center gap-1.5 bg-[#1e1f22] p-1.5 rounded border border-[#111] relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              <div className="flex flex-col items-center gap-0.5 relative pt-1">
                <span 
                  className={`osc-led active`} 
                  style={{ '--led-color': '#9ca3af' } as React.CSSProperties}
                />
                <button
                  onClick={handleOpenSettings}
                  className="osc-button px-3 py-1.5 flex items-center gap-1.5"
                  title="System Settings"
                >
                  <Settings className="w-3.5 h-3.5 text-[#9ca3af]" />
                  <span className="font-mono text-[9px] tracking-tight">SYSTEM</span>
                </button>
              </div>
            </div>

            {/* Version meter dial */}
            {currentVersion > 0 && (
              <div className="hidden sm:flex flex-col items-center gap-0.5 relative pt-1.5">
                <span className="osc-led active animate-pulse-dot" style={{ '--led-color': '#facc15' } as React.CSSProperties} />
                <div 
                  className="px-2.5 py-1.5 border border-[#111] bg-[#1a1b1e] rounded text-[9px] font-mono font-bold text-[#facc15] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]"
                >
                  SYS-VER v{currentVersion}
                </div>
              </div>
            )}

            {/* Active Generation LED */}
            {agentPhase === 'generating' && (
              <div className="flex flex-col items-center gap-0.5 relative pt-1.5">
                <span className="osc-led active animate-pulse-glow" style={{ '--led-color': '#facc15' } as React.CSSProperties} />
                <div 
                  className="px-2.5 py-1.5 border border-[#111] bg-[#1a1b1e] rounded text-[9px] font-mono font-bold text-[#facc15] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]"
                >
                  COMPILING...
                </div>
              </div>
            )}

            {/* Chat drawer toggle */}
            {pathname !== '/' && (
              <div className="flex flex-col items-center gap-0.5 relative pt-1.5">
                <span className="osc-led active" style={{ '--led-color': '#facc15' } as React.CSSProperties} />
                <button
                  onClick={() => {
                    playClickSound(true);
                    toggleDrawer();
                  }}
                  className="osc-button osc-button-primary px-3 py-1.5 flex items-center gap-1.5"
                  style={{ borderTopColor: '#facc15' }}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#facc15]" />
                  <span className="font-mono text-[10px] font-bold text-[#facc15]">AGENT</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Audio Settings Modal Dialog Backdrop */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={handleCancel}
        >
          {/* Modal Box */}
          <div 
            className="osc-chassis w-96 p-5 bg-[#1e1f22] relative shadow-2xl text-[#f3f4f6] border border-[#374151]"
            onClick={(e) => e.stopPropagation()} 
          >
            {/* Structural metal panel screws */}
            <div className="absolute top-2 left-2"><span className="screw" /></div>
            <div className="absolute top-2 right-2"><span className="screw" /></div>
            <div className="absolute bottom-2 left-2"><span className="screw" /></div>
            <div className="absolute bottom-2 right-2"><span className="screw" /></div>

            {/* Modal Title Decal */}
            <div className="text-center pb-3 border-b border-[#374151] mb-4">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#9ca3af] block">UTILITY SETUP</span>
              <h2 className="text-xs font-bold font-mono tracking-wider text-[#f3f4f6] uppercase mt-1">SYSTEM SETTINGS</h2>
            </div>

            {/* Display Settings */}
            <div className="mb-5">
              <h3 className="text-[10px] font-mono font-bold text-[#60a5fa] uppercase tracking-widest mb-3 border-b border-[#374151] pb-1">DISPLAY OVERRIDES</h3>
              <div className="flex items-center justify-between bg-[#121212] p-3 rounded border border-[#111] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                {['TEXT SIZE', 'LINE SPACING', 'BRIGHTNESS'].map((label, idx) => (
                  <div key={label} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => handleKnobClick(idx)}>
                    <div className="osc-knob osc-knob-sm transition-transform duration-200" style={{ transform: `rotate(${(knobRotations[idx] / 100) * 360}deg)` }}>
                      <div className="osc-knob-indicator" />
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <span className="text-[9px] font-semibold text-[#9ca3af] tracking-widest leading-tight mt-2">{label}</span>
                      <span className="text-[10px] font-semibold text-[#60a5fa] mt-1.5 leading-none">{knobRotations[idx]}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audio Settings */}
            <div className="mb-4">
              <div className="flex items-center justify-between border-b border-[#374151] pb-1 mb-3">
                <h3 className="text-[10px] font-mono font-bold text-[#4ade80] uppercase tracking-widest">AUDIO SETTINGS</h3>
                <button
                  onClick={handleMuteToggle}
                  className="osc-button px-2 py-1 flex items-center gap-1"
                  title={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? <VolumeX className="w-3 h-3 text-[#ef4444]" /> : <Volume2 className="w-3 h-3 text-[#4ade80]" />}
                  <span className="font-mono text-[9px] tracking-tight">{muted ? 'MUTED' : 'ON'}</span>
                </button>
              </div>
              <div className="space-y-2 bg-[#121212] p-2 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border border-[#111]">
                {([
                  { id: 'synth', label: '⚡ DIGITAL BEEP' },
                  { id: 'relay', label: '🔩 RELAY CLICK' },
                  { id: 'chiptune', label: '👾 CHIPTUNE' },
                  { id: 'hum', label: '🔋 MAINS HUM' },
                  { id: 'pneumatic', label: '🔌 SOLENOID HISS' },
                ] as const).map((item) => {
                  const active = selectedTone === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentAudioTone(item.id);
                        setSelectedTone(item.id);
                        playClickSound(true);
                      }}
                      className={`w-full text-left px-3 py-2 rounded border font-mono text-[10px] flex items-center justify-between transition-all ${
                        active 
                          ? 'border-[#4ade80] bg-[#1e1f22] text-[#4ade80] font-bold shadow-[0_0_8px_rgba(74,222,128,0.2)]' 
                          : 'border-[#374151] text-[#9ca3af] hover:bg-[#1a1b1e] hover:text-[#f3f4f6]'
                      }`}
                    >
                      <span>{item.label}</span>
                      {active && <span className="osc-led active scale-75 animate-pulse-dot" style={{ '--led-color': '#4ade80' } as React.CSSProperties} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Settings Actions Dialog */}
            <div className="flex items-center gap-2.5 border-t border-[#374151] pt-3.5">
              <button
                onClick={handleCancel}
                className="flex-1 osc-button py-2 text-[10px] text-center"
              >
                CANCEL
              </button>
              <button
                onClick={handleSave}
                className="flex-1 osc-button osc-button-primary py-2 text-[10px] text-center font-bold text-[#4ade80]"
                style={{ borderTopColor: '#4ade80' }}
              >
                APPLY SETUP
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Feature Under Development Modal */}
      {devPopup.show && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setDevPopup({ show: false, feature: '' })}
        >
          <div 
            className="osc-chassis w-80 p-5 bg-[#1e1f22] relative shadow-2xl text-[#f3f4f6] border border-[#374151]"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="absolute top-2 left-2"><span className="screw" /></div>
            <div className="absolute top-2 right-2"><span className="screw" /></div>
            <div className="absolute bottom-2 left-2"><span className="screw" /></div>
            <div className="absolute bottom-2 right-2"><span className="screw" /></div>

            <div className="text-center pb-3 border-b border-[#374151] mb-4">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#facc15] block">SYSTEM NOTIFICATION</span>
              <h2 className="text-xs font-bold font-mono tracking-wider text-[#f3f4f6] uppercase mt-1">{devPopup.feature} MODULE</h2>
            </div>

            <div className="mb-5 text-center">
              <p className="text-[11px] font-mono text-[#9ca3af] leading-relaxed">
                This feature is currently under development. Check back later for updates.
              </p>
            </div>

            <div className="flex items-center gap-2.5 border-t border-[#374151] pt-3.5">
              <button
                onClick={() => {
                  playClickSound(true);
                  setDevPopup({ show: false, feature: '' });
                }}
                className="w-full osc-button py-2 text-[10px] text-center font-bold text-[#f3f4f6]"
              >
                ACKNOWLEDGE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
