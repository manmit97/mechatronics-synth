'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ARM_CONFIG, JOINT_IDS, getSeverity } from '@/types/digital-twin';
import type { JointId, SeverityLevel } from '@/types/digital-twin';
import { useDigitalTwinStore } from '@/stores/digital-twin-store';

// ─── Severity Colours ───────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  nominal: '#00ffff',
  warning: '#facc15',
  critical: '#ef4444',
};

const SEVERITY_BG: Record<SeverityLevel, string> = {
  nominal: 'rgba(0, 255, 255, 0.08)',
  warning: 'rgba(250, 204, 21, 0.12)',
  critical: 'rgba(239, 68, 68, 0.15)',
};

const SEVERITY_BORDER: Record<SeverityLevel, string> = {
  nominal: 'rgba(0, 255, 255, 0.25)',
  warning: 'rgba(250, 204, 21, 0.5)',
  critical: 'rgba(239, 68, 68, 0.6)',
};

// ─── Single Joint Overlay ───────────────────────────────────────────────────

function JointOverlay({ jointId }: { jointId: JointId }) {
  const config = ARM_CONFIG[jointId];
  const joint = useDigitalTwinStore((s) => s.joints[jointId]);
  const threshold = useDigitalTwinStore((s) => s.followingErrorThreshold);

  const followingError = Math.abs(joint.commandedAngle - joint.actualAngle);

  // Determine severity levels
  const torqueSeverity = getSeverity(joint.torqueNm, 5, 10);
  const tempSeverity = getSeverity(joint.temperatureC, 55, 75);
  const errorSeverity = getSeverity(followingError, threshold, threshold * 2);

  // Overall severity = worst of all
  const overallSeverity: SeverityLevel =
    [torqueSeverity, tempSeverity, errorSeverity].includes('critical')
      ? 'critical'
      : [torqueSeverity, tempSeverity, errorSeverity].includes('warning')
        ? 'warning'
        : 'nominal';

  const borderColor = SEVERITY_BORDER[overallSeverity];
  const bgColor = SEVERITY_BG[overallSeverity];
  const accentColor = SEVERITY_COLORS[overallSeverity];

  return (
    <div
      className="dt-overlay"
      style={{
        borderColor,
        backgroundColor: bgColor,
        '--dt-accent': accentColor,
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className={`dt-led ${overallSeverity !== 'nominal' ? 'active' : ''}`}
          style={{ '--led-color': accentColor } as React.CSSProperties}
        />
        <span
          className="silkscreen-label"
          style={{ color: config.color, fontSize: '0.6rem' }}
        >
          {config.name}
        </span>
      </div>

      {/* Telemetry rows */}
      <div className="dt-overlay-grid">
        <TelemetryRow
          label="τ"
          value={joint.torqueNm.toFixed(1)}
          unit="Nm"
          severity={torqueSeverity}
        />
        <TelemetryRow
          label="T"
          value={joint.temperatureC.toFixed(0)}
          unit="°C"
          severity={tempSeverity}
        />
        <TelemetryRow
          label="I"
          value={joint.currentAmps.toFixed(2)}
          unit="A"
          severity="nominal"
        />
        <TelemetryRow
          label="Δ"
          value={followingError.toFixed(1)}
          unit="°"
          severity={errorSeverity}
        />
      </div>
    </div>
  );
}

// ─── Telemetry Row ──────────────────────────────────────────────────────────

function TelemetryRow({
  label,
  value,
  unit,
  severity,
}: {
  label: string;
  value: string;
  unit: string;
  severity: SeverityLevel;
}) {
  return (
    <div className="dt-telemetry-row">
      <span className="dt-telemetry-label">{label}</span>
      <span
        className="dt-telemetry-value"
        style={{ color: SEVERITY_COLORS[severity] }}
      >
        {value}
      </span>
      <span className="dt-telemetry-unit">{unit}</span>
    </div>
  );
}

// ─── Overlay Position Calculator ────────────────────────────────────────────
// Compute world-space positions by walking the kinematic chain.

function getJointWorldPosition(
  jointId: JointId,
  jointAngles: Record<JointId, number>
): [number, number, number] {
  const DEG2RAD = Math.PI / 180;
  const baseCfg = ARM_CONFIG.base;
  const shoulderCfg = ARM_CONFIG.shoulder;
  const elbowCfg = ARM_CONFIG.elbow;
  const wristCfg = ARM_CONFIG.wrist;

  // Base is at the top of the base column
  const baseY = baseCfg.linkLength / 2;
  const shoulderBaseY = baseY + baseCfg.linkLength / 4 + 0.05;

  if (jointId === 'base') {
    return [baseCfg.linkRadius + 0.4, baseY, 0];
  }

  const baseAngle = jointAngles.base * DEG2RAD;
  const shoulderAngle = jointAngles.shoulder * DEG2RAD;
  const elbowAngle = jointAngles.elbow * DEG2RAD;

  if (jointId === 'shoulder') {
    const x = Math.sin(baseAngle) * 0.4;
    const z = Math.cos(baseAngle) * 0.4;
    return [x, shoulderBaseY, z];
  }

  // Shoulder end (elbow position)
  const shoulderEndY = shoulderBaseY + shoulderCfg.linkLength * Math.cos(shoulderAngle);
  const shoulderEndH = shoulderCfg.linkLength * Math.sin(shoulderAngle);
  const shoulderEndX = Math.sin(baseAngle) * shoulderEndH;
  const shoulderEndZ = Math.cos(baseAngle) * shoulderEndH;

  if (jointId === 'elbow') {
    return [
      shoulderEndX + Math.sin(baseAngle) * 0.3,
      shoulderEndY,
      shoulderEndZ + Math.cos(baseAngle) * 0.3,
    ];
  }

  // Elbow end (wrist position)
  const combinedAngle = shoulderAngle + elbowAngle;
  const elbowEndY = shoulderEndY + elbowCfg.linkLength * Math.cos(combinedAngle);
  const elbowEndH = elbowCfg.linkLength * Math.sin(combinedAngle);
  const elbowEndX = shoulderEndX + Math.sin(baseAngle) * elbowEndH;
  const elbowEndZ = shoulderEndZ + Math.cos(baseAngle) * elbowEndH;

  return [
    elbowEndX + Math.sin(baseAngle) * 0.3,
    elbowEndY,
    elbowEndZ + Math.cos(baseAngle) * 0.3,
  ];
}

// ─── Spatial Overlays Container ─────────────────────────────────────────────

export function SpatialOverlays() {
  const showOverlays = useDigitalTwinStore((s) => s.showOverlays);
  const joints = useDigitalTwinStore((s) => s.joints);

  if (!showOverlays) return null;

  // Get actual angles for position calculation
  const actualAngles = {
    base: joints.base.actualAngle,
    shoulder: joints.shoulder.actualAngle,
    elbow: joints.elbow.actualAngle,
    wrist: joints.wrist.actualAngle,
  };

  return (
    <group>
      {JOINT_IDS.map((jointId) => {
        const pos = getJointWorldPosition(jointId, actualAngles);
        return (
          <Html
            key={jointId}
            position={pos}
            center
            distanceFactor={8}
            style={{
              pointerEvents: 'none',
              transition: 'opacity 0.2s ease',
            }}
          >
            <JointOverlay jointId={jointId} />
          </Html>
        );
      })}
    </group>
  );
}
