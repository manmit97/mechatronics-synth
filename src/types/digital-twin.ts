// ─── Digital Twin Types ─────────────────────────────────────────────────────
// Core type definitions for the 3D Digital Twin kinematic system.
// Decoupled from rendering — consumed by stores, telemetry, and scene components.

// ─── Joint Identifiers ──────────────────────────────────────────────────────

export type JointId = 'base' | 'shoulder' | 'elbow' | 'wrist';

export const JOINT_IDS: JointId[] = ['base', 'shoulder', 'elbow', 'wrist'];

// ─── Joint Configuration (Static) ───────────────────────────────────────────

export type RotationAxis = 'x' | 'y' | 'z';

export interface JointConfig {
  id: JointId;
  name: string;
  axis: RotationAxis;
  minAngle: number;   // degrees
  maxAngle: number;   // degrees
  defaultAngle: number;
  linkLength: number;  // scene units (meters conceptually)
  linkRadius: number;  // visual radius of the arm segment
  color: string;       // accent color for this joint's overlay
}

// ─── 4-DOF Articulated Arm Configuration ────────────────────────────────────

export const ARM_CONFIG: Record<JointId, JointConfig> = {
  base: {
    id: 'base',
    name: 'Base',
    axis: 'y',
    minAngle: -180,
    maxAngle: 180,
    defaultAngle: 0,
    linkLength: 0.4,    // height of the base turntable
    linkRadius: 0.5,
    color: '#00ffff',   // Cyan (CH1)
  },
  shoulder: {
    id: 'shoulder',
    name: 'Shoulder',
    axis: 'z',
    minAngle: -90,
    maxAngle: 90,
    defaultAngle: 0,
    linkLength: 1.2,    // upper arm length
    linkRadius: 0.12,
    color: '#4ade80',   // Green (CH2)
  },
  elbow: {
    id: 'elbow',
    name: 'Elbow',
    axis: 'z',
    minAngle: -135,
    maxAngle: 0,
    defaultAngle: 0,
    linkLength: 1.0,    // forearm length
    linkRadius: 0.1,
    color: '#facc15',   // Yellow (CH3)
  },
  wrist: {
    id: 'wrist',
    name: 'Wrist',
    axis: 'z',
    minAngle: -90,
    maxAngle: 90,
    defaultAngle: 0,
    linkLength: 0.3,    // toolhead length
    linkRadius: 0.08,
    color: '#f87171',   // Red (CH4)
  },
};

// ─── Joint Runtime State ────────────────────────────────────────────────────

export interface JointState {
  commandedAngle: number;  // degrees — what the operator requested
  actualAngle: number;     // degrees — where the encoder reads
  torqueNm: number;        // Newton-metres
  temperatureC: number;    // Celsius
  currentAmps: number;     // Amperes
  velocity: number;        // degrees/second
}

// ─── Telemetry Overlay Node ─────────────────────────────────────────────────

export interface TelemetryNode {
  jointId: JointId;
  label: string;
  value: number;
  unit: string;
  warningThreshold: number;
  criticalThreshold: number;
}

// ─── Operating Modes ────────────────────────────────────────────────────────

export type DigitalTwinMode = 'manual' | 'playback' | 'live';

// ─── Telemetry History (for sparklines) ─────────────────────────────────────

export interface TelemetrySnapshot {
  timestamp: number;
  joints: Record<JointId, JointState>;
}

// ─── Severity Levels ────────────────────────────────────────────────────────

export type SeverityLevel = 'nominal' | 'warning' | 'critical';

export function getSeverity(
  value: number,
  warningThreshold: number,
  criticalThreshold: number
): SeverityLevel {
  if (value >= criticalThreshold) return 'critical';
  if (value >= warningThreshold) return 'warning';
  return 'nominal';
}

// ─── Default Joint State Factory ────────────────────────────────────────────

export function createDefaultJointState(jointId: JointId): JointState {
  const config = ARM_CONFIG[jointId];
  return {
    commandedAngle: config.defaultAngle,
    actualAngle: config.defaultAngle,
    torqueNm: 0,
    temperatureC: 25,
    currentAmps: 0,
    velocity: 0,
  };
}

export function createDefaultJointStates(): Record<JointId, JointState> {
  return {
    base: createDefaultJointState('base'),
    shoulder: createDefaultJointState('shoulder'),
    elbow: createDefaultJointState('elbow'),
    wrist: createDefaultJointState('wrist'),
  };
}
