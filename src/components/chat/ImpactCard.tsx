import { AlertTriangle, Cog, Zap, Cpu } from 'lucide-react';
import { type ImpactCard } from '@/hooks/useChatEngine';

export function ImpactCardComponent({ domain, severity, description, recommendation }: ImpactCard) {
  const domainIcons: Record<string, typeof Cog> = { mechanics: Cog, electronics: Zap, software: Cpu };
  const severityColors: Record<string, string> = { info: '#facc15', warning: '#f97316', critical: '#ef4444' };
  const Icon = domainIcons[domain] || AlertTriangle;
  const color = severityColors[severity] || '#facc15';

  return (
    <div className="rounded border p-3 text-xs font-sans space-y-1.5 bg-[#1a1b1e]/80" style={{ borderColor: color }}>
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="font-bold uppercase tracking-wider" style={{ color }}>
          {severity.toUpperCase() + " // " + domain.toUpperCase()}
        </span>
      </div>
      <p className="text-[#d1d5db]">{description}</p>
      <p className="text-[#60a5fa] font-bold">→ RECOMMEND: {recommendation}</p>
    </div>
  );
}
