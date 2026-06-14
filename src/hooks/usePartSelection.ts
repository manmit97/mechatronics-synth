'use client';

import { useCallback } from 'react';
import { useConfiguratorStore } from '@/stores/configurator-store';
import type { PartDefinition } from '@/types/parts';

/**
 * Provides utilities for selecting, inspecting, and manipulating
 * individual parts in the 3D configurator.
 */
export function usePartSelection() {
  const selectedPartInstanceId = useConfiguratorStore((s) => s.selectedPartInstanceId);
  const config = useConfiguratorStore((s) => s.config);
  const catalog = useConfiguratorStore((s) => s.catalog);
  const selectPart = useConfiguratorStore((s) => s.selectPart);
  const removePart = useConfiguratorStore((s) => s.removePart);
  const updatePartColor = useConfiguratorStore((s) => s.updatePartColor);
  const updatePartTransform = useConfiguratorStore((s) => s.updatePartTransform);

  const selectedPlacedPart = config?.parts.find(
    (p) => p.instanceId === selectedPartInstanceId
  );
  const selectedPartDefinition = selectedPlacedPart
    ? catalog.find((p) => p.id === selectedPlacedPart.partId)
    : null;

  const deselectAll = useCallback(() => {
    selectPart(null);
  }, [selectPart]);

  const deleteSelected = useCallback(() => {
    if (selectedPartInstanceId) {
      removePart(selectedPartInstanceId);
    }
  }, [selectedPartInstanceId, removePart]);

  const changeSelectedColor = useCallback(
    (color: string) => {
      if (selectedPartInstanceId) {
        updatePartColor(selectedPartInstanceId, color);
      }
    },
    [selectedPartInstanceId, updatePartColor]
  );

  const moveSelected = useCallback(
    (position: [number, number, number]) => {
      if (selectedPartInstanceId) {
        updatePartTransform(selectedPartInstanceId, { position });
      }
    },
    [selectedPartInstanceId, updatePartTransform]
  );

  const rotateSelected = useCallback(
    (rotation: [number, number, number]) => {
      if (selectedPartInstanceId) {
        updatePartTransform(selectedPartInstanceId, { rotation });
      }
    },
    [selectedPartInstanceId, updatePartTransform]
  );

  return {
    selectedPartInstanceId,
    selectedPlacedPart,
    selectedPartDefinition,
    selectPart,
    deselectAll,
    deleteSelected,
    changeSelectedColor,
    moveSelected,
    rotateSelected,
    hasSelection: !!selectedPartInstanceId,
  };
}
