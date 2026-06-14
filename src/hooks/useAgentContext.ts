'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useChatStore } from '@/stores/chat-store';
import type { QuickAction } from '@/stores/chat-store';

/**
 * Syncs the chat agent's context with the current route, providing
 * context-specific quick actions and chat header labels.
 */
export function useAgentContext() {
  const pathname = usePathname();
  const { setCurrentContext, setQuickActions, currentContext } = useChatStore();

  useEffect(() => {
    const route = pathname.split('/')[1] || 'landing';
    const context = route as typeof currentContext;
    setCurrentContext(context);

    const contextActions: Record<string, QuickAction[]> = {
      landing: [],
      configurator: [
        { id: 'qa-swap', label: 'Swap a component', prompt: 'Swap the motor for a higher-torque alternative', icon: 'RefreshCw', contexts: ['configurator'] },
        { id: 'qa-add-sensor', label: 'Add sensor', prompt: 'Add a camera module to the design', icon: 'Radio', contexts: ['configurator'] },
        { id: 'qa-upgrade', label: 'Upgrade motors', prompt: 'Upgrade the motors for higher torque and payload capacity', icon: 'Cpu', contexts: ['configurator'] },
        { id: 'qa-optimize', label: 'Optimize cost', prompt: 'Optimize the design for lower cost', icon: 'DollarSign', contexts: ['configurator'] },
      ],
      simulate: [
        { id: 'qa-sim-run', label: 'Run simulation', prompt: 'Run a physics simulation on this design', icon: 'Play', contexts: ['simulate'] },
        { id: 'qa-sim-stress', label: 'Stress test', prompt: 'Perform a stress analysis on structural components', icon: 'Activity', contexts: ['simulate'] },
      ],
      bom: [
        { id: 'qa-bom-export', label: 'Export BOM', prompt: 'Export the bill of materials as CSV', icon: 'Download', contexts: ['bom'] },
        { id: 'qa-bom-source', label: 'Find alternatives', prompt: 'Find cheaper sourcing alternatives for the most expensive parts', icon: 'Search', contexts: ['bom'] },
      ],
      assembly: [
        { id: 'qa-asm-gen', label: 'Generate steps', prompt: 'Generate assembly instructions for this design', icon: 'FileText', contexts: ['assembly'] },
      ],
      checkout: [],
    };

    setQuickActions(contextActions[context] || []);
  }, [pathname, setCurrentContext, setQuickActions, currentContext]);

  return { currentContext };
}
