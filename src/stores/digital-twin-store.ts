'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  JointId,
  JointState,
  DigitalTwinMode,
} from '@/types/digital-twin';
import {
  ARM_CONFIG,
  JOINT_IDS,
  createDefaultJointStates,
} from '@/types/digital-twin';

// ─── Store Interface ────────────────────────────────────────────────────────

interface DigitalTwinState {
  // Joint states (commanded + actual + diagnostics)
  joints: Record<JointId, JointState>;

  // Operating mode
  mode: DigitalTwinMode;

  // Display options
  showGhost: boolean;
  showOverlays: boolean;
  followingErrorThreshold: number; // degrees

  // Telemetry config
  telemetryHz: number;

  // Playback
  playbackTime: number;
  isPlaying: boolean;

  // ─── Actions ──────────────────────────────────────────────────────────

  /** Set commanded angle for a single joint (from slider or playback) */
  setCommandedAngle: (jointId: JointId, angle: number) => void;

  /** Batch-update the actual state from the telemetry generator */
  updateActualState: (jointId: JointId, state: Partial<JointState>) => void;

  /** Switch operating mode */
  setMode: (mode: DigitalTwinMode) => void;

  /** Toggle the holographic ghost arm */
  toggleGhost: () => void;

  /** Toggle 3D-anchored overlays */
  toggleOverlays: () => void;

  /** Adjust following error threshold */
  setFollowingErrorThreshold: (threshold: number) => void;

  /** Set telemetry update rate */
  setTelemetryHz: (hz: number) => void;

  /** Reset all joints to default */
  resetAll: () => void;

  /** Get all commanded angles (used by telemetry generator) */
  getCommandedAngles: () => Record<JointId, number>;

  /** Set playback state */
  setPlaying: (playing: boolean) => void;
  setPlaybackTime: (time: number) => void;
}

// ─── Store Implementation ───────────────────────────────────────────────────

export const useDigitalTwinStore = create<DigitalTwinState>()(
  subscribeWithSelector((set, get) => ({
    joints: createDefaultJointStates(),

    mode: 'manual',
    showGhost: true,
    showOverlays: true,
    followingErrorThreshold: 3, // degrees
    telemetryHz: 30,
    playbackTime: 0,
    isPlaying: false,

    setCommandedAngle: (jointId, angle) => {
      const config = ARM_CONFIG[jointId];
      const clamped = Math.max(config.minAngle, Math.min(config.maxAngle, angle));

      set((state) => ({
        joints: {
          ...state.joints,
          [jointId]: {
            ...state.joints[jointId],
            commandedAngle: clamped,
          },
        },
      }));
    },

    updateActualState: (jointId, partial) => {
      set((state) => ({
        joints: {
          ...state.joints,
          [jointId]: {
            ...state.joints[jointId],
            ...partial,
          },
        },
      }));
    },

    setMode: (mode) => set({ mode }),

    toggleGhost: () => set((state) => ({ showGhost: !state.showGhost })),

    toggleOverlays: () => set((state) => ({ showOverlays: !state.showOverlays })),

    setFollowingErrorThreshold: (threshold) =>
      set({ followingErrorThreshold: threshold }),

    setTelemetryHz: (hz) => set({ telemetryHz: Math.max(1, Math.min(120, hz)) }),

    resetAll: () =>
      set({
        joints: createDefaultJointStates(),
        playbackTime: 0,
        isPlaying: false,
      }),

    getCommandedAngles: () => {
      const { joints } = get();
      const result = {} as Record<JointId, number>;
      for (const id of JOINT_IDS) {
        result[id] = joints[id].commandedAngle;
      }
      return result;
    },

    setPlaying: (playing) => set({ isPlaying: playing }),
    setPlaybackTime: (time) => set({ playbackTime: time }),
  }))
);

// ─── Selector Helpers (for fine-grained subscriptions) ──────────────────────

/** Select a single joint's complete state */
export const selectJoint = (jointId: JointId) =>
  (state: DigitalTwinState) => state.joints[jointId];

/** Select only the commanded angle for a joint */
export const selectCommandedAngle = (jointId: JointId) =>
  (state: DigitalTwinState) => state.joints[jointId].commandedAngle;

/** Select only the actual angle for a joint */
export const selectActualAngle = (jointId: JointId) =>
  (state: DigitalTwinState) => state.joints[jointId].actualAngle;

/** Following error for a joint */
export const selectFollowingError = (jointId: JointId) =>
  (state: DigitalTwinState) =>
    Math.abs(state.joints[jointId].commandedAngle - state.joints[jointId].actualAngle);
