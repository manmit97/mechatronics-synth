'use client';

import { Star, Plus, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { ComponentEntry } from '@/stores/component-library-store';
import { useComponentLibraryStore } from '@/stores/component-library-store';
import { playClickSound, playConnectSound } from '@/utils/audio';

// ─── Component Card ─────────────────────────────────────────────────────────
// Individual component card with compact/expanded states, real pricing,
// stock LEDs, and "Add to Chat" interaction.

interface ComponentCardProps {
  component: ComponentEntry;
  onAddToChat: (name: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  actuator: '#f97316',
  controller: '#60a5fa',
  sensor: '#4ade80',
  power: '#facc15',
  structural: '#9ca3af',
  fastener: '#6b7280',
  transmission: '#a78bfa',
  wheel: '#f472b6',
  end_effector: '#ef4444',
  chassis: '#06b6d4',
  wiring: '#f59e0b',
};

const STOCK_CONFIG = {
  in_stock: { color: '#4ade80', label: 'IN STOCK', animate: false },
  low_stock: { color: '#facc15', label: 'LOW STOCK', animate: true },
  out_of_stock: { color: '#ef4444', label: 'OUT OF STOCK', animate: false },
  unknown: { color: '#6b7280', label: 'UNKNOWN', animate: false },
};

export function ComponentCard({ component, onAddToChat }: ComponentCardProps) {
  const { favorites, toggleFavorite, expandedCardId, setExpandedCard } =
    useComponentLibraryStore();
  const isExpanded = expandedCardId === component.id;
  const isFavorite = favorites.includes(component.id);
  const catColor = CATEGORY_COLORS[component.category] || '#6b7280';
  const stockCfg = STOCK_CONFIG[component.stockStatus] || STOCK_CONFIG.unknown;

  // Best price from all suppliers
  const bestPrice = component.pricing.length > 0
    ? component.pricing.reduce((min, p) => (p.price < min.price ? p : min), component.pricing[0])
    : null;

  // Top 3 specs to show in compact view
  const topSpecs = Object.entries(component.specs).slice(0, 3);

  return (
    <div
      className="group rounded border border-[#374151] bg-[#1a1b1e] transition-all duration-200 hover:border-[#4b5563] hover:shadow-lg hover:shadow-black/30"
      style={{ borderTopColor: catColor, borderTopWidth: '2px' }}
    >
      {/* Compact Header */}
      <div className="p-3 space-y-2">
        {/* Row 1: Category LED + Name + Favorite */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`osc-led active shrink-0 ${stockCfg.animate ? 'animate-pulse-dot' : ''}`}
              style={{ '--led-color': catColor } as React.CSSProperties}
            />
            <span className="text-sm font-semibold font-sans text-[#f3f4f6] leading-tight truncate">
              {component.name}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              playClickSound(false);
              toggleFavorite(component.id);
            }}
            className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              className="w-3 h-3"
              style={{ color: isFavorite ? '#facc15' : '#6b7280' }}
              fill={isFavorite ? '#facc15' : 'none'}
            />
          </button>
        </div>

        {/* Row 2: Category badge */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: `${catColor}20`, color: catColor, border: `1px solid ${catColor}40` }}
          >
            {component.category.replace('_', ' ')}
          </span>
          {/* Stock LED */}
          <span className="flex items-center gap-1">
            <span
              className={`inline-block w-[5px] h-[5px] rounded-full ${stockCfg.animate ? 'animate-pulse-dot' : ''}`}
              style={{ background: stockCfg.color, boxShadow: `0 0 4px ${stockCfg.color}60` }}
            />
            <span className="text-[10px] font-semibold tracking-widest" style={{ color: stockCfg.color }}>
              {stockCfg.label}
            </span>
          </span>
        </div>

        {/* Row 3: Top specs as pills */}
        <div className="flex items-center gap-1 flex-wrap">
          {topSpecs.map(([key, val]) => (
            <span
              key={key}
              className="px-2 py-1 rounded text-xs bg-[#111] border border-[#374151] text-[#9ca3af] font-medium"
              title={`${key}: ${val}`}
            >
              {val}
            </span>
          ))}
        </div>

        {/* Row 4: Price + Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-[#374151]">
          {bestPrice ? (
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-[#4ade80]">
                ${bestPrice.price.toFixed(2)}
              </span>
              <span className="text-xs text-[#6b7280]">
                via {bestPrice.supplier}
              </span>
            </div>
          ) : (
            <span className="text-xs text-[#6b7280]">Price TBD</span>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                playClickSound(true);
                setExpandedCard(isExpanded ? null : component.id);
              }}
              className="osc-button px-2 py-1 text-xs gap-1 font-semibold"
            >
              {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              {isExpanded ? 'LESS' : 'MORE'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                playConnectSound();
                onAddToChat(component.name);
              }}
              className="osc-button px-2 py-1 text-xs gap-1 font-semibold"
              style={{ borderTopColor: '#4ade80', borderTopWidth: '2px' }}
            >
              <Plus className="w-2.5 h-2.5 text-[#4ade80]" />
              ADD
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-[#374151] pt-2 animate-fade-in">
          {/* Description */}
          <p className="text-sm text-[#9ca3af] leading-relaxed">
            {component.description}
          </p>

          {/* Full Specs Table */}
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold text-[#6b7280] tracking-widest uppercase">
              Specifications
            </span>
            <div className="bg-[#111] rounded border border-[#374151] divide-y divide-[#374151]">
              {Object.entries(component.specs).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs text-[#6b7280]">{key}</span>
                  <span className="text-xs text-[#f3f4f6] font-semibold">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Multi-Supplier Pricing */}
          {component.pricing.length > 0 && (
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-[#6b7280] tracking-widest uppercase">
                Supplier Pricing
              </span>
              <div className="bg-[#111] rounded border border-[#374151] divide-y divide-[#374151]">
                {component.pricing.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-[5px] h-[5px] rounded-full"
                        style={{
                          background: p.inStock ? '#4ade80' : '#ef4444',
                          boxShadow: `0 0 3px ${p.inStock ? '#4ade8060' : '#ef444460'}`,
                        }}
                      />
                      <span className="text-xs text-[#9ca3af]">{p.supplier}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#4ade80]">
                        ${p.price.toFixed(2)}
                      </span>
                      {p.supplierUrl && (
                        <a
                          href={p.supplierUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#60a5fa] hover:text-[#93bbfc] transition-colors"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
