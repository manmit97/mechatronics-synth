'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Cpu, FlaskConical, ClipboardList, Package, ShoppingCart, MessageSquare } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { useProjectStore } from '@/stores/project-store';
import { useDesignHistoryStore } from '@/stores/design-history-store';

const navLinks = [
  { href: '/configurator', label: 'Configurator', icon: Box },
  { href: '/simulate', label: 'Simulate', icon: FlaskConical },
  { href: '/bom', label: 'BOM', icon: ClipboardList },
  { href: '/assembly', label: 'Assembly', icon: Package },
  { href: '/checkout', label: 'Checkout', icon: ShoppingCart },
];

export function Navbar() {
  const pathname = usePathname();
  const toggleDrawer = useChatStore((s) => s.toggleDrawer);
  const agentPhase = useProjectStore((s) => s.agentPhase);
  const currentVersion = useDesignHistoryStore((s) => s.currentVersion);
  const isDesignReady = agentPhase === 'complete';

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-[var(--color-border-subtle)] px-4 py-3"
         style={{ borderRadius: 0 }}>
      <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] flex items-center justify-center group-hover:shadow-[0_0_20px_var(--color-accent-cyan-glow)] transition-shadow">
            <Cpu className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            <span className="text-gradient-cyan">Mechatronics</span>
            <span className="text-[var(--color-text-secondary)]">Synth</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            const isDisabled = !isDesignReady && href !== '/';

            return (
              <Link
                key={href}
                href={isDisabled ? '#' : href}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'text-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan-glow)]'
                    : isDisabled
                    ? 'text-[var(--color-text-muted)] cursor-not-allowed opacity-50'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                  }
                `}
                onClick={(e) => { if (isDisabled) e.preventDefault(); }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Version badge */}
          {currentVersion > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-xs font-mono text-[var(--color-text-secondary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-lime)]" />
              v{currentVersion}
            </div>
          )}

          {/* Agent status */}
          {agentPhase === 'generating' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-accent-cyan-glow)] text-xs text-[var(--color-accent-cyan)]">
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent-cyan)] animate-pulse-dot" />
              Generating
            </div>
          )}

          {/* Chat toggle */}
          <button
            onClick={toggleDrawer}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-cyan)] hover:border-[var(--color-accent-cyan)] transition-all duration-200"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Agent</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
