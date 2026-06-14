'use client';

import dynamic from 'next/dynamic';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useConfiguratorStore } from '@/stores/configurator-store';
import { Cpu, Layers, FlaskConical, ClipboardList, Zap } from 'lucide-react';

const Scene3D = dynamic(
  () => import('@/components/three/Scene3D').then((m) => m.Scene3D),
  { ssr: false, loading: () => <SceneLoadingPlaceholder /> }
);

function SceneLoadingPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface-primary)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-[var(--color-accent-cyan)] border-t-transparent rounded-full animate-spin-slow" />
        <span className="text-sm text-[var(--color-text-muted)]">Loading 3D Engine...</span>
      </div>
    </div>
  );
}

function StatsOverlay() {
  const catalog = useConfiguratorStore((s) => s.catalog);
  const config = useConfiguratorStore((s) => s.config);
  const totalCost = catalog.reduce((s, p) => s + p.unitCost, 0);
  const totalWeight = catalog.reduce((s, p) => s + p.weight, 0);

  if (catalog.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 glass-panel px-4 py-3 space-y-1.5">
      <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-accent-cyan)]">
        <Layers className="w-3.5 h-3.5" />
        Design Summary
      </div>
      <div className="grid grid-cols-3 gap-4 text-xs">
        <div>
          <div className="text-[var(--color-text-muted)]">Parts</div>
          <div className="font-mono font-medium text-[var(--color-text-primary)]">{catalog.length}</div>
        </div>
        <div>
          <div className="text-[var(--color-text-muted)]">Est. Cost</div>
          <div className="font-mono font-medium text-[var(--color-accent-lime)]">${totalCost.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-[var(--color-text-muted)]">Weight</div>
          <div className="font-mono font-medium text-[var(--color-text-primary)]">{(totalWeight / 1000).toFixed(2)}kg</div>
        </div>
      </div>
    </div>
  );
}

const features = [
  { icon: Cpu, label: 'AI-Generated Design', desc: 'Describe your idea in natural language' },
  { icon: Layers, label: '3D Configurator', desc: 'Interactive part customization' },
  { icon: FlaskConical, label: 'Physics Simulation', desc: 'Test your design virtually' },
  { icon: ClipboardList, label: 'Auto BOM & Sourcing', desc: 'Real-time cost calculation' },
  { icon: Zap, label: 'Iterative Refinement', desc: 'AI companion across the lifecycle' },
];

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero */}
      <div className="text-center py-6 px-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          <span className="text-gradient-cyan">Describe your mechatronic system.</span>
          <br />
          <span className="text-[var(--color-text-secondary)] text-xl sm:text-2xl font-medium">We&apos;ll engineer it.</span>
        </h1>
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {features.map((f) => (
            <div key={f.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)]">
              <f.icon className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
              {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* Split View: Chat + 3D Preview */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Chat Panel (left) */}
        <div className="w-full lg:w-[440px] xl:w-[480px] shrink-0 border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)] flex flex-col h-[500px] lg:h-auto">
          <ChatPanel isLandingPage />
        </div>

        {/* 3D Preview (right) */}
        <div className="flex-1 relative min-h-[400px] lg:min-h-0">
          <Scene3D />
          <StatsOverlay />
          {/* Watermark when empty */}
          <EmptyCanvasOverlay />
        </div>
      </div>

      {/* Footer on landing */}
      <footer className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)] py-4 px-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
            MechatronicsSynth
          </div>
          <div>Mechanics × Electronics × Software</div>
        </div>
      </footer>
    </div>
  );
}

function EmptyCanvasOverlay() {
  const catalog = useConfiguratorStore((s) => s.catalog);
  if (catalog.length > 0) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-center">
          <Layers className="w-8 h-8 text-[var(--color-text-muted)]" />
        </div>
        <div>
          <p className="text-sm text-[var(--color-text-secondary)]">3D Preview</p>
          <p className="text-xs text-[var(--color-text-muted)]">Parts will appear here as the AI generates them</p>
        </div>
      </div>
    </div>
  );
}
