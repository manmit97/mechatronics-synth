'use client';

import { useTokenStore } from '@/stores/token-store';
import { Zap, Search, Activity } from 'lucide-react';

// ─── Token Gauge: VU-Meter Style Session Cost Display ───────────────────────
// Oscilloscope-aesthetic analog VU meter showing real-time AI token usage
// and cost. Rendered in the chat panel footer.

export function TokenGauge({ isTyping = false }: { isTyping?: boolean }) {
  const {
    totalTokens,
    estimatedCostUsd,
    requestCount,
    searchCount,
  } = useTokenStore();

  // Determine VU meter level (0-10 segments) based on cost
  const costThresholds = [0.01, 0.02, 0.05, 0.10, 0.15, 0.25, 0.35, 0.50, 0.75, 1.00];
  const activeSegments = costThresholds.filter((t) => estimatedCostUsd >= t).length;

  // Color transitions: green → amber → red
  const getSegmentColor = (index: number): string => {
    if (index < 4) return '#4ade80'; // Green
    if (index < 7) return '#facc15'; // Amber
    return '#ef4444'; // Red
  };

  // Format values
  const formatTokens = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  const formatCost = (n: number): string => {
    if (n < 0.01) return `$${(n * 100).toFixed(1)}¢`;
    return `$${n.toFixed(3)}`;
  };


  return (
    <div className="flex items-center gap-3 select-none" title={`Prompt: ${formatTokens(useTokenStore.getState().promptTokens)} | Completion: ${formatTokens(useTokenStore.getState().completionTokens)} | Requests: ${requestCount}`}>
      {/* Silkscreen label */}
      <span className="text-[7px] font-mono font-bold text-[#6b7280] tracking-widest leading-none whitespace-nowrap">
        SESSION
      </span>

      {/* VU Meter — 10 LED segments */}
      <div className="flex items-center gap-[2px]">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="w-[5px] h-[10px] rounded-[1px] transition-all duration-200"
            style={{
              background: i < activeSegments ? getSegmentColor(i) : '#1a1b1e',
              boxShadow: i < activeSegments
                ? `0 0 4px ${getSegmentColor(i)}40`
                : 'inset 0 1px 2px rgba(0,0,0,0.8)',
            }}
          />
        ))}
      </div>

      {/* Active indicator dot */}
      {isTyping && (
        <span
          className="osc-led active animate-pulse-dot"
          style={{ '--led-color': '#4ade80', width: '6px', height: '4px' } as React.CSSProperties}
        />
      )}

      {/* Readout values */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5" title="Token count">
          <Activity className="w-2.5 h-2.5 text-[#4ade80]" />
          <span className="text-[7px] font-mono font-bold text-[#4ade80] tabular-nums">
            {formatTokens(totalTokens)}
          </span>
        </div>

        <div className="flex items-center gap-0.5" title="Estimated cost">
          <Zap className="w-2.5 h-2.5 text-[#facc15]" />
          <span className="text-[7px] font-mono font-bold text-[#facc15] tabular-nums">
            {formatCost(estimatedCostUsd)}
          </span>
        </div>

        {searchCount > 0 && (
          <div className="flex items-center gap-0.5" title="Web searches">
            <Search className="w-2.5 h-2.5 text-[#60a5fa]" />
            <span className="text-[7px] font-mono font-bold text-[#60a5fa] tabular-nums">
              {searchCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
