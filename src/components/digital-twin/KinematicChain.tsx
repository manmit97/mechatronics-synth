'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ARM_CONFIG, JOINT_IDS } from '@/types/digital-twin';
import type { JointId } from '@/types/digital-twin';
import { useDigitalTwinStore } from '@/stores/digital-twin-store';

// ─── Constants ──────────────────────────────────────────────────────────────

const DEG2RAD = Math.PI / 180;

const JOINT_COLORS: Record<JointId, string> = {
  base: '#3a4555',
  shoulder: '#2d3748',
  elbow: '#2d3748',
  wrist: '#3a4555',
};

const ACCENT_RING_COLOR: Record<JointId, string> = {
  base: '#00ffff',
  shoulder: '#4ade80',
  elbow: '#facc15',
  wrist: '#f87171',
};

// ─── Joint Axis Ring ────────────────────────────────────────────────────────
// Thin torus around each joint showing the rotation axis

function AxisRing({ jointId, radius }: { jointId: JointId; radius: number }) {
  return (
    <mesh rotation={ARM_CONFIG[jointId].axis === 'y' ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
      <torusGeometry args={[radius + 0.02, 0.008, 8, 48]} />
      <meshStandardMaterial
        color={ACCENT_RING_COLOR[jointId]}
        emissive={ACCENT_RING_COLOR[jointId]}
        emissiveIntensity={0.6}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

// ─── Kinematic Chain Component ──────────────────────────────────────────────
// Renders the ACTUAL state arm — solid, opaque, metallic.
// Each joint is a nested <group> establishing parent-child kinematic hierarchy.

export function KinematicChain() {
  const baseRef = useRef<THREE.Group>(null);
  const shoulderRef = useRef<THREE.Group>(null);
  const elbowRef = useRef<THREE.Group>(null);
  const wristRef = useRef<THREE.Group>(null);

  const refs: Record<JointId, React.RefObject<THREE.Group | null>> = {
    base: baseRef,
    shoulder: shoulderRef,
    elbow: elbowRef,
    wrist: wristRef,
  };

  // Animate joint rotations via useFrame (avoids React re-renders)
  useFrame(() => {
    const joints = useDigitalTwinStore.getState().joints;

    for (const jointId of JOINT_IDS) {
      const ref = refs[jointId];
      if (!ref.current) continue;

      const angle = joints[jointId].actualAngle * DEG2RAD;
      const axis = ARM_CONFIG[jointId].axis;

      if (axis === 'y') {
        ref.current.rotation.y = angle;
      } else if (axis === 'z') {
        ref.current.rotation.z = angle;
      } else {
        ref.current.rotation.x = angle;
      }
    }
  });

  const baseCfg = ARM_CONFIG.base;
  const shoulderCfg = ARM_CONFIG.shoulder;
  const elbowCfg = ARM_CONFIG.elbow;
  const wristCfg = ARM_CONFIG.wrist;

  return (
    <group>
      {/* ── Base Platform ──────────────────────────────────────────────── */}
      {/* Fixed base pedestal */}
      <mesh position={[0, baseCfg.linkLength / 4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[baseCfg.linkRadius * 1.2, baseCfg.linkRadius * 1.3, baseCfg.linkLength / 2, 32]} />
        <meshStandardMaterial color="#1e2530" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Rotating turntable */}
      <group ref={baseRef} position={[0, baseCfg.linkLength / 2, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[baseCfg.linkRadius, baseCfg.linkRadius, baseCfg.linkLength / 2, 32]} />
          <meshStandardMaterial color={JOINT_COLORS.base} metalness={0.8} roughness={0.2} />
        </mesh>
        <AxisRing jointId="base" radius={baseCfg.linkRadius} />

        {/* ── Shoulder Joint ────────────────────────────────────────── */}
        <group position={[0, baseCfg.linkLength / 4 + 0.05, 0]}>
          {/* Shoulder pivot hub */}
          <mesh castShadow>
            <sphereGeometry args={[shoulderCfg.linkRadius * 1.3, 16, 16]} />
            <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.3} />
          </mesh>
          <AxisRing jointId="shoulder" radius={shoulderCfg.linkRadius * 1.3} />

          <group ref={shoulderRef}>
            {/* Upper arm segment */}
            <mesh
              position={[0, shoulderCfg.linkLength / 2, 0]}
              castShadow
            >
              <boxGeometry args={[
                shoulderCfg.linkRadius * 2,
                shoulderCfg.linkLength,
                shoulderCfg.linkRadius * 1.5,
              ]} />
              <meshStandardMaterial color={JOINT_COLORS.shoulder} metalness={0.7} roughness={0.25} />
            </mesh>

            {/* ── Elbow Joint ──────────────────────────────────────── */}
            <group position={[0, shoulderCfg.linkLength, 0]}>
              {/* Elbow pivot hub */}
              <mesh castShadow>
                <sphereGeometry args={[elbowCfg.linkRadius * 1.2, 16, 16]} />
                <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.3} />
              </mesh>
              <AxisRing jointId="elbow" radius={elbowCfg.linkRadius * 1.2} />

              <group ref={elbowRef}>
                {/* Forearm segment */}
                <mesh
                  position={[0, elbowCfg.linkLength / 2, 0]}
                  castShadow
                >
                  <boxGeometry args={[
                    elbowCfg.linkRadius * 2,
                    elbowCfg.linkLength,
                    elbowCfg.linkRadius * 1.5,
                  ]} />
                  <meshStandardMaterial color={JOINT_COLORS.elbow} metalness={0.7} roughness={0.25} />
                </mesh>

                {/* ── Wrist Joint ────────────────────────────────── */}
                <group position={[0, elbowCfg.linkLength, 0]}>
                  {/* Wrist pivot hub */}
                  <mesh castShadow>
                    <sphereGeometry args={[wristCfg.linkRadius * 1.0, 16, 16]} />
                    <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.3} />
                  </mesh>
                  <AxisRing jointId="wrist" radius={wristCfg.linkRadius} />

                  <group ref={wristRef}>
                    {/* Toolhead shaft */}
                    <mesh
                      position={[0, wristCfg.linkLength / 2, 0]}
                      castShadow
                    >
                      <cylinderGeometry args={[
                        wristCfg.linkRadius * 0.6,
                        wristCfg.linkRadius,
                        wristCfg.linkLength,
                        16,
                      ]} />
                      <meshStandardMaterial color={JOINT_COLORS.wrist} metalness={0.8} roughness={0.2} />
                    </mesh>

                    {/* Toolhead tip (cone) */}
                    <mesh
                      position={[0, wristCfg.linkLength + 0.06, 0]}
                      castShadow
                    >
                      <coneGeometry args={[wristCfg.linkRadius * 0.5, 0.12, 12]} />
                      <meshStandardMaterial
                        color="#ef4444"
                        emissive="#ef4444"
                        emissiveIntensity={0.3}
                        metalness={0.5}
                        roughness={0.3}
                      />
                    </mesh>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
