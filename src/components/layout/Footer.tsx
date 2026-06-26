'use client';

import { Code, Globe, Heart } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[#111] bg-[#0c0d10] py-6 px-4 z-40 relative">
      <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side */}
        <div className="text-[11px] font-mono text-[#6b7280] tracking-wide">
          © 2026 Manmit Singh · Built with <Heart className="inline w-3 h-3 text-[#ef4444] mx-0.5" /> & precision
        </div>

        {/* Center - Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="https://github.com/manmit97"
            target="_blank"
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#16181d] border border-[#1f2937] hover:border-[#374151] text-[11px] font-mono text-[#9ca3af] hover:text-[#f3f4f6] transition-colors shadow-[inset_0_1px_2px_rgba(255,255,255,0.02)]"
          >
            <Code className="w-3.5 h-3.5" />
            GitHub
          </Link>
          <Link
            href="https://linkedin.com/" 
            target="_blank"
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#16181d] border border-[#1f2937] hover:border-[#374151] text-[11px] font-mono text-[#9ca3af] hover:text-[#f3f4f6] transition-colors shadow-[inset_0_1px_2px_rgba(255,255,255,0.02)]"
          >
            <Globe className="w-3.5 h-3.5" />
            LinkedIn
          </Link>
        </div>

        {/* Right Side */}
        <div className="text-[10px] font-mono tracking-[0.2em] text-[#6b7280]">
          BITS × ATOMS × INTELLIGENCE
        </div>
      </div>
    </footer>
  );
}
