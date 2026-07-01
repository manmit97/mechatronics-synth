'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ChatDrawer, ChatToggle } from '@/components/chat/ChatPanel';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useChatStore } from '@/stores/chat-store';
import type { PageContext } from '@/types/ai';

const pageContextMap: Record<string, PageContext> = {
  '/': 'landing',
  '/configurator': 'configurator',
  '/simulate': 'simulate',
  '/bom': 'bom',
  '/assembly': 'assembly',
  '/checkout': 'checkout',
};

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const setContext = useChatStore((s) => s.setContext);
  const isLanding = pathname === '/';

  useEffect(() => {
    const ctx = pageContextMap[pathname] || 'landing';
    setContext(ctx);
  }, [pathname, setContext]);

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      <Navbar />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">{children}</main>
      <Footer />
      {/* Persistent chat system (not on landing — landing has inline chat) */}
      {!isLanding && (
        <>
          <ChatDrawer />
          <ChatToggle />
        </>
      )}
    </div>
  );
}
