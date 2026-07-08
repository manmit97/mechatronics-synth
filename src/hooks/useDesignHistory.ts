'use client';

import { useCallback } from 'react';
import { useDesignHistoryStore } from '@/stores/design-history-store';
import { useConfiguratorStore } from '@/stores/configurator-store';
import { useBOMStore } from '@/stores/bom-store';

/**
 * Provides snapshot creation and version navigation utilities
 * that read from multiple stores to build full design snapshots.
 */
export function useDesignHistory() {
  const { versions, currentVersion, createSnapshot, restoreVersion, getCurrentDiff, getVersionSummaries } =
    useDesignHistoryStore();

  const catalog = useConfiguratorStore((s) => s.catalog);
  const config = useConfiguratorStore((s) => s.config);
  const setConfig = useConfiguratorStore((s) => s.setConfig);
  const addMultipleToCatalog = useConfiguratorStore((s) => s.addMultipleToCatalog);
  const clearCatalog = useConfiguratorStore((s) => s.clearCatalog);
  const { entries: bomEntries, costBreakdown, recalculate } = useBOMStore();

  const takeSnapshot = useCallback(
    (description: string, trigger: 'ai_generation' | 'user_edit' | 'refinement' | 'rollback', messageId?: string) => {
      if (!config) return;
      createSnapshot(description, trigger, {
        config,
        catalog,
        bom: bomEntries,
        costBreakdown,
      }, messageId);
    },
    [config, catalog, bomEntries, costBreakdown, createSnapshot]
  );

  const goToVersion = useCallback(
    (version: number) => {
      const snapshot = restoreVersion(version);
      if (!snapshot) return false;

      // Restore configurator state
      clearCatalog();
      addMultipleToCatalog(snapshot.catalog);
      setConfig(snapshot.config);

      // Restore BOM
      recalculate(snapshot.bom);

      return true;
    },
    [restoreVersion, clearCatalog, addMultipleToCatalog, setConfig, recalculate]
  );

  return {
    versions,
    currentVersion,
    takeSnapshot,
    goToVersion,
    getCurrentDiff,
    getVersionSummaries,
    canUndo: currentVersion > 1,
    canRedo: false, // Simple linear history for now
  };
}
