// ─── Telemetry Generator ────────────────────────────────────────────────────
// Pure functions and a simulator class for mocking realistic hardware telemetry.
// No React dependency — consumed by the digital-twin-store via RAF loop.

import type { JointId, JointState } from '@/types/digital-twin';
import { ARM_CONFIG, JOINT_IDS } from '@/types/digital-twin';

// ─── Signal Generators ──────────────────────────────────────────────────────

/**
 * Simulate servo following behaviour: the actual angle chases the commanded
 * angle with a first-order lag, slight overshoot, and Gaussian noise.
 */
export function generateActualAngle(
  commanded: number,
  currentActual: number,
  dt: number,
  options: {
    /** Time constant in seconds (lower = faster response) */
    timeConstant?: number;
    /** Peak overshoot as fraction of step size */
    overshootFactor?: number;
    /** RMS noise in degrees */
    noiseDeg?: number;
  } = {}
): number {
  const {
    timeConstant = 0.15,
    overshootFactor = 0.05,
    noiseDeg = 0.3,
  } = options;

  const error = commanded - currentActual;
  const alpha = 1 - Math.exp(-dt / timeConstant);

  // First-order chase with slight overshoot
  const chase = currentActual + error * alpha * (1 + overshootFactor * Math.sign(error));

  // Add Gaussian noise (Box-Muller)
  const u1 = Math.random();
  const u2 = Math.random();
  const noise = noiseDeg * Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2);

  return chase + noise;
}

/**
 * Generate realistic torque based on angle, velocity, and gravitational load.
 * Shoulder and elbow joints bear more load at horizontal positions.
 */
export function generateTorque(
  jointId: JointId,
  angleDeg: number,
  velocityDegS: number
): number {
  const angleRad = (angleDeg * Math.PI) / 180;

  // Gravity-dependent torque (max when arm is horizontal)
  const gravityTorque = (() => {
    switch (jointId) {
      case 'base': return 0.1; // Base turntable — minimal gravity load
      case 'shoulder': return 8.0 * Math.cos(angleRad); // Heavy at horizontal
      case 'elbow': return 4.0 * Math.cos(angleRad);
      case 'wrist': return 1.0 * Math.cos(angleRad);
    }
  })();

  // Dynamic torque from acceleration (simplified)
  const dynamicTorque = Math.abs(velocityDegS) * 0.02;

  // Friction (Coulomb + viscous)
  const friction = 0.3 * Math.sign(velocityDegS) + 0.01 * velocityDegS;

  const noise = (Math.random() - 0.5) * 0.2;

  return Math.abs(gravityTorque) + dynamicTorque + Math.abs(friction) + noise;
}

/**
 * Generate motor temperature with thermal inertia.
 * Temperature rises proportionally to power dissipation (I²R) and decays toward ambient.
 */
export function generateTemperature(
  currentTemp: number,
  currentAmps: number,
  dt: number,
  options: {
    ambientC?: number;
    thermalResistance?: number; // °C/W
    thermalCapacity?: number;  // seconds (time constant)
    motorResistance?: number;  // Ohms
  } = {}
): number {
  const {
    ambientC = 25,
    thermalResistance = 2.5,
    thermalCapacity = 30,
    motorResistance = 1.2,
  } = options;

  const powerDissipated = currentAmps * currentAmps * motorResistance; // I²R
  const equilibriumTemp = ambientC + powerDissipated * thermalResistance;
  const alpha = 1 - Math.exp(-dt / thermalCapacity);

  return currentTemp + (equilibriumTemp - currentTemp) * alpha + (Math.random() - 0.5) * 0.1;
}

/**
 * Motor current proportional to torque output.
 */
export function generateCurrentDraw(torqueNm: number): number {
  const ktInverse = 0.8; // A/Nm (motor torque constant inverse)
  const quiescentCurrent = 0.15; // Amps at idle
  return quiescentCurrent + Math.abs(torqueNm) * ktInverse + (Math.random() - 0.5) * 0.05;
}

// ─── Telemetry Simulator (RAF Loop) ─────────────────────────────────────────

export type TelemetryUpdateCallback = (
  jointId: JointId,
  state: Partial<JointState>
) => void;

export type CommandedAngleGetter = () => Record<JointId, number>;

export class TelemetrySimulator {
  private rafId: number | null = null;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private targetHz: number;
  private stepInterval: number;

  // Internal state tracking (not in the store — avoids tight coupling)
  private actualAngles: Record<JointId, number>;
  private temperatures: Record<JointId, number>;
  private prevAngles: Record<JointId, number>;

  constructor(
    private onUpdate: TelemetryUpdateCallback,
    private getCommanded: CommandedAngleGetter,
    hz: number = 30
  ) {
    this.targetHz = hz;
    this.stepInterval = 1 / hz;

    // Initialise internal state
    this.actualAngles = { base: 0, shoulder: 0, elbow: 0, wrist: 0 };
    this.temperatures = { base: 25, shoulder: 25, elbow: 25, wrist: 25 };
    this.prevAngles = { base: 0, shoulder: 0, elbow: 0, wrist: 0 };
  }

  start(): void {
    if (this.rafId !== null) return;
    this.lastTime = performance.now() / 1000;
    this.tick();
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  setHz(hz: number): void {
    this.targetHz = hz;
    this.stepInterval = 1 / hz;
  }

  private tick = (): void => {
    const now = performance.now() / 1000;
    const frameDt = now - this.lastTime;
    this.lastTime = now;

    this.accumulator += frameDt;

    // Fixed-timestep loop to decouple from frame rate
    while (this.accumulator >= this.stepInterval) {
      this.step(this.stepInterval);
      this.accumulator -= this.stepInterval;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  private step(dt: number): void {
    const commanded = this.getCommanded();

    for (const jointId of JOINT_IDS) {
      const config = ARM_CONFIG[jointId];
      const cmd = commanded[jointId];

      // Generate actual angle with following dynamics
      const actual = generateActualAngle(
        cmd,
        this.actualAngles[jointId],
        dt,
        {
          timeConstant: jointId === 'base' ? 0.2 : 0.12,
          overshootFactor: 0.04,
          noiseDeg: 0.2,
        }
      );

      // Clamp to joint limits
      this.actualAngles[jointId] = Math.max(
        config.minAngle,
        Math.min(config.maxAngle, actual)
      );

      // Velocity (finite difference)
      const velocity = (this.actualAngles[jointId] - this.prevAngles[jointId]) / dt;
      this.prevAngles[jointId] = this.actualAngles[jointId];

      // Generate telemetry
      const torque = generateTorque(jointId, this.actualAngles[jointId], velocity);
      const current = generateCurrentDraw(torque);
      const temp = generateTemperature(this.temperatures[jointId], current, dt);
      this.temperatures[jointId] = temp;

      // Push update to store
      this.onUpdate(jointId, {
        actualAngle: this.actualAngles[jointId],
        torqueNm: Math.round(torque * 100) / 100,
        temperatureC: Math.round(temp * 10) / 10,
        currentAmps: Math.round(current * 100) / 100,
        velocity: Math.round(velocity * 10) / 10,
      });
    }
  }
}
