'use client';

import { useCallback } from 'react';
import { ARM_CONFIG, getSeverity } from '@/types/digital-twin';
import type { JointId } from '@/types/digital-twin';
import { useDigitalTwinStore, selectJoint } from '@/stores/digital-twin-store';

// ─── Joint Slider Component ────────────────────────────────────────────────
// Bidirectional slider: user drags = commanded angle, readback = actual angle.

export function JointSlider({ jointId }: { jointId: JointId }) {
  const config = ARM_CONFIG[jointId];
  const joint = useDigitalTwinStore(selectJoint(jointId));
  const setCommanded = useDigitalTwinStore((s) => s.setCommandedAngle);
  const threshold = useDigitalTwinStore((s) => s.followingErrorThreshold);

  const followingError = Math.abs(joint.commandedAngle - joint.actualAngle);
  const errorSeverity = getSeverity(followingError, threshold, threshold * 2);

  // Position of actual angle as percentage
  const range = config.maxAngle - config.minAngle;
  const actualPercent = ((joint.actualAngle - config.minAngle) / range) * 100;

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCommanded(jointId, parseFloat(e.target.value));
    },
    [jointId, setCommanded]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) {
        setCommanded(jointId, val);
      }
    },
    [jointId, setCommanded]
  );

  return (
    <div className="dt-slider-container" id={`joint-slider-${jointId}`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`dt-led ${errorSeverity !== 'nominal' ? 'active' : ''}`}
            style={{ '--led-color': errorSeverity === 'critical' ? '#ef4444' : '#facc15' } as React.CSSProperties}
          />
          <span className="silkscreen-label" style={{ color: config.color }}>
            {config.name}
          </span>
          <span className="text-[0.55rem] text-[var(--color-text-muted)] font-mono uppercase">
            ({config.axis}-axis)
          </span>
        </div>

        {/* Digital numeric input */}
        <div className="dt-numeric-input">
          <input
            type="number"
            value={Math.round(joint.commandedAngle * 10) / 10}
            onChange={handleInputChange}
            min={config.minAngle}
            max={config.maxAngle}
            step={0.5}
            className="dt-numeric-field"
            aria-label={`${config.name} commanded angle`}
          />
          <span className="text-[0.55rem] text-[var(--color-text-muted)] font-mono">°</span>
        </div>
      </div>

      {/* Slider with readback track */}
      <div className="dt-slider-wrapper">
        {/* Actual angle readback indicator */}
        <div
          className="dt-slider-readback"
          style={{
            left: `${Math.max(0, Math.min(100, actualPercent))}%`,
            backgroundColor: errorSeverity === 'nominal' ? '#00ffff' : errorSeverity === 'warning' ? '#facc15' : '#ef4444',
          }}
        />

        {/* Main slider (commanded) */}
        <input
          type="range"
          min={config.minAngle}
          max={config.maxAngle}
          step={0.5}
          value={joint.commandedAngle}
          onChange={handleSliderChange}
          className="dt-slider-track"
          aria-label={`${config.name} angle control`}
        />
      </div>

      {/* Footer: limits and values */}
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[0.5rem] text-[var(--color-text-muted)] font-mono">
          {config.minAngle}°
        </span>
        <div className="flex items-center gap-3 text-[0.5rem] font-mono">
          <span style={{ color: config.color }}>
            CMD {joint.commandedAngle.toFixed(1)}°
          </span>
          <span style={{ color: '#00ffff' }}>
            ACT {joint.actualAngle.toFixed(1)}°
          </span>
          <span style={{ color: errorSeverity === 'nominal' ? '#6b7280' : errorSeverity === 'warning' ? '#facc15' : '#ef4444' }}>
            Δ{followingError.toFixed(1)}°
          </span>
        </div>
        <span className="text-[0.5rem] text-[var(--color-text-muted)] font-mono">
          {config.maxAngle}°
        </span>
      </div>
    </div>
  );
}
